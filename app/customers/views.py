from rest_framework import viewsets, permissions, status
from rest_framework.response import Response
from app.customers.models import Organization, Domain
from app.customers.serializers import OrganizationSerializer, DomainSerializer

class OrganizationViewSet(viewsets.ModelViewSet):
    queryset = Organization.objects.all()
    serializer_class = OrganizationSerializer
    permission_classes = [permissions.IsAuthenticated]

    def destroy(self, request, *args, **kwargs):
        instance = self.get_object()
        if instance.schema_name == 'public':
            return Response({"error": "Asosiy public markazni o'chirib bo'lmaydi!"}, status=status.HTTP_400_BAD_REQUEST)
        return super().destroy(request, *args, **kwargs)

class DomainViewSet(viewsets.ModelViewSet):
    queryset = Domain.objects.all()
    serializer_class = DomainSerializer
    permission_classes = [permissions.IsAuthenticated]
