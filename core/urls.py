"""
URL configuration for core project.

The `urlpatterns` list routes URLs to views. For more information please see:
    https://docs.djangoproject.com/en/5.2/topics/http/urls/
Examples:
Function views
    1. Add an import:  from my_app import views
    2. Add a URL to urlpatterns:  path('', views.home, name='home')
Class-based views
    1. Add an import:  from other_app.views import Home
    2. Add a URL to urlpatterns:  path('', Home.as_view(), name='home')
Including another URLconf
    1. Import the include() function: from django.urls import include, path
    2. Add a URL to urlpatterns:  path('blog/', include('blog.urls'))
"""
from django.contrib import admin
from django.urls import path, include
from rest_framework.routers import DefaultRouter
from app.lessons.views import LessonViewSet, GroupViewSet
from app.tasks.views import TaskViewSet, GradeViewSet, SubmissionViewSet, QuizQuestionViewSet, StudentBadgeViewSet
from app.users.views import UserViewSet

router = DefaultRouter()
router.register(r'lessons', LessonViewSet, basename='lesson')
router.register(r'groups', GroupViewSet, basename='group')
router.register(r'tasks', TaskViewSet, basename='task')
router.register(r'grades', GradeViewSet, basename='grade')
router.register(r'submissions', SubmissionViewSet, basename='submission')
router.register(r'quiz-questions', QuizQuestionViewSet, basename='quizquestion')
router.register(r'badges', StudentBadgeViewSet, basename='studentbadge')
router.register(r'users', UserViewSet, basename='user')





urlpatterns = [
    path('admin/', admin.site.urls),
    path('api/', include(router.urls)),
    path('api/auth/', include('app.users.urls')),
]

