from django.urls import path, include
from rest_framework.routers import DefaultRouter
from app.customers.views import OrganizationViewSet, DomainViewSet

router = DefaultRouter()
router.register(r'organizations', OrganizationViewSet, basename='organization')
router.register(r'domains', DomainViewSet, basename='domain')

urlpatterns = [
    path('', include(router.urls)),
]
