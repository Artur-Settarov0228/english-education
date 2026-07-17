from rest_framework import viewsets, status
from rest_framework.decorators import action
from rest_framework.response import Response
from django.db.models import Sum
from django.utils import timezone

from app.tasks.models import Task, Grade, Submission, QuizQuestion, Badge, StudentBadge
from app.tasks.serializers import (
    TaskSerializer, GradeSerializer, SubmissionSerializer,
    QuizQuestionAdminSerializer, StudentBadgeSerializer
)
from app.lessons.models import Enrollment

# --- Badge Helpers ---
def award_badge(student, badge_code):
    try:
        badge = Badge.objects.get(code=badge_code)
        StudentBadge.objects.get_or_create(student=student, badge=badge)
    except Badge.DoesNotExist:
        pass

def check_streak_hero(student):
    # Retrieve the last 5 submissions by this student
    last_submissions = Submission.objects.filter(student=student).order_by('-created_at')[:5]
    if last_submissions.count() == 5:
        all_on_time = not any(s.is_late for s in last_submissions)
        if all_on_time:
            award_badge(student, 'streak_hero')


class QuizQuestionViewSet(viewsets.ModelViewSet):
    """
    ViewSet for teachers to create and edit multiple choice questions.
    """
    queryset = QuizQuestion.objects.all()
    serializer_class = QuizQuestionAdminSerializer


class StudentBadgeViewSet(viewsets.ReadOnlyModelViewSet):
    """
    ViewSet to read student achievements.
    Supports filtering by student query parameter: GET /api/badges/?student=<id>
    """
    serializer_class = StudentBadgeSerializer

    def get_queryset(self):
        queryset = StudentBadge.objects.all()
        student_id = self.request.query_params.get('student')
        if student_id:
            queryset = queryset.filter(student_id=student_id)
        return queryset


class TaskViewSet(viewsets.ModelViewSet):
    """
    ViewSet to manage Homework, Quizzes, and Exams.
    Supports filtering by group.
    """
    serializer_class = TaskSerializer

    def get_queryset(self):
        queryset = Task.objects.all()
        group_id = self.request.query_params.get('group')
        if group_id:
            queryset = queryset.filter(group_id=group_id)
        return queryset


class SubmissionViewSet(viewsets.ModelViewSet):
    """
    ViewSet to manage student homework submissions.
    Supports filtering by task and student, handles time deadlines,
    and executes auto-grading for quizzes.
    """
    serializer_class = SubmissionSerializer

    def get_queryset(self):
        queryset = Submission.objects.all()
        task_id = self.request.query_params.get('task')
        student_id = self.request.query_params.get('student')
        if task_id:
            queryset = queryset.filter(task_id=task_id)
        if student_id:
            queryset = queryset.filter(student_id=student_id)
        return queryset

    def perform_create(self, serializer):
        task = serializer.validated_data['task']
        student = serializer.validated_data['student']

        # 1. Deadline verification
        is_late = False
        if task.due_date and timezone.now() > task.due_date:
            is_late = True

        # Save submission
        submission = serializer.save(is_late=is_late, status=Submission.StatusChoices.PENDING)

        # 2. Auto-grading for quizzes
        if task.task_type == Task.TaskType.QUIZ:
            selected_answers = serializer.validated_data.get('selected_answers', {})
            questions = task.questions.all()

            if questions.exists():
                correct_count = 0
                for q in questions:
                    selected_option = selected_answers.get(str(q.id))
                    if selected_option and selected_option.strip().upper() == q.correct_option.strip().upper():
                        correct_count += 1

                total_questions = questions.count()
                calculated_score = (correct_count / total_questions) * task.max_score

                # Save Grade entry automatically
                Grade.objects.update_or_create(
                    task=task,
                    student=student,
                    defaults={
                        'score': calculated_score,
                        'teacher_feedback': f"Avtomatik tekshirildi. {correct_count}/{total_questions} to'g'ri javob."
                    }
                )

                # Set status to graded
                submission.status = Submission.StatusChoices.GRADED
                submission.save()

                # 3. Check achievement badges (Grammar Guru)
                if calculated_score == task.max_score and task.skill_type == Task.SkillType.GRAMMAR:
                    award_badge(student, 'grammar_guru')

        # 4. Check achievement badges (Streak Hero)
        check_streak_hero(student)


