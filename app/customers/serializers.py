from rest_framework import serializers
from django_tenants.utils import schema_context
from app.customers.models import Organization, Domain
from app.users.models import User

class DomainSerializer(serializers.ModelSerializer):
    class Meta:
        model = Domain
        fields = ['id', 'domain', 'is_primary']

class OrganizationSerializer(serializers.ModelSerializer):
    domains = DomainSerializer(many=True, read_only=True)
    domain_name = serializers.CharField(write_only=True, required=False, help_text="Subdomen/Domen nomi (masalan: markaz1.localhost yoki markaz1.com)")
    admin_username = serializers.CharField(write_only=True, required=False, help_text="O'quv markaz admini logini")
    admin_password = serializers.CharField(write_only=True, required=False, help_text="O'quv markaz admini paroli")
    
    student_count = serializers.SerializerMethodField()
    teacher_count = serializers.SerializerMethodField()
    admin_count = serializers.SerializerMethodField()

    class Meta:
        model = Organization
        fields = [
            'id', 'name', 'schema_name', 'created_on', 'is_active',
            'domains', 'domain_name', 'admin_username', 'admin_password',
            'student_count', 'teacher_count', 'admin_count'
        ]

    def get_student_count(self, obj):
        if obj.schema_name == 'public':
            return 0
        try:
            with schema_context(obj.schema_name):
                return User.objects.filter(role__iexact='student').count()
        except Exception:
            return 0

    def get_teacher_count(self, obj):
        if obj.schema_name == 'public':
            return 0
        try:
            with schema_context(obj.schema_name):
                return User.objects.filter(role__iexact='teacher').count()
        except Exception:
            return 0

    def get_admin_count(self, obj):
        if obj.schema_name == 'public':
            return 0
        try:
            with schema_context(obj.schema_name):
                return User.objects.filter(role__in=['admin', 'manager']).count()
        except Exception:
            return 0

    def create(self, validated_data):
        domain_name = validated_data.pop('domain_name', None)
        admin_username = validated_data.pop('admin_username', None)
        admin_password = validated_data.pop('admin_password', None)

        org = Organization.objects.create(**validated_data)

        # Create Domain
        if domain_name:
            Domain.objects.create(
                domain=domain_name,
                tenant=org,
                is_primary=True
            )

        # Create Superuser/Admin in tenant schema
        if admin_username and admin_password and org.schema_name != 'public':
            with schema_context(org.schema_name):
                if not User.objects.filter(username=admin_username).exists():
                    User.objects.create_superuser(
                        username=admin_username,
                        email=f"{admin_username}@{org.schema_name}.com",
                        password=admin_password,
                        role='admin'
                    )

        return org
