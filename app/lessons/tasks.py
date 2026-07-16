import os
import logging
from celery import shared_task
from django.utils import timezone
from app.lessons.models import Lesson
from app.common.services.youtube import YouTubeService
from app.common.services.exceptions import YouTubeError

logger = logging.getLogger(__name__)

@shared_task(bind=True, max_retries=3, default_retry_delay=60)
def upload_lesson_video_to_youtube_task(self, lesson_id, temp_file_path, title, description):
    """
    Celery background task to upload a lesson video to YouTube.
    
    This is highly recommended in production to prevent blocking the Django HTTP
    request-response cycle, avoiding client gateway timeouts (504).
    
    Usage in view:
        # Instead of calling service inside the view:
        upload_lesson_video_to_youtube_task.delay(
            lesson_id=lesson.id,
            temp_file_path=temp_file_path,
            title=title,
            description=description
        )
    """
    logger.info(f"Starting Celery background YouTube upload task for Lesson ID: {lesson_id}")
    
    try:
        lesson = Lesson.objects.get(id=lesson_id)
    except Lesson.DoesNotExist:
        logger.error(f"Lesson with ID {lesson_id} does not exist. Aborting upload.")
        # If the file exists, delete it to prevent storage leaks
        if os.path.exists(temp_file_path):
            try:
                os.remove(temp_file_path)
            except Exception as e:
                logger.error(f"Failed to delete temp file {temp_file_path}: {str(e)}")
        return

    # Update state to uploading
    lesson.upload_status = 'uploading'
    lesson.save()

    try:
        # Perform upload
        yt_service = YouTubeService()
        result = yt_service.upload_video(
            file_path=temp_file_path,
            title=title,
            description=description,
            privacy="unlisted"
        )

        # Save success details
        lesson.youtube_video_id = result['video_id']
        lesson.youtube_url = result['url']
        lesson.upload_status = 'uploaded'
        lesson.uploaded_at = timezone.now()
        lesson.save()
        logger.info(f"Celery background upload succeeded for Lesson ID: {lesson_id}")

    except YouTubeError as e:
        logger.error(f"YouTube Service Error during background upload (Lesson {lesson_id}): {str(e)}")
        # Check if we should retry or fail
        try:
            # Retries the task in case of transient issues (e.g. network glitch)
            self.retry(exc=e)
        except self.MaxRetriesExceededError:
            lesson.upload_status = 'failed'
            lesson.save()
            # Clean up local file since retries are exhausted
            if os.path.exists(temp_file_path):
                try:
                    os.remove(temp_file_path)
                except Exception as del_err:
                    logger.error(f"Failed to delete temp file after max retries: {str(del_err)}")

    except Exception as e:
        logger.error(f"Unhandled Exception during background upload (Lesson {lesson_id}): {str(e)}")
        lesson.upload_status = 'failed'
        lesson.save()
        # Clean up local file
        if os.path.exists(temp_file_path):
            try:
                os.remove(temp_file_path)
            except Exception as del_err:
                logger.error(f"Failed to delete temp file: {str(del_err)}")
