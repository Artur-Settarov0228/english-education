from rest_framework import serializers
from app.tasks.models import Task, Grade, Submission, QuizQuestion, Badge, StudentBadge

class QuizQuestionSerializer(serializers.ModelSerializer):
    """
    Serializer for multiple-choice quiz questions.
    Security Note: We exclude the correct_option field to prevent cheating during API inspection.
    """
    class Meta:
        model = QuizQuestion
        fields = ['id', 'task', 'question_text', 'option_a', 'option_b', 'option_c', 'option_d']


class QuizQuestionAdminSerializer(serializers.ModelSerializer):
    """
    Serializer for teachers to manage questions, including the correct options.
    """
    class Meta:
        model = QuizQuestion
        fields = ['id', 'task', 'question_text', 'option_a', 'option_b', 'option_c', 'option_d', 'correct_option']


class TaskSerializer(serializers.ModelSerializer):
    """
    Serializer to represent tasks (Homework, Quizzes, Exams) and skill classifications.
    """
    group_name = serializers.CharField(source='group.name', read_only=True)
    task_type_display = serializers.CharField(source='get_task_type_display', read_only=True)
    skill_type_display = serializers.CharField(source='get_skill_type_display', read_only=True)
    questions = QuizQuestionSerializer(many=True, read_only=True)

    class Meta:
        model = Task
        fields = [
            'id', 'group', 'group_name', 'title', 'description', 
            'task_type', 'task_type_display', 'skill_type', 'skill_type_display', 
            'max_score', 'due_date', 'questions', 'created_at'
        ]


class SubmissionSerializer(serializers.ModelSerializer):
    """
    Serializer to represent student homework submissions.
    """
    student_username = serializers.CharField(source='student.username', read_only=True)
    student_full_name = serializers.CharField(source='student.get_full_name', read_only=True)
    task_title = serializers.CharField(source='task.title', read_only=True)
    task_skill_type = serializers.CharField(source='task.skill_type', read_only=True)
    status_display = serializers.CharField(source='get_status_display', read_only=True)

    class Meta:
        model = Submission
        fields = [
            'id', 'task', 'task_title', 'task_skill_type', 'student', 
            'student_username', 'student_full_name', 'text_response', 
            'file_attachment', 'selected_answers', 'is_late', 'status', 'status_display', 'created_at'
        ]


class GradeSerializer(serializers.ModelSerializer):
    """
    Serializer to manage student grades and display metadata.
    """
    student_username = serializers.CharField(source='student.username', read_only=True)
    student_full_name = serializers.CharField(source='student.get_full_name', read_only=True)
    task_title = serializers.CharField(source='task.title', read_only=True)
    task_type = serializers.CharField(source='task.task_type', read_only=True)

    class Meta:
        model = Grade
        fields = [
            'id', 'task', 'task_title', 'task_type', 'student', 
            'student_username', 'student_full_name', 'score', 'teacher_feedback', 'audio_feedback', 'created_at'
        ]


class BadgeSerializer(serializers.ModelSerializer):
    """
    Serializer representing gamification badges.
    """
    class Meta:
        model = Badge
        fields = ['id', 'code', 'name', 'description', 'icon']


class StudentBadgeSerializer(serializers.ModelSerializer):
    """
    Serializer connecting students to earned badges.
    """
    badge_name = serializers.CharField(source='badge.name', read_only=True)
    badge_description = serializers.CharField(source='badge.description', read_only=True)
    badge_icon = serializers.CharField(source='badge.icon', read_only=True)

    class Meta:
        model = StudentBadge
        fields = ['id', 'student', 'badge', 'badge_name', 'badge_description', 'badge_icon', 'awarded_at']
