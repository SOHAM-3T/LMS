from django.contrib.auth.models import AbstractUser
from django.db import models
from django.core.validators import RegexValidator
from django.utils import timezone
import hashlib
import random
import string
import uuid

class User(AbstractUser):
    """Custom user model for the application"""
    class Meta:
        app_label = 'authentication'
    BRANCH_CHOICES = [
        ('BT', 'Biotechnology'),
        ('CH', 'Chemical Engineering'),
        ('CE', 'Civil Engineering'),
        ('CS', 'Computer Science & Engg.'),
        ('EE', 'Electrical Engineering'),
        ('EC', 'Electronics & Communication Engineering'),
        ('ME', 'Mechanical Engineering'),
        ('MT', 'Metallurgical & Materials Engineering'),
        ('SC', 'School of Sciences'),
        ('HM', 'School of Humanities & Management'),
    ]

    YEAR_CHOICES = [
        ('', 'Not Applicable'),
        ('I', 'First Year'),
        ('II', 'Second Year'),
        ('III', 'Third Year'),
        ('IV', 'Fourth Year'),
    ]

    id = models.UUIDField(primary_key=True, default=uuid.uuid4, editable=False)
    roll_no = models.CharField(max_length=6, unique=True, validators=[
        RegexValidator(
            regex='^[0-9]{6}$',
            message='Roll number must be exactly 6 digits'
        )
    ])
    branch = models.CharField(max_length=2, choices=BRANCH_CHOICES)
    year = models.CharField(max_length=4, choices=YEAR_CHOICES, blank=True, null=True)
    email = models.EmailField(unique=True)
    is_active = models.BooleanField(default=False)
    is_faculty = models.BooleanField(default=False)
    is_student = models.BooleanField(default=False)

    USERNAME_FIELD = 'roll_no'
    REQUIRED_FIELDS = ['email', 'first_name', 'last_name', 'branch']

    def __str__(self):
        return f"{self.roll_no} - {self.get_full_name()}"

class OTPVerification(models.Model):
    email = models.EmailField()
    otp = models.CharField(max_length=64)
    created_at = models.DateTimeField(auto_now_add=True)
    expires_at = models.DateTimeField()
    is_verified = models.BooleanField(default=False)
    attempts = models.IntegerField(default=0)
    purpose = models.CharField(max_length=20, choices=[
        ('signup', 'Signup Verification'),
        ('reset', 'Password Reset')
    ])

    class Meta:
        indexes = [
            models.Index(fields=['email', 'created_at']),
        ]

    def __str__(self):
        return f"OTP for {self.email} - {self.purpose}"

    @staticmethod
    def generate_otp():
        """Generate a 6-digit OTP"""
        return ''.join(random.choices(string.digits, k=6))

    @staticmethod
    def hash_otp(otp):
        """Hash the OTP using SHA-256"""
        return hashlib.sha256(otp.encode()).hexdigest()
