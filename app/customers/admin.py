from django.contrib import admin
from django import forms
from django_tenants.admin import TenantAdminMixin
from .models import Organization, Domain

class OrganizationForm(forms.ModelForm):
    admin_username = forms.CharField(max_length=150, required=False, help_text="Yangi markaz uchun direktor (Admin) logini")
    admin_password = forms.CharField(max_length=128, required=False, widget=forms.PasswordInput, help_text="Yangi markaz uchun direktor (Admin) paroli")

    class Meta:
        model = Organization
        fields = '__all__'

@admin.register(Organization)
class OrganizationAdmin(TenantAdminMixin, admin.ModelAdmin):
    form = OrganizationForm
    list_display = ['name', 'schema_name', 'is_active', 'get_student_count', 'get_teacher_count', 'get_admin_count']
    search_fields = ['name', 'schema_name']

    def save_model(self, request, obj, form, change):
        super().save_model(request, obj, form, change)
        
        # O'quv markaz yaratilgach, admin logini va paroli yozilgan bo'lsa uni yaratamiz
        admin_username = form.cleaned_data.get('admin_username')
        admin_password = form.cleaned_data.get('admin_password')
        
        if admin_username and admin_password and obj.schema_name != 'public':
            from django_tenants.utils import schema_context
            from app.users.models import User
            with schema_context(obj.schema_name):
                if not User.objects.filter(username=admin_username).exists():
                    User.objects.create_superuser(
                        username=admin_username,
                        email=f"{admin_username}@{obj.schema_name}.com",
                        password=admin_password,
                        role='admin'
                    )

    def has_module_permission(self, request):
        # CUSTOMERS qismi faqatgina public sxemada (Asosiy markazda) ko'rinishi shart!
        if hasattr(request, 'tenant') and request.tenant.schema_name != 'public':
            return False
        return super().has_module_permission(request)

    def has_delete_permission(self, request, obj=None):
        # Asosiy (public) markazni hech qachon o'chirib yuborib bo'lmaydi!
        if obj and obj.schema_name == 'public':
            return False
        return super().has_delete_permission(request, obj)

    def get_actions(self, request):
        actions = super().get_actions(request)
        if 'delete_selected' in actions:
            del actions['delete_selected']
        return actions

    def get_student_count(self, obj):
        from django_tenants.utils import schema_context
        from app.users.models import User
        if obj.schema_name == 'public':
            return '-'
        try:
            with schema_context(obj.schema_name):
                return User.objects.filter(role__iexact='student').count()
        except Exception:
            return 0
    get_student_count.short_description = "Talaba"

    def get_teacher_count(self, obj):
        from django_tenants.utils import schema_context
        from app.users.models import User
        if obj.schema_name == 'public':
            return '-'
        try:
            with schema_context(obj.schema_name):
                return User.objects.filter(role__iexact='teacher').count()
        except Exception:
            return 0
    get_teacher_count.short_description = "Ustoz"

    def get_admin_count(self, obj):
        from django_tenants.utils import schema_context
        from app.users.models import User
        if obj.schema_name == 'public':
            return '-'
        try:
            with schema_context(obj.schema_name):
                return User.objects.filter(role__in=['admin', 'manager']).count()
        except Exception:
            return 0
    get_admin_count.short_description = "Admin"

@admin.register(Domain)
class DomainAdmin(admin.ModelAdmin):
    list_display = ['domain', 'tenant', 'is_primary']
    search_fields = ['domain']

    def has_module_permission(self, request):
        if hasattr(request, 'tenant') and request.tenant.schema_name != 'public':
            return False
        return super().has_module_permission(request)

    def has_delete_permission(self, request, obj=None):
        # Asosiy (public) domenni hech qachon o'chirib yuborib bo'lmaydi!
        if obj and obj.tenant.schema_name == 'public':
            return False
        return super().has_delete_permission(request, obj)

    def get_actions(self, request):
        actions = super().get_actions(request)
        if 'delete_selected' in actions:
            del actions['delete_selected']
        return actions
