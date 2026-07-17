import os
import logging
from django.utils import timezone
from app.lessons.models import Lesson
from app.common.services.ffmpeg import FFmpegService
from app.common.services.youtube import YouTubeService

logger = logging.getLogger(__name__)

class YoutubeProcessingService:
    """
    Service to coordinate the processing, conversion, and upload of video lessons to YouTube.
    Following SOLID principles, this service coordinates FFmpegService and YouTubeService.
    """

    def __init__(self, ffmpeg_service: FFmpegService = None, youtube_service: YouTubeService = None):
        self.ffmpeg_service = ffmpeg_service or FFmpegService()
        self.youtube_service = youtube_service or YouTubeService()

    def process_and_upload(self, lesson: Lesson, file_path: str) -> None:
        """
        Coordinates the entire pipeline:
        1. Analyzes the local video file.
        2. Converts the video if it is not H.264/AAC.
        3. Uploads the processed video file to YouTube.
        4. Triggers the background processing checks.
        """
        logger.info(f"Video received. Starting pipeline for Lesson ID: {lesson.id}, file: {file_path}")

        active_file_path = file_path

        # 1. Analyze video
        try:
            analysis = self.ffmpeg_service.analyze(active_file_path)
        except Exception as e:
            logger.error(f"Failed to analyze video file {active_file_path}: {str(e)}")
            raise

        # 2. Check if conversion is required (Not H.264 or not AAC)
        is_h264 = analysis.get('codec') == 'h264'
        is_aac = analysis.get('audio_codec') == 'aac'

        if not (is_h264 and is_aac):
            logger.info(f"Video conversion required. H.264={is_h264}, AAC={is_aac}")
            dir_name = os.path.dirname(active_file_path)
            base_name = os.path.basename(active_file_path)
            name_part, _ = os.path.splitext(base_name)
            converted_path = os.path.join(dir_name, f"converted_{name_part}.mp4")

            try:
                self.ffmpeg_service.convert(active_file_path, converted_path)
                logger.info(f"Video converted. New path: {converted_path}")

                # Delete original file to save disk space
                if os.path.exists(active_file_path):
                    os.remove(active_file_path)
                    logger.info(f"Local file deleted (original raw upload): {active_file_path}")

                active_file_path = converted_path
                # Update lesson model's path reference
                lesson.local_file_path = active_file_path
                lesson.save()
            except Exception as e:
                logger.error(f"FFmpeg conversion failed for {active_file_path}: {str(e)}")
                # Make sure to clean up converted path if partial failure
                if os.path.exists(converted_path):
                    os.remove(converted_path)
                raise
        else:
            logger.info("Video is already in target H.264/AAC format. Skipping conversion.")

        # 3. Resumable Upload to YouTube
        logger.info(f"Upload started. Target path: {active_file_path}")
        title = f"Lesson: {lesson.topic}"
        description = f"Video lesson for group {lesson.group.name}"

        try:
            result = self.youtube_service.upload_video(
                file_path=active_file_path,
                title=title,
                description=description,
                privacy="unlisted"
            )

            video_id = result['video_id']
            video_url = result['url']
            
            logger.info(f"Upload finished. YouTube Video ID: {video_id}, URL: {video_url}")

            # Save info to lesson model and mark as PROCESSING
            lesson.youtube_video_id = video_id
            lesson.youtube_url = video_url
            lesson.upload_status = 'PROCESSING'
            lesson.uploaded_at = timezone.now()
            lesson.save()
            
            logger.info(f"Waiting for processing on YouTube. Lesson status: PROCESSING. Video ID: {video_id}")

        except Exception as e:
            logger.error(f"YouTube upload failed for lesson {lesson.id}: {str(e)}")
            raise
