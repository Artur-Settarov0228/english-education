import os
import tempfile
import logging
from rest_framework import viewsets, status
from rest_framework.decorators import action
from rest_framework.response import Response
from rest_framework.parsers import MultiPartParser, FormParser
from django.utils import timezone

from app.lessons.models import Lesson, Group
from app.lessons.serializers import LessonVideoUploadSerializer, LessonSerializer, GroupSerializer
from app.common.services.youtube import YouTubeService
from app.common.services.exceptions import YouTubeError

logger = logging.getLogger(__name__)

class GroupViewSet(viewsets.ModelViewSet):
    queryset = Group.objects.all()
    serializer_class = GroupSerializer

class LessonViewSet(viewsets.ModelViewSet):
    """
    ViewSet to manage Lesson objects and handle video uploads.
    Follows SOLID principles: delegates API communication to YouTubeService,
    validation to LessonVideoUploadSerializer, and keeps view logic clean.
    """
    queryset = Lesson.objects.all()
    serializer_class = LessonSerializer


    @action(
        detail=True,
        methods=['post'],
        parser_classes=[MultiPartParser, FormParser],
        url_path='upload-video'
    )
    def upload_video(self, request, pk=None):
        """
        Uploads a video to YouTube for a specific lesson.
        Saves the file to a temporary location on disk to obtain a local path,
        initiates the YouTube upload service, saves the video details on the model,
        and cleans up the local file afterwards.
        """
        lesson = self.get_object()
        
        serializer = LessonVideoUploadSerializer(data=request.data)
        serializer.is_valid(raise_exception=True)

        video_file = serializer.validated_data['video_file']
        title = serializer.validated_data.get('title') or f"Lesson: {lesson.topic}"
        description = serializer.validated_data.get('description') or f"Video lesson for {lesson.group.name}"

        # Step 1: Set lesson upload status to uploading
        lesson.upload_status = 'uploading'
        lesson.save()

        # Step 2: Write Django UploadedFile to a temporary local disk file.
        # This is necessary because Django might read smaller files into memory (InMemoryUploadedFile),
        # whereas YouTube client requires a physical file path for media chunking.
        file_suffix = os.path.splitext(video_file.name)[1]
        with tempfile.NamedTemporaryFile(suffix=file_suffix, delete=False) as temp_file:
            for chunk in video_file.chunks():
                temp_file.write(chunk)
            temp_file_path = temp_file.name

        try:
            # Step 3: Call the YouTube upload service
            yt_service = YouTubeService()
            result = yt_service.upload_video(
                file_path=temp_file_path,
                title=title,
                description=description,
                privacy="unlisted"
            )

            # Step 4: Save the video information to the database
            lesson.youtube_video_id = result['video_id']
            lesson.youtube_url = result['url']
            lesson.upload_status = 'uploaded'
            lesson.uploaded_at = timezone.now()
            lesson.save()

            return Response({
                "message": "Lesson video uploaded to YouTube successfully.",
                "youtube_video_id": result['video_id'],
                "youtube_url": result['url'],
                "upload_status": lesson.upload_status
            }, status=status.HTTP_200_OK)

        except YouTubeError as e:
            # Handle specific service exceptions
            logger.error(f"YouTube Service Error during upload: {str(e)}")
            lesson.upload_status = 'failed'
            lesson.save()
            return Response(
                {"error": f"YouTube Upload Failed: {str(e)}"},
                status=status.HTTP_400_BAD_REQUEST
            )
        except Exception as e:
            # Handle any other unhandled integration exceptions
            logger.error(f"Unhandled Error during YouTube upload: {str(e)}")
            lesson.upload_status = 'failed'
            lesson.save()
            return Response(
                {"error": "An unexpected error occurred during the upload process."},
                status=status.HTTP_500_INTERNAL_SERVER_ERROR
            )
        finally:
            # Double safety check: ensure the temporary file is deleted if the service failed to delete it
            if os.path.exists(temp_file_path):
                try:
                    os.remove(temp_file_path)
                    logger.info(f"Cleaned up temporary file in views finally block: {temp_file_path}")
                except Exception as e:
                    logger.error(f"Failed to delete temp file in views finally block: {str(e)}")
