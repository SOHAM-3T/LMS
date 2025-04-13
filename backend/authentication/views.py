from django.contrib.auth import get_user_model, authenticate
from django.shortcuts import render
from rest_framework import status
from rest_framework.response import Response
from rest_framework.views import APIView
from rest_framework.permissions import IsAuthenticated
from rest_framework_simplejwt.tokens import RefreshToken
from rest_framework_simplejwt.views import TokenObtainPairView, TokenRefreshView

User = get_user_model()

class RegisterView(APIView):
    def post(self, request):
        try:
            username = request.data.get("username")
            email = request.data.get("email")
            password = request.data.get("password")
            first_name = request.data.get("first_name")
            last_name = request.data.get("last_name")
            user_type = request.data.get("user_type", "student")  # Default to student if not specified

            # Validate required fields
            if not all([username, email, password]):
                return Response(
                    {"error": "Username, email, and password are required"}, 
                    status=status.HTTP_400_BAD_REQUEST
                )

            # Check for existing username
            if User.objects.filter(username=username).exists():
                return Response(
                    {"error": "Username already exists"}, 
                    status=status.HTTP_400_BAD_REQUEST
                )

            # Check for existing email
            if User.objects.filter(email=email).exists():
                return Response(
                    {"error": "Email already exists"}, 
                    status=status.HTTP_400_BAD_REQUEST
                )

            # Create user with all fields
            user = User.objects.create_user(
                username=username,
                email=email,
                password=password,
                first_name=first_name or "",
                last_name=last_name or ""
            )

            # Set user type
            if user_type == "faculty":
                user.is_faculty = True
                user.is_student = False
            else:
                user.is_faculty = False
                user.is_student = True
            
            user.save()

            return Response(
                {"message": "User registered successfully"}, 
                status=status.HTTP_201_CREATED
            )
        except Exception as e:
            return Response(
                {"error": str(e)}, 
                status=status.HTTP_400_BAD_REQUEST
            )


class LoginView(APIView):
    def post(self, request):
        username = request.data.get("username")
        password = request.data.get("password")

        user = authenticate(username=username, password=password)
        if user is None:
            return Response({"error": "Invalid credentials"}, status=status.HTTP_401_UNAUTHORIZED)

        # Explicitly check user type
        if not user.is_faculty and not user.is_student:
            return Response({"error": "Invalid user type"}, status=status.HTTP_403_FORBIDDEN)

        # Generate JWT token
        refresh = RefreshToken.for_user(user)
        
        return Response({
            "refresh": str(refresh),
            "access": str(refresh.access_token),
            "is_faculty": user.is_faculty,
            "is_student": user.is_student,
            "username": user.username
        }, status=status.HTTP_200_OK)

class StudentDetailsView(APIView):
    permission_classes = [IsAuthenticated]

    def get(self, request):
        try:
            user = request.user
            if not user.is_student:
                return Response(
                    {"error": "Access denied. Student account required."},
                    status=status.HTTP_403_FORBIDDEN
                )

            return Response({
                "username": user.username,
                "first_name": user.first_name,
                "last_name": user.last_name,
                "email": user.email
            }, status=status.HTTP_200_OK)
        except Exception as e:
            return Response(
                {"error": str(e)},
                status=status.HTTP_400_BAD_REQUEST
            )

class FacultyDetailsView(APIView):
    permission_classes = [IsAuthenticated]

    def get(self, request):
        try:
            user = request.user
            if not user.is_faculty:
                return Response(
                    {"error": "Access denied. Faculty account required."},
                    status=status.HTTP_403_FORBIDDEN
                )

            return Response({
                "username": user.username,
                "first_name": user.first_name,
                "last_name": user.last_name,
                "email": user.email,
                "status": "Admin"  # Common status for all faculties
            }, status=status.HTTP_200_OK)
        except Exception as e:
            return Response(
                {"error": str(e)},
                status=status.HTTP_400_BAD_REQUEST
            )

class AllStudentsView(APIView):
    permission_classes = [IsAuthenticated]

    def get(self, request):
        try:
            user = request.user
            if not user.is_faculty:
                return Response(
                    {"error": "Access denied. Faculty account required."},
                    status=status.HTTP_403_FORBIDDEN
                )

            # Get all students
            students = User.objects.filter(is_student=True)
            
            # Format student data
            students_data = [{
                "id": student.id,
                "username": student.username,
                "first_name": student.first_name,
                "last_name": student.last_name,
                "email": student.email,
                "average_score": 85,  # Placeholder - replace with actual score calculation
                "attendance": 90,      # Placeholder - replace with actual attendance calculation
                "class_rank": 3,       # Placeholder - replace with actual rank calculation
                "percentile": 95       # Placeholder - replace with actual percentile calculation
            } for student in students]

            return Response(students_data, status=status.HTTP_200_OK)
        except Exception as e:
            return Response(
                {"error": str(e)},
                status=status.HTTP_400_BAD_REQUEST
            )
