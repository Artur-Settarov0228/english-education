import os
from rest_framework import serializers

class LessonVideoUploadSerializer(serializers.Serializer):
    """
    Serializer to handle incoming video uploads for lessons.
    Performs standard client input validations.
    """
    video_file = serializers.FileField(write_only=True)
    title = serializers.CharField(max_length=200, required=False, allow_blank=True)
    description = serializers.CharField(max_length=5000, required=False, allow_blank=True)

    def validate_video_file(self, value):
        # Limit size to 500MB (adjust as necessary)
        max_size = 500 * 1024 * 1024  # 500MB
        if value.size > max_size:
            raise serializers.ValidationError("File size exceeds the 500MB limit.")

        # Limit to common video formats
        allowed_extensions = ['.mp4', '.avi', '.mov', '.mkv', '.webm']
        ext = os.path.splitext(value.name)[1].lower()
        if ext not in allowed_extensions:
            raise serializers.ValidationError(
                f"Unsupported file format '{ext}'. Allowed formats: {', '.join(allowed_extensions)}"
            )

        return value

from app.lessons.models import Lesson, Group

class GroupSerializer(serializers.ModelSerializer):
    class Meta:
        model = Group
        fields = '__all__'

class LessonSerializer(serializers.ModelSerializer):
    group_name = serializers.CharField(source='group.name', read_only=True)

    class Meta:
        model = Lesson
        fields = [
            'id', 'group', 'group_name', 'date', 'start_time', 'end_time', 
            'topic', 'youtube_video_id', 'youtube_url', 'upload_status', 'uploaded_at'
        ]

