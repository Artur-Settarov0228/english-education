from rest_framework import viewsets, permissions
from app.payments.models import Payment
from app.payments.serializers import PaymentSerializer

class PaymentViewSet(viewsets.ModelViewSet):
    """
    ViewSet to manage student tuition fees and payment records.
    - If user is a student: only returns payments belonging to that student.
    - If user is manager/admin: returns all payments with filtering options.
    """
    serializer_class = PaymentSerializer

    def get_queryset(self):
        user = self.request.user
        queryset = Payment.objects.all()

        # Agar foydalanuvchi O'quvchi (Student) bo'lsa, faqat uning o'z to'lovlarini qaytaramiz
        if hasattr(user, 'role') and user.role == 'student':
            queryset = queryset.filter(student=user)
        
        student_id = self.request.query_params.get('student')
        if student_id:
            queryset = queryset.filter(student_id=student_id)

        group_id = self.request.query_params.get('group')
        if group_id:
            queryset = queryset.filter(group_id=group_id)

        return queryset
