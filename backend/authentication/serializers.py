from rest_framework import serializers
from django.contrib.auth import get_user_model
from .models import OTPVerification

User = get_user_model()

class UserSerializer(serializers.ModelSerializer):
    password = serializers.CharField(write_only=True)

    class Meta:
        model = User
        fields = ('id', 'roll_no', 'email', 'first_name', 'last_name', 'branch', 'year', 'is_active', 'is_faculty', 'is_student', 'password')
        read_only_fields = ('id', 'is_active')

    def create(self, validated_data):
        password = validated_data.pop('password', None)
        validated_data['username'] = validated_data['roll_no']
        user = super().create(validated_data)
        if password:
            user.set_password(password)
            user.save()
        return user

class OTPSerializer(serializers.ModelSerializer):
    class Meta:
        model = OTPVerification
        fields = ('email', 'otp', 'purpose')
        extra_kwargs = {
            'otp': {'write_only': True}
        }
