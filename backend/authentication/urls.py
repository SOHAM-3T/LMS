from django.urls import path
from .views import (
    RegisterView, LoginView, StudentDetailsView, FacultyDetailsView,
    AllStudentsView, VerifyOTPView, RequestPasswordResetView, ResetPasswordView,
    GenerateOTPView
)
from rest_framework_simplejwt.views import TokenObtainPairView, TokenRefreshView

urlpatterns = [
    path("signup/", RegisterView.as_view(), name="signup"),
    path("verify-otp/", VerifyOTPView.as_view(), name="verify_otp"),
    path("login/", LoginView.as_view(), name="login"),
    path("token/", TokenObtainPairView.as_view(), name="token_obtain_pair"),
    path("token/refresh/", TokenRefreshView.as_view(), name="token_refresh"),
    path("student/details/", StudentDetailsView.as_view(), name="student_details"),
    path("faculty/details/", FacultyDetailsView.as_view(), name="faculty_details"),
    path("students/", AllStudentsView.as_view(), name="all_students"),
    path("request-password-reset/", RequestPasswordResetView.as_view(), name="request_password_reset"),
    path("reset-password/", ResetPasswordView.as_view(), name="reset_password"),
    path("otp/generate/", GenerateOTPView.as_view(), name="generate-otp"),
]
