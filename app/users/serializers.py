from rest_framework import serializers
from rest_framework_simplejwt.tokens import RefreshToken
from django.contrib.auth import authenticate
from app.users.models import User

class UserSerializer(serializers.ModelSerializer):
    """
    Serializer to represent user profiles.
    """
    class Meta:
        model = User
        fields = ['id', 'username', 'first_name', 'last_name', 'email', 'role', 'phone_number', 'avatar']

class RegisterSerializer(serializers.ModelSerializer):
    """
    Serializer to handle registration and password hashing.
    """
    password = serializers.CharField(write_only=True, required=True, min_length=6)

    class Meta:
        model = User
        fields = ['username', 'password', 'first_name', 'last_name', 'email', 'role', 'phone_number']

    def create(self, validated_data):
        user = User.objects.create_user(
            username=validated_data['username'],
            password=validated_data['password'],
            first_name=validated_data.get('first_name', ''),
            last_name=validated_data.get('last_name', ''),
            email=validated_data.get('email', ''),
            role=validated_data.get('role', User.RoleChoices.STUDENT),
            phone_number=validated_data.get('phone_number', '')
        )
        return user

class LoginSerializer(serializers.Serializer):
    """
    Serializer to handle username/password login and return JWT credentials.
    """
    username = serializers.CharField(required=True)
    password = serializers.CharField(write_only=True, required=True)

    def validate(self, attrs):
        username = attrs.get('username')
        password = attrs.get('password')

        # Authenticate credentials
        user = authenticate(username=username, password=password)
        if not user:
            raise serializers.ValidationError("Noto'g'ri login yoki parol kiritildi.")

        if not user.is_active:
            raise serializers.ValidationError("Ushbu foydalanuvchi hisobi faol emas.")

        # Generate access and refresh tokens
        refresh = RefreshToken.for_user(user)

        return {
            'refresh': str(refresh),
            'access': str(refresh.access_token),
            'user': user
        }
