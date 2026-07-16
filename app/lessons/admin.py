from django.contrib import admin
from .models import Course, Group, Enrollment, Lesson, Attendance, Material

@admin.register(Course)
class CourseAdmin(admin.ModelAdmin):
    list_display = ['name', 'monthly_price', 'created_at']
    search_fields = ['name']

@admin.register(Group)
class GroupAdmin(admin.ModelAdmin):
    list_display = ['name', 'course', 'teacher', 'status', 'created_at']
    list_filter = ['status', 'course', 'teacher']
    search_fields = ['name']

@admin.register(Enrollment)
class EnrollmentAdmin(admin.ModelAdmin):
    list_display = ['student', 'group', 'status', 'joined_date']
    list_filter = ['status', 'group']
    search_fields = ['student__username', 'student__first_name', 'student__last_name']

from django import forms
import os
import tempfile
from django.utils import timezone
from django.contrib import messages
from app.common.services.youtube import YouTubeService
from app.common.services.exceptions import YouTubeError

class LessonAdminForm(forms.ModelForm):
    video_file = forms.FileField(
        required=False, 
        label="Video yuklash (YouTube)", 
        help_text="Bu yerda yuklangan video avtomatik tarzda YouTube kanalga yuklanadi."
    )

    class Meta:
        model = Lesson
        fields = '__all__'

@admin.register(Lesson)
class LessonAdmin(admin.ModelAdmin):
    form = LessonAdminForm
    list_display = ['topic', 'group', 'date', 'start_time', 'end_time', 'upload_status']
    list_filter = ['group', 'date', 'upload_status']
    search_fields = ['topic']
    readonly_fields = ['youtube_video_id', 'youtube_url', 'upload_status', 'uploaded_at']

    def save_model(self, request, obj, form, change):
        video_file = form.cleaned_data.get('video_file')
        if video_file:
            # Set status to uploading
            obj.upload_status = 'uploading'
            obj.save()

            # Save uploaded file to temp file to get a path
            suffix = os.path.splitext(video_file.name)[1]
            with tempfile.NamedTemporaryFile(suffix=suffix, delete=False) as temp_file:
                for chunk in video_file.chunks():
                    temp_file.write(chunk)
                temp_file_path = temp_file.name

            try:
                # Call YouTube upload service
                yt_service = YouTubeService()
                result = yt_service.upload_video(
                    file_path=temp_file_path,
                    title=obj.topic or f"Lesson: {obj.topic}",
                    description=f"Video lesson for group {obj.group.name}"
                )
                
                # Save result metadata to model
                obj.youtube_video_id = result['video_id']
                obj.youtube_url = result['url']
                obj.upload_status = 'uploaded'
                obj.uploaded_at = timezone.now()
                messages.success(request, f"Video muvaffaqiyatli YouTube'ga yuklandi! Video ID: {result['video_id']}")
            except YouTubeError as e:
                obj.upload_status = 'failed'
                messages.error(request, f"YouTube'ga yuklashda xatolik yuz berdi: {str(e)}")
            finally:
                if os.path.exists(temp_file_path):
                    try:
                        os.remove(temp_file_path)
                    except Exception:
                        pass
        
        super().save_model(request, obj, form, change)



@admin.register(Attendance)
class AttendanceAdmin(admin.ModelAdmin):
    list_display = ['student', 'lesson', 'status']
    list_filter = ['status', 'lesson__group', 'lesson__date']
    search_fields = ['student__username']

@admin.register(Material)
class MaterialAdmin(admin.ModelAdmin):
    list_display = ['title', 'course', 'type']
    list_filter = ['type', 'course']
    search_fields = ['title']
