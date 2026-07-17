from django.db import models
from app.common.models import BaseModel
from app.users.models import User
from app.lessons.models import Group

class Task(BaseModel):
    """
    Model representing assignments, quizzes, and exams assigned to groups.
    """
    class TaskType(models.TextChoices):
        HOMEWORK = 'homework', 'Uy vazifasi'
        QUIZ = 'quiz', 'Kichik test'
        EXAM = 'exam', 'Imtihon'

    class SkillType(models.TextChoices):
        READING = 'reading', 'Reading (O\'qish)'
        WRITING = 'writing', 'Writing (Yozish)'
        LISTENING = 'listening', 'Listening (Eshitish)'
        SPEAKING = 'speaking', 'Speaking (Gapirish)'
        GRAMMAR = 'grammar', 'Grammar (Grammatika)'

    group = models.ForeignKey(
        Group, 
        on_delete=models.CASCADE, 
        related_name='tasks', 
        verbose_name='Guruh'
    )
    title = models.CharField('Sarlavha/Mavzu', max_length=255)
    description = models.TextField('Tavsif/Savollar', blank=True, null=True)
    task_type = models.CharField(
        'Topshiriq turi', 
        max_length=20, 
        choices=TaskType.choices, 
        default=TaskType.HOMEWORK
    )
    skill_type = models.CharField(
        'Ko\'nikma turi', 
        max_length=20, 
        choices=SkillType.choices, 
        default=SkillType.GRAMMAR
    )
    max_score = models.IntegerField('Maksimal ball', default=100)
    due_date = models.DateTimeField('Topshirish muddati', blank=True, null=True)

    class Meta:
        verbose_name = 'Topshiriq/Imtihon'
        verbose_name_plural = 'Topshiriqlar va Imtihonlar'
        ordering = ['-created_at']

    def __str__(self):
        return f"{self.title} ({self.get_task_type_display()}) - {self.group.name}"


class QuizQuestion(BaseModel):
    """
    Model representing a multiple-choice question inside a Quiz Task.
    """
    class OptionChoices(models.TextChoices):
        A = 'A', 'A'
        B = 'B', 'B'
        C = 'C', 'C'
        D = 'D', 'D'

    task = models.ForeignKey(
        Task, 
        on_delete=models.CASCADE, 
        related_name='questions', 
        verbose_name='Topshiriq'
    )
    question_text = models.TextField('Savol matni')
    option_a = models.CharField('A variant', max_length=255)
    option_b = models.CharField('B variant', max_length=255)
    option_c = models.CharField('C variant', max_length=255)
    option_d = models.CharField('D variant', max_length=255)
    correct_option = models.CharField(
        'To\'g\'ri javob', 
        max_length=2, 
        choices=OptionChoices.choices
    )

    class Meta:
        verbose_name = 'Test savoli'
        verbose_name_plural = 'Test savollari'
        ordering = ['created_at']

    def __str__(self):
        return f"{self.task.title} - Savol: {self.question_text[:30]}"


class Submission(BaseModel):
    """
    Model storing student homework responses, including audio recordings, files,
    or quiz answers.
    """
    class StatusChoices(models.TextChoices):
        PENDING = 'pending', 'Kutilmoqda'
        GRADED = 'graded', 'Baholandi'

    task = models.ForeignKey(
        Task, 
        on_delete=models.CASCADE, 
        related_name='submissions', 
        verbose_name='Topshiriq'
    )
    student = models.ForeignKey(
        User, 
        on_delete=models.CASCADE, 
        related_name='submissions',
        limit_choices_to={'role': User.RoleChoices.STUDENT},
        verbose_name='O\'quvchi'
    )
    text_response = models.TextField('Yozma javob', blank=True, null=True)
    file_attachment = models.FileField(
        'Ilova fayli (Rasm, PDF yoki Audio)', 
        upload_to='submissions/', 
        blank=True, 
        null=True
    )
    selected_answers = models.JSONField(
        'Belgilangan test javoblari', 
        default=dict, 
        blank=True, 
        help_text="Format: {'question_id': 'A'}"
    )
    is_late = models.BooleanField('Kechikib topshirildimi', default=False)
    status = models.CharField(
        'Holati', 
        max_length=20, 
        choices=StatusChoices.choices, 
        default=StatusChoices.PENDING
    )

    class Meta:
        verbose_name = 'Topshiriq javobi'
        verbose_name_plural = 'Topshiriq javoblari'
        unique_together = ('task', 'student')
        ordering = ['-created_at']

    def __str__(self):
        return f"{self.student.username} - {self.task.title} ({self.get_status_display()})"


class Grade(BaseModel):
    """
    Model storing student-specific grades for tasks, including audio feedback from teachers.
    """
    task = models.ForeignKey(
        Task, 
        on_delete=models.CASCADE, 
        related_name='grades', 
        verbose_name='Topshiriq/Imtihon'
    )
    student = models.ForeignKey(
        User, 
        on_delete=models.CASCADE, 
        related_name='grades',
        limit_choices_to={'role': User.RoleChoices.STUDENT},
        verbose_name='O\'quvchi'
    )
    score = models.DecimalField('Olingan ball', max_digits=5, decimal_places=2)
    teacher_feedback = models.TextField('O\'qituvchi fikri', blank=True, null=True)
    audio_feedback = models.FileField(
        'Ovozli izoh (Audio feedback)', 
        upload_to='grades/audio/', 
        blank=True, 
        null=True
    )

    class Meta:
        verbose_name = 'Baho/Ball'
        verbose_name_plural = 'Baholar va Ballar'
        unique_together = ('task', 'student')
        ordering = ['-created_at']

    def __str__(self):
        return f"{self.student.username} - {self.task.title}: {self.score}/{self.task.max_score}"


class Badge(BaseModel):
    """
    Model representing badges/achievements that can be earned by students.
    """
    code = models.CharField('Kod', max_length=50, unique=True)
    name = models.CharField('Nomi', max_length=100)
    description = models.CharField('Tavsif', max_length=255)
    icon = models.CharField('Ikonka (Emoji)', max_length=50, default='🏆')

    class Meta:
        verbose_name = 'Nishon/Yutuq'
        verbose_name_plural = 'Nishonlar va Yutuqlar'

    def __str__(self):
        return f"{self.icon} {self.name}"


class StudentBadge(BaseModel):
    """
    Model connecting students to their earned badges.
    """
    student = models.ForeignKey(
        User, 
        on_delete=models.CASCADE, 
        related_name='earned_badges', 
        verbose_name='O\'quvchi'
    )
    badge = models.ForeignKey(
        Badge, 
        on_delete=models.CASCADE, 
        related_name='awarded_to', 
        verbose_name='Nishon'
    )
    awarded_at = models.DateTimeField('Berilgan vaqt', auto_now_add=True)

    class Meta:
        verbose_name = 'O\'quvchi nishoni'
        verbose_name_plural = 'O\'quvchilar nishonlari'
        unique_together = ('student', 'badge')

    def __str__(self):
        return f"{self.student.username} - {self.badge.name}"
