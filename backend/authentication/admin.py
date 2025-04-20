from django.contrib import admin
from .models import User, OTPVerification

@admin.register(User)
class UserAdmin(admin.ModelAdmin):
    list_display = ('roll_no', 'email', 'first_name', 'last_name', 'branch', 'year', 'is_active', 'is_faculty', 'is_student')
    search_fields = ('roll_no', 'email', 'first_name', 'last_name')
    list_filter = ('is_active', 'is_faculty', 'is_student', 'branch', 'year')

@admin.register(OTPVerification)
class OTPVerificationAdmin(admin.ModelAdmin):
    list_display = ('email', 'created_at', 'expires_at', 'is_verified', 'attempts', 'purpose')
    search_fields = ('email',)
    list_filter = ('is_verified', 'purpose')
