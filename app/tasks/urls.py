# pyrefly: ignore [missing-import]
from django.urls import path, include
# pyrefly: ignore [missing-import]
from rest_framework.routers import DefaultRouter
from .views import (
    TaskViewSet, GradeViewSet, SubmissionViewSet, 
    QuizQuestionViewSet, StudentBadgeViewSet,
    VocabularySetViewSet, VocabularyWordViewSet
)

router = DefaultRouter()
router.register(r'tasks', TaskViewSet, basename='task')
router.register(r'grades', GradeViewSet, basename='grade')
router.register(r'submissions', SubmissionViewSet, basename='submission')
router.register(r'quiz-questions', QuizQuestionViewSet, basename='quizquestion')
router.register(r'badges', StudentBadgeViewSet, basename='studentbadge')
router.register(r'vocab-sets', VocabularySetViewSet, basename='vocabset')
router.register(r'vocab-words', VocabularyWordViewSet, basename='vocabword')

urlpatterns = [
    path('', include(router.urls)),
]
