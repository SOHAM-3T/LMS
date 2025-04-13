from django.urls import path
from .views import RegisterView, LoginView, StudentDetailsView, FacultyDetailsView, AllStudentsView
from rest_framework_simplejwt.views import TokenObtainPairView, TokenRefreshView

urlpatterns = [
    path("signup/", RegisterView.as_view(), name="signup"),
    path("login/", LoginView.as_view(), name="login"),
    path("token/", TokenObtainPairView.as_view(), name="token_obtain_pair"),
    path("token/refresh/", TokenRefreshView.as_view(), name="token_refresh"),
    path("student/details/", StudentDetailsView.as_view(), name="student_details"),
    path("faculty/details/", FacultyDetailsView.as_view(), name="faculty_details"),
    path("students/", AllStudentsView.as_view(), name="all_students"),
]