class GradeViewSet(viewsets.ModelViewSet):
    """
    ViewSet to manage student grades, group ratings, and skill analytics.
    """
    serializer_class = GradeSerializer

    def get_queryset(self):
        queryset = Grade.objects.all()
        student_id = self.request.query_params.get('student')
        if student_id:
            queryset = queryset.filter(student_id=student_id)
        return queryset

    def perform_create(self, serializer):
        grade = serializer.save()
        # Automatically mark the corresponding submission as GRADED if it exists
        Submission.objects.filter(
            task=grade.task, 
            student=grade.student
        ).update(status=Submission.StatusChoices.GRADED)

        # Award badge "Speaking Star" for 3 Speaking tasks scored >= 90%
        if grade.task.skill_type == Task.SkillType.SPEAKING:
            is_high_score = float(grade.score) >= (grade.task.max_score * 0.9)
            if is_high_score:
                high_speaking_grades = Grade.objects.filter(
                    student=grade.student,
                    task__skill_type=Task.SkillType.SPEAKING
                )
                count = 0
                for g in high_speaking_grades:
                    if float(g.score) >= (g.task.max_score * 0.9):
                        count += 1
                if count >= 3:
                    award_badge(grade.student, 'speaking_star')

        # Check Streak Hero
        check_streak_hero(grade.student)

    @action(detail=False, methods=['get'], url_path='ratings')
    def ratings(self, request):
        """
        API endpoint to get the leaderboard rating for a specific group.
        Ranks active students in the group based on their cumulative task scores.
        Usage: GET /api/grades/ratings/?group_id=<id>
        """
        group_id = request.query_params.get('group_id')
        if not group_id:
            return Response(
                {"error": "group_id query parameter is required"}, 
                status=status.HTTP_400_BAD_REQUEST
            )

        # Get all active student enrollments for this group
        enrollments = Enrollment.objects.filter(group_id=group_id, status='active')

        ratings_list = []
        for enrollment in enrollments:
            student = enrollment.student
            # Calculate sum of scores of all tasks in this group for this student
            total_score = Grade.objects.filter(
                task__group_id=group_id,
                student=student
            ).aggregate(total=Sum('score'))['total'] or 0.0

            ratings_list.append({
                "student_id": student.id,
                "username": student.username,
                "full_name": student.get_full_name() or student.username,
                "total_score": float(total_score)
            })

        # Sort descending by total score
        ratings_list.sort(key=lambda x: x['total_score'], reverse=True)

        # Add rank position
        for index, item in enumerate(ratings_list, 1):
            item['rank'] = index

        return Response(ratings_list, status=status.HTTP_200_OK)

    @action(detail=False, methods=['get'], url_path='analytics')
    def analytics(self, request):
        """
        Calculates average score per skill type (Speaking, Reading, etc.) for a student.
        Usage: GET /api/grades/analytics/?student=<id>
        """
        student_id = request.query_params.get('student')
        if not student_id:
            return Response(
                {"error": "student query parameter is required"}, 
                status=status.HTTP_400_BAD_REQUEST
            )

        # Get all grades for this student
        student_grades = Grade.objects.filter(student_id=student_id)

        # Predefined core skills to calculate
        skills = ['reading', 'writing', 'listening', 'speaking', 'grammar']
        analytics_data = {}

        for skill in skills:
            skill_grades = student_grades.filter(task__skill_type=skill)
            total_score = float(skill_grades.aggregate(total=Sum('score'))['total'] or 0.0)
            total_max_score = float(skill_grades.aggregate(total=Sum('task__max_score'))['total'] or 0.0)

            percentage = 0.0
            if total_max_score > 0:
                percentage = round((total_score / total_max_score) * 100, 1)

            analytics_data[skill] = percentage

        return Response(analytics_data, status=status.HTTP_200_OK)
