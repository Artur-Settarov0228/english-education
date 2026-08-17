# pyrefly: ignore [missing-import]
from django.db import models
from app.common.models import BaseModel
from app.users.models import User

class Course(BaseModel):
    class LevelChoices(models.TextChoices):
        A1 = 'a1', "Boshlang'ich (A1)"
        A2 = 'a2', "Elementar (A2)"
        B1 = 'b1', "O'rta (B1)"
        B2 = 'b2', "Yuqori O'rta (B2)"
        C1 = 'c1', "Ilg'or (C1)"

    class CategoryChoices(models.TextChoices):
        GRAMMAR = 'grammar', 'Grammatika'
        VOCABULARY = 'vocabulary', "Lug'at"
        SPEAKING = 'speaking', "So'zlashuv"
        WRITING = 'writing', 'Yozish'

    class StatusChoices(models.TextChoices):
        ACTIVE = 'active', 'Faol'
        DRAFT = 'draft', 'Qoralama'

    name = models.CharField('Course name', max_length=255)
    description = models.TextField('Description', blank=True, null=True)
    monthly_price = models.DecimalField('Monthly price', max_digits=10, decimal_places=2, null=True, blank=True)
    
    level = models.CharField('Daraja', max_length=20, choices=LevelChoices.choices, default=LevelChoices.A1)
    category = models.CharField('Toifa', max_length=20, choices=CategoryChoices.choices, default=CategoryChoices.GRAMMAR)
    status = models.CharField('Holat', max_length=20, choices=StatusChoices.choices, default=StatusChoices.ACTIVE)

    class Meta:
        verbose_name = 'Kurs'
        verbose_name_plural = 'Kurslar'
        ordering = ['-created_at']

    def __str__(self):
        return self.name

class Group(BaseModel):
    class StatusChoices(models.TextChoices):
        ACTIVE = 'active', 'Active'
        COMPLETED = 'completed', 'Completed'

    course = models.ForeignKey(Course, on_delete=models.CASCADE, related_name='groups', verbose_name='Course')
    teacher = models.ForeignKey(
        User, 
        on_delete=models.SET_NULL, 
        null=True, 
        related_name='teaching_groups', 
        limit_choices_to={'role': User.RoleChoices.TEACHER},
        verbose_name='Teacher'
    )
    name = models.CharField('Group name', max_length=255)
    schedule = models.CharField('Schedule', max_length=255, help_text="e.g. Mon/Wed/Fri 14:00")
    status = models.CharField('Status', max_length=20, choices=StatusChoices.choices, default=StatusChoices.ACTIVE)

    class Meta:
        verbose_name = 'Guruh'
        verbose_name_plural = 'Guruhlar'
        indexes = [
            models.Index(fields=['status']),
        ]
        ordering = ['-created_at']

    def __str__(self):
        return f"{self.name} - {self.course.name}"

class Enrollment(BaseModel):
    class StatusChoices(models.TextChoices):
        ACTIVE = 'active', 'Active'
        DROPPED = 'dropped', 'Dropped'

    student = models.ForeignKey(
        User, 
        on_delete=models.CASCADE, 
        related_name='enrollments', 
        limit_choices_to={'role': User.RoleChoices.STUDENT},
        verbose_name='Student'
    )
    group = models.ForeignKey(Group, on_delete=models.CASCADE, related_name='enrollments', verbose_name='Group')
    joined_date = models.DateField('Joined date', auto_now_add=True)
    status = models.CharField('Status', max_length=20, choices=StatusChoices.choices, default=StatusChoices.ACTIVE)

    class Meta:
        verbose_name = 'Guruhga qabul'
        verbose_name_plural = 'Guruhga qabullar'
        unique_together = ('student', 'group')
        indexes = [
            models.Index(fields=['status']),
            models.Index(fields=['joined_date']),
        ]

    def __str__(self):
        return f"{self.student.username} -> {self.group.name}"

class Lesson(BaseModel):
    group = models.ForeignKey(Group, on_delete=models.CASCADE, related_name='lessons', verbose_name='Group')
    date = models.DateField('Date')
    start_time = models.TimeField('Start time', null=True, blank=True)
    end_time = models.TimeField('End time', null=True, blank=True)
    topic = models.CharField('Topic', max_length=255)
    youtube_video_id = models.CharField('YouTube Video ID', max_length=100, null=True, blank=True)
    youtube_url = models.URLField('YouTube URL', null=True, blank=True)
    upload_status = models.CharField(
        'Upload Status',
        max_length=50,
        choices=[
            ('pending', 'Pending'),
            ('uploading', 'Uploading'),
            ('uploaded', 'Uploaded'),
            ('failed', 'Failed'),
            ('PROCESSING', 'Processing'),
            ('READY', 'Ready'),
            ('FAILED', 'Failed')
        ],
        default='pending',
        null=True,
        blank=True
    )
    uploaded_at = models.DateTimeField('Uploaded at', null=True, blank=True)
    failure_reason = models.TextField('Failure reason', null=True, blank=True)
    local_file_path = models.CharField('Local file path', max_length=500, null=True, blank=True)


    class Meta:
        verbose_name = 'Dars'
        verbose_name_plural = 'Darslar'
        ordering = ['-date']
        indexes = [
            models.Index(fields=['date']),
        ]

    def __str__(self):
        return f"{self.topic} ({self.group.name} - {self.date})"

class Attendance(BaseModel):
    class StatusChoices(models.TextChoices):
        PRESENT = 'present', 'Present (Keldi)'
        LATE = 'late', 'Late (Kechikdi)'
        ABSENT = 'absent', 'Absent (Kelmadi)'

    lesson = models.ForeignKey(Lesson, on_delete=models.CASCADE, related_name='attendances', verbose_name='Lesson')
    student = models.ForeignKey(
        User, 
        on_delete=models.CASCADE, 
        related_name='attendances', 
        limit_choices_to={'role': User.RoleChoices.STUDENT},
        verbose_name='Student'
    )
    status = models.CharField('Status', max_length=20, choices=StatusChoices.choices, default=StatusChoices.PRESENT)

    class Meta:
        verbose_name = 'Yo\'qlama'
        verbose_name_plural = 'Yo\'qlamalar'
        unique_together = ('lesson', 'student')
        indexes = [
            models.Index(fields=['status']),
        ]

    def __str__(self):
        return f"{self.student.username} - {self.lesson.topic} - {self.status}"

class Material(BaseModel):
    course = models.ForeignKey(Course, on_delete=models.CASCADE, related_name='materials', verbose_name='Course')
    title = models.CharField('Title', max_length=255)
    link = models.URLField('YouTube/Audio Link', max_length=500, blank=True, null=True, help_text="Audio uchun YouTube ssilkasi")
    file = models.FileField('File (PDF)', upload_to='materials/', blank=True, null=True, help_text="PDF fayllar uchun")

    class Meta:
        verbose_name = 'O\'quv materiali'
        verbose_name_plural = 'O\'quv materiallari'

    def __str__(self):
        return self.title
