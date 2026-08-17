from rest_framework import serializers
from app.payments.models import Payment

class PaymentSerializer(serializers.ModelSerializer):
    student_name = serializers.CharField(source='student.get_full_name', read_only=True)
    student_username = serializers.CharField(source='student.username', read_only=True)
    group_name = serializers.CharField(source='group.name', read_only=True)

    class Meta:
        model = Payment
        fields = [
            'id', 'student', 'student_name', 'student_username',
            'group', 'group_name', 'amount', 'payment_month',
            'method', 'status', 'created_at'
        ]
