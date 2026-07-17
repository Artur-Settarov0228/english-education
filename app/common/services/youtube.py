import os
import time
import logging
from googleapiclient.discovery import build
from googleapiclient.http import MediaFileUpload
from googleapiclient.errors import HttpError
from google.oauth2.credentials import Credentials
from google.auth.transport.requests import Request
from django.conf import settings

from app.common.services.exceptions import (
    YouTubeAuthenticationError,
    YouTubeUploadError,
    YouTubeFileError,
)

logger = logging.getLogger(__name__)

class YouTubeService:
    """
    Service class to handle all YouTube Data API v3 operations.
    Follows SOLID principles and handles authentication, chunked resumable uploads,
    and automatic cleanup of temporary files.
    """
    def __init__(self):
        self.credentials_path = getattr(settings, 'YOUTUBE_CREDENTIALS_FILE', None)
        self.token_path = getattr(settings, 'YOUTUBE_TOKEN_FILE', None)
        self.creds = None
        self._authenticate()

    def _authenticate(self):
        """
        Loads user credentials from the token file. Refreshes them if expired.
        Raises YouTubeAuthenticationError if authentication cannot be established.
        """
        if not self.token_path or not os.path.exists(self.token_path):
            raise YouTubeAuthenticationError(
                f"YouTube OAuth token file not found at '{self.token_path}'. "
                "Please run the 'youtube_auth' management command to authenticate."
            )

        try:
            self.creds = Credentials.from_authorized_user_file(self.token_path)
        except Exception as e:
            raise YouTubeAuthenticationError(f"Failed to load YouTube credentials: {str(e)}")

        # If there are no valid credentials available, attempt to refresh them
        if not self.creds or not self.creds.valid:
            if self.creds and self.creds.expired and self.creds.refresh_token:
                try:
                    logger.info("YouTube credentials expired. Attempting to refresh...")
                    self.creds.refresh(Request())
                    
                    # Save the refreshed credentials back to token.json
                    with open(self.token_path, 'w') as token_file:
                        token_file.write(self.creds.to_json())
                    logger.info("YouTube credentials refreshed and saved successfully.")
                except Exception as e:
                    raise YouTubeAuthenticationError(f"Failed to refresh YouTube credentials: {str(e)}")
            else:
                raise YouTubeAuthenticationError(
                    "YouTube credentials are invalid or expired, and no refresh token is available. "
                    "Please run the 'youtube_auth' management command to re-authenticate."
                )

    def upload_video(self, file_path, title, description, privacy="unlisted"):
        """
        Uploads a local video file to YouTube via resumable chunked upload.
        
        Args:
            file_path (str): The absolute path to the local video file.
            title (str): Title of the YouTube video.
            description (str): Description of the YouTube video.
            privacy (str): Privacy status: 'public', 'private', or 'unlisted'. Defaults to 'unlisted'.
            
        Returns:
            dict: Containing video_id, url, and status ('uploaded').
            
        Raises:
            YouTubeFileError: If the video file is missing or unreadable.
            YouTubeUploadError: If any error occurs during the API call.
        """
        if not os.path.exists(file_path):
            raise YouTubeFileError(f"Video file not found at path: {file_path}")

        try:
            # Build the YouTube API service
            service = build('youtube', 'v3', credentials=self.creds)

            # Metadata body
            body = {
                'snippet': {
                    'title': title,
                    'description': description,
                    'categoryId': '27',  # Default Category 27 = 'Education'
                },
                'status': {
                    'privacyStatus': privacy,
                    'selfDeclaredMadeForKids': False
                }
            }

            # Define chunk size (e.g., 5MB - must be a multiple of 256 KB)
            chunksize = 5 * 1024 * 1024
            media = MediaFileUpload(
                file_path,
                mimetype='video/*',
                chunksize=chunksize,
                resumable=True
            )

            # Prepare the upload request
            request = service.videos().insert(
                part='snippet,status',
                body=body,
                media_body=media
            )

            logger.info(f"Starting resumable YouTube upload for file: {file_path}")
            
            response = None
            error_count = 0
            max_errors = 5
            backoff = 1

            while response is None:
                try:
                    status, response = request.next_chunk()
                    if status:
                        progress = int(status.progress() * 100)
                        logger.info(f"Upload progress: {progress}% completed.")
                    # Reset backoff on successful chunk upload
                    backoff = 1
                    error_count = 0
                except HttpError as e:
                    if e.resp.status in [500, 502, 503, 504]:
                        error_count += 1
                        if error_count > max_errors:
                            logger.error(f"YouTube upload failed due to persistent temporary server error 50x: {str(e)}")
                            raise
                        logger.warning(f"Temporary server error (50x). Retrying chunk in {backoff} seconds...")
                        time.sleep(backoff)
                        backoff *= 2
                    else:
                        logger.error(f"YouTube upload failed due to critical client error: {e.content}")
                        raise
                except Exception as e:
                    error_count += 1
                    if error_count > max_errors:
                        logger.error(f"YouTube upload failed due to persistent network issues: {str(e)}")
                        raise
                    logger.warning(f"Connection glitch during chunk upload. Retrying chunk in {backoff} seconds: {str(e)}")
                    time.sleep(backoff)
                    backoff *= 2

            video_id = response.get('id')
            if not video_id:
                raise YouTubeUploadError("YouTube response did not return a video ID.")

            video_url = f"https://www.youtube.com/watch?v={video_id}"
            logger.info(f"Upload finished. Video ID: {video_id}, URL: {video_url}")

            return {
                "video_id": video_id,
                "url": video_url,
                "status": "uploaded"
            }

        except HttpError as e:
            error_msg = e.content.decode('utf-8') if e.content else str(e)
            logger.error(f"YouTube API HttpError: {error_msg}")
            raise YouTubeUploadError(f"YouTube API error: {error_msg}")
        except Exception as e:
            logger.error(f"Unexpected error during YouTube upload: {str(e)}")
            raise YouTubeUploadError(f"YouTube upload failed: {str(e)}")
        finally:
            # DO NOT delete local file here. The file will be cleaned up by the periodic Celery task
            # only after the video finishes processing on YouTube.
            logger.info("resumable upload attempt finalized (local file retained for verification/processing).")

    def check_processing_status(self, video_id: str) -> dict:
        """
        Retrieves processing details of a video from the YouTube API.
        
        Args:
            video_id (str): YouTube video ID.
            
        Returns:
            dict: Containing processing status ('succeeded', 'failed', 'processing') and metadata.
        """
        try:
            service = build('youtube', 'v3', credentials=self.creds)
            request = service.videos().list(
                part="status,processingDetails",
                id=video_id
            )
            response = request.execute()
            
            items = response.get('items', [])
            if not items:
                logger.warning(f"No video found on YouTube with ID: {video_id}")
                return {
                    'status': 'not_found',
                    'failure_reason': 'Video not found on YouTube'
                }
                
            video_item = items[0]
            status_info = video_item.get('status', {})
            proc_details = video_item.get('processingDetails', {})
            
            upload_status = status_info.get('uploadStatus')
            proc_status = proc_details.get('processingStatus')
            
            logger.info(f"YouTube processing check for {video_id}: uploadStatus={upload_status}, processingStatus={proc_status}")
            
            # YouTube status values:
            # proc_status: 'succeeded', 'failed', 'processing', None
            # upload_status: 'uploaded', 'processed', 'failed', 'rejected'
            
            if proc_status == 'succeeded' or upload_status == 'processed':
                return {
                    'status': 'succeeded',
                    'failure_reason': None
                }
            elif proc_status == 'failed' or upload_status in ['failed', 'rejected']:
                reason = status_info.get('failureReason') or proc_details.get('processingFailureReason') or 'Unknown processing error'
                return {
                    'status': 'failed',
                    'failure_reason': reason
                }
            else:
                return {
                    'status': 'processing',
                    'failure_reason': None
                }
                
        except Exception as e:
            logger.error(f"Error checking YouTube video status for {video_id}: {str(e)}")
            raise

