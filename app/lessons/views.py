import os
import tempfile
import logging
from rest_framework import viewsets, status
from rest_framework.decorators import action
from rest_framework.response import Response
from rest_framework.parsers import MultiPartParser, FormParser
from django.utils import timezone

from app.lessons.models import Lesson, Group, Course, Enrollment, Attendance, Material
from app.lessons.serializers import (
    LessonVideoUploadSerializer, LessonSerializer, GroupSerializer,
    CourseSerializer, EnrollmentSerializer, AttendanceSerializer, MaterialSerializer
)
from app.common.services.youtube import YouTubeService
from app.common.services.exceptions import YouTubeError
from app.lessons.tasks import upload_lesson_video_to_youtube_task

logger = logging.getLogger(__name__)

class GroupViewSet(viewsets.ModelViewSet):
    serializer_class = GroupSerializer

    def get_queryset(self):
        user = self.request.user
        queryset = Group.objects.all()
        if hasattr(user, 'role') and user.role == 'student':
            active_group_ids = Enrollment.objects.filter(student=user, status='active').values_list('group_id', flat=True)
            queryset = queryset.filter(id__in=active_group_ids)
        elif hasattr(user, 'role') and user.role == 'teacher':
            queryset = queryset.filter(teacher=user)
        return queryset

    @action(detail=True, methods=['get'])
    def students(self, request, pk=None):
        """
        Returns all active students enrolled in this group.
        Usage: GET /api/groups/{id}/students/
        """
        group = self.get_object()
        enrollments = group.enrollments.filter(status='active')
        students_list = []
        for e in enrollments:
            students_list.append({
                "id": e.student.id,
                "username": e.student.username,
                "full_name": e.student.get_full_name() or e.student.username
            })
        return Response(students_list, status=status.HTTP_200_OK)


class LessonViewSet(viewsets.ModelViewSet):
    """
    ViewSet to manage Lesson objects and handle video uploads.
    Follows SOLID principles: delegates API communication to YouTubeService,
    validation to LessonVideoUploadSerializer, and keeps view logic clean.
    """
    serializer_class = LessonSerializer

    def get_queryset(self):
        user = self.request.user
        queryset = Lesson.objects.all()
        if hasattr(user, 'role') and user.role == 'student':
            active_group_ids = Enrollment.objects.filter(student=user, status='active').values_list('group_id', flat=True)
            queryset = queryset.filter(group_id__in=active_group_ids)
        elif hasattr(user, 'role') and user.role == 'teacher':
            queryset = queryset.filter(group__teacher=user)

        group_id = self.request.query_params.get('group')
        if group_id:
            queryset = queryset.filter(group_id=group_id)
        return queryset


    @action(
        detail=True,
        methods=['post'],
        parser_classes=[MultiPartParser, FormParser],
        url_path='upload-video'
    )
    def upload_video(self, request, pk=None):
        """
        Uploads a video to YouTube for a specific lesson via a Celery background task.
        Saves the file locally, updates the model, and delegates the heavy lifting
        (FFmpeg conversion + chunked YouTube upload) to the async worker.
        """
        lesson = self.get_object()
        
        serializer = LessonVideoUploadSerializer(data=request.data)
        serializer.is_valid(raise_exception=True)

        video_file = serializer.validated_data['video_file']
        title = serializer.validated_data.get('title') or f"Lesson: {lesson.topic}"
        description = serializer.validated_data.get('description') or f"Video lesson for {lesson.group.name}"

        # Save to local temporary file that will be deleted by the Celery worker
        file_suffix = os.path.splitext(video_file.name)[1]
        with tempfile.NamedTemporaryFile(suffix=file_suffix, delete=False) as temp_file:
            for chunk in video_file.chunks():
                temp_file.write(chunk)
            temp_file_path = temp_file.name

        try:
            # Update the lesson state and associate the local file path
            lesson.upload_status = 'uploading'
            lesson.local_file_path = temp_file_path
            lesson.save()

            # Trigger background Celery task
            upload_lesson_video_to_youtube_task.delay(lesson.id, request.tenant.schema_name)

            return Response({
                "message": "Upload initiated. Video is being processed in the background.",
                "upload_status": lesson.upload_status
            }, status=status.HTTP_202_ACCEPTED)

        except Exception as e:
            logger.error(f"Failed to initiate background upload: {str(e)}")
            # Cleanup immediately if queueing fails
            if os.path.exists(temp_file_path):
                os.remove(temp_file_path)
            
            lesson.upload_status = 'failed'
            lesson.failure_reason = f"Queueing failed: {str(e)}"
            lesson.save()
            
            return Response(
                {"error": f"Failed to start upload: {str(e)}"},
                status=status.HTTP_500_INTERNAL_SERVER_ERROR
            )

class CourseViewSet(viewsets.ModelViewSet):
    queryset = Course.objects.all()
    serializer_class = CourseSerializer

class EnrollmentViewSet(viewsets.ModelViewSet):
    serializer_class = EnrollmentSerializer

    def get_queryset(self):
        user = self.request.user
        queryset = Enrollment.objects.all()
        if hasattr(user, 'role') and user.role == 'student':
            queryset = queryset.filter(student=user)
        return queryset

class AttendanceViewSet(viewsets.ModelViewSet):
    queryset = Attendance.objects.all()
    serializer_class = AttendanceSerializer

class MaterialViewSet(viewsets.ModelViewSet):
    queryset = Material.objects.all()
    serializer_class = MaterialSerializer
