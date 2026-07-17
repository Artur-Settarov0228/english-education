from django.contrib import admin
from app.tasks.models import Task, Grade, Submission, QuizQuestion, Badge, StudentBadge

class QuizQuestionInline(admin.TabularInline):
    model = QuizQuestion
    extra = 1

@admin.register(Task)
class TaskAdmin(admin.ModelAdmin):
    list_display = ['title', 'group', 'task_type', 'skill_type', 'max_score', 'due_date', 'created_at']
    list_filter = ['task_type', 'skill_type', 'group', 'created_at']
    search_fields = ['title', 'description']
    inlines = [QuizQuestionInline]
    ordering = ['-created_at']

@admin.register(QuizQuestion)
class QuizQuestionAdmin(admin.ModelAdmin):
    list_display = ['task', 'question_text', 'correct_option']
    list_filter = ['task__group', 'correct_option']
    search_fields = ['question_text']

@admin.register(Submission)
class SubmissionAdmin(admin.ModelAdmin):
    list_display = ['student', 'task', 'is_late', 'status', 'created_at']
    list_filter = ['status', 'is_late', 'task__skill_type', 'created_at']
    search_fields = ['student__username', 'student__first_name', 'student__last_name', 'task__title']
    ordering = ['-created_at']

@admin.register(Grade)
class GradeAdmin(admin.ModelAdmin):
    list_display = ['student', 'task', 'score', 'created_at']
    list_filter = ['task__task_type', 'task__skill_type', 'task__group', 'created_at']
    search_fields = ['student__username', 'student__first_name', 'student__last_name', 'task__title']
    ordering = ['-created_at']

@admin.register(Badge)
class BadgeAdmin(admin.ModelAdmin):
    list_display = ['icon', 'name', 'code', 'description']
    search_fields = ['name', 'code', 'description']

@admin.register(StudentBadge)
class StudentBadgeAdmin(admin.ModelAdmin):
    list_display = ['student', 'badge', 'awarded_at']
    list_filter = ['badge', 'awarded_at']
    search_fields = ['student__username', 'student__first_name', 'student__last_name', 'badge__name']
