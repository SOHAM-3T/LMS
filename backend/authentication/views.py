from django.contrib.auth import get_user_model, authenticate
from django.shortcuts import render
from django.core.mail import send_mail
from django.conf import settings
from django.utils import timezone
from rest_framework import status
from rest_framework.response import Response
from rest_framework.views import APIView
from rest_framework.permissions import IsAuthenticated, AllowAny
from rest_framework_simplejwt.tokens import RefreshToken
from rest_framework_simplejwt.views import TokenObtainPairView, TokenRefreshView
from .models import OTPVerification
from datetime import timedelta
import random
import string
import jwt
from .serializers import UserSerializer, OTPSerializer

User = get_user_model()

def generate_access_token(user):
    refresh = RefreshToken.for_user(user)
    return str(refresh.access_token)

class RegisterView(APIView):
    def post(self, request):
        serializer = UserSerializer(data=request.data)
        if serializer.is_valid():
            email = serializer.validated_data.get('email')
            roll_no = serializer.validated_data.get('roll_no')
            password = request.data.get('password')  # Get password from request data
            user_type = request.data.get('user_type', 'student')  # Default to student if not specified
            
            # Check if user already exists
            if User.objects.filter(email=email).exists():
                return Response(
                    {'error': 'User with this email already exists'},
                    status=status.HTTP_400_BAD_REQUEST
                )
            
            if User.objects.filter(roll_no=roll_no).exists():
                return Response(
                    {'error': 'User with this roll number already exists'},
                    status=status.HTTP_400_BAD_REQUEST
                )

            # Create user with appropriate user type
            user = serializer.save()
            
            # Set password properly
            user.set_password(password)
            
            # Set user type and year based on user_type parameter
            if user_type.lower() == 'faculty':
                user.is_faculty = True
                user.is_student = False
                user.year = ''  # Set year as empty string for faculty
            else:
                user.is_faculty = False
                user.is_student = True
                # For students, year is required and should be set in the request
            
            # Set user as inactive until OTP verification
            user.is_active = False
            user.save()

            # Generate and send OTP
            otp = OTPVerification.generate_otp()
            expires_at = timezone.now() + timedelta(minutes=5)
            OTPVerification.objects.create(
                email=email,
                otp=OTPVerification.hash_otp(otp),
                expires_at=expires_at,
                purpose='signup'
            )

            # Send OTP email
            send_mail(
                'Verify your NIT Andhra Account',
                f'Your verification code is: {otp}\n\nThis code will expire in 5 minutes.',
                settings.DEFAULT_FROM_EMAIL,
                [email],
                fail_silently=False,
            )

            return Response({
                "message": "Registration successful. Please verify your email with the OTP sent.",
                "email": email,
                "needs_verification": True
            }, status=status.HTTP_201_CREATED)

        return Response(serializer.errors, status=status.HTTP_400_BAD_REQUEST)

class GenerateOTPView(APIView):
    permission_classes = [AllowAny]

    def post(self, request):
        email = request.data.get('email')
        purpose = request.data.get('purpose', 'signup')

        if not email:
            return Response({'error': 'Email is required'}, status=status.HTTP_400_BAD_REQUEST)

        # Validate email format
        if not email.endswith('@student.nitandhra.ac.in') and not email.endswith('@faculty.nitandhra.ac.in'):
            return Response({'error': 'Please use your NIT Andhra email address'}, 
                          status=status.HTTP_400_BAD_REQUEST)

        try:
            # Delete any existing OTP records for this email and purpose
            OTPVerification.objects.filter(email=email, purpose=purpose).delete()
            
            # Generate 6-digit OTP
            otp = OTPVerification.generate_otp()
            expires_at = timezone.now() + timedelta(minutes=5)

            # Create new OTP record
            OTPVerification.objects.create(
                email=email,
                otp=OTPVerification.hash_otp(otp),
                expires_at=expires_at,
                purpose=purpose
            )

            # Send OTP via email
            subject = 'Your OTP for NIT AP LMS'
            message = f'Your OTP is: {otp}\nThis OTP will expire in 5 minutes.'
            from_email = settings.DEFAULT_FROM_EMAIL
            recipient_list = [email]
            
            try:
                send_mail(
                    subject,
                    message,
                    from_email,
                    recipient_list,
                    fail_silently=False,
                )
                return Response({'message': 'OTP sent successfully'}, status=status.HTTP_200_OK)
            except Exception as e:
                print(f'Error sending OTP: {str(e)}')
                # Delete the OTP record if email sending fails
                OTPVerification.objects.filter(email=email, purpose=purpose).delete()
                return Response({'error': 'Failed to send OTP. Please try again.'}, 
                              status=status.HTTP_500_INTERNAL_SERVER_ERROR)

        except Exception as e:
            print(f'Error generating OTP: {str(e)}')
            return Response({'error': 'Failed to generate OTP. Please try again.'}, 
                          status=status.HTTP_500_INTERNAL_SERVER_ERROR)

class VerifyOTPView(APIView):
    permission_classes = [AllowAny]

    def post(self, request):
        print("VerifyOTPView received request:", request.data)  # Debug log
        email = request.data.get('email')
        otp = request.data.get('otp')
        purpose = request.data.get('purpose', 'signup')

        if not all([email, otp]):
            print("Missing required fields:", {'email': email, 'otp': otp})  # Debug log
            return Response({'error': 'Email and OTP are required'}, status=status.HTTP_400_BAD_REQUEST)

        try:
            print("Looking for OTP record for:", email)  # Debug log
            otp_obj = OTPVerification.objects.get(
                email=email,
                purpose=purpose,
                is_verified=False
            )
            print("Found OTP record:", otp_obj)  # Debug log
        except OTPVerification.DoesNotExist:
            print("No OTP record found for:", email)  # Debug log
            return Response({'error': 'Invalid OTP request'}, status=status.HTTP_400_BAD_REQUEST)

        # Check if OTP is expired
        if timezone.now() > otp_obj.expires_at:
            print("OTP expired for:", email)  # Debug log
            return Response({'error': 'OTP has expired'}, status=status.HTTP_400_BAD_REQUEST)

        # Check if max attempts exceeded
        if otp_obj.attempts >= 3:
            print("Max attempts exceeded for:", email)  # Debug log
            return Response({'error': 'Maximum attempts exceeded'}, status=status.HTTP_400_BAD_REQUEST)

        # Verify OTP
        if otp_obj.otp == OTPVerification.hash_otp(otp):
            print("OTP verified successfully for:", email)  # Debug log
            otp_obj.is_verified = True
            otp_obj.save()

            if purpose == 'signup':
                # Activate user account
                try:
                    user = User.objects.get(email=email)
                    user.is_active = True
                    user.save()
                    print("User activated:", user.email)  # Debug log
                    return Response({
                        'message': 'Email verified successfully. You can now login.',
                        'email': email
                    }, status=status.HTTP_200_OK)
                except User.DoesNotExist:
                    print("User not found for:", email)  # Debug log
                    return Response({'error': 'User not found'}, status=status.HTTP_404_NOT_FOUND)
            else:
                return Response({'message': 'OTP verified successfully'}, status=status.HTTP_200_OK)
        else:
            print("Invalid OTP for:", email)  # Debug log
            otp_obj.attempts += 1
            otp_obj.save()
            return Response({'error': 'Invalid OTP'}, status=status.HTTP_400_BAD_REQUEST)

class RequestPasswordResetView(APIView):
    def post(self, request):
        email = request.data.get('email')

        if not email:
            return Response({"error": "Email is required"}, status=status.HTTP_400_BAD_REQUEST)

        try:
            user = User.objects.get(email=email)

            # Generate and send OTP
            otp = OTPVerification.generate_otp()
            expires_at = timezone.now() + timedelta(minutes=5)
            OTPVerification.objects.create(
                email=email,
                otp=OTPVerification.hash_otp(otp),
                expires_at=expires_at,
                purpose='password_reset'
            )

            # Send OTP email
            send_mail(
                'Reset Your NIT Andhra Password',
                f'Your password reset code is: {otp}\n\nThis code will expire in 5 minutes.',
                settings.DEFAULT_FROM_EMAIL,
                [email],
                fail_silently=False,
            )

            return Response({"message": "Password reset OTP sent successfully"})

        except User.DoesNotExist:
            return Response({"error": "No user found with this email"}, status=status.HTTP_404_NOT_FOUND)
        except Exception as e:
            return Response({"error": str(e)}, status=status.HTTP_400_BAD_REQUEST)

class ResetPasswordView(APIView):
    permission_classes = [AllowAny]

    def post(self, request):
        email = request.data.get('email')
        otp = request.data.get('otp')
        new_password = request.data.get('new_password')

        if not all([email, otp, new_password]):
            return Response({'error': 'Email, OTP, and new password are required'}, 
                          status=status.HTTP_400_BAD_REQUEST)

        try:
            # Get the OTP record
            otp_obj = OTPVerification.objects.get(
                email=email,
                purpose='password_reset',
                is_verified=True
            )

            # Verify OTP
            if otp_obj.otp != OTPVerification.hash_otp(otp):
                return Response({'error': 'Invalid OTP'}, 
                              status=status.HTTP_400_BAD_REQUEST)

            # Check if OTP is expired
            if timezone.now() > otp_obj.expires_at:
                return Response({'error': 'OTP has expired'}, 
                              status=status.HTTP_400_BAD_REQUEST)

            # Get the user
            try:
                user = User.objects.get(email=email)
            except User.DoesNotExist:
                return Response({'error': 'User not found'}, 
                              status=status.HTTP_404_NOT_FOUND)

            # Update password
            user.set_password(new_password)
            user.save()

            # Delete the used OTP
            otp_obj.delete()

            return Response({'message': 'Password reset successfully'}, 
                          status=status.HTTP_200_OK)

        except OTPVerification.DoesNotExist:
            return Response({'error': 'Invalid or unverified OTP'}, 
                          status=status.HTTP_400_BAD_REQUEST)
        except Exception as e:
            print(f'Error resetting password: {str(e)}')
            return Response({'error': 'Failed to reset password'}, 
                          status=status.HTTP_500_INTERNAL_SERVER_ERROR)

class LoginView(APIView):
    permission_classes = [AllowAny]
    authentication_classes = []
    def post(self, request):
        roll_no = request.data.get('roll_no')
        password = request.data.get('password')
        
        print(f"Login attempt for roll_no: {roll_no}")
        
        if not roll_no or not password:
            return Response({"error": "Roll number and password are required"}, status=status.HTTP_400_BAD_REQUEST)
        
        try:
            user = User.objects.get(roll_no=roll_no)
            print(f"User found: {user.email}, is_active: {user.is_active}")
            
            if not user.is_active:
                return Response({
                    "error": "Account is not active. Please verify your email with OTP.",
                    "email": user.email,
                    "needs_verification": True
                }, status=status.HTTP_400_BAD_REQUEST)
            
            # Use roll_no instead of username for authentication
            user = authenticate(username=roll_no, password=password)
            print(f"Authentication result: {user is not None}")
            
            if user is None:
                return Response({"error": "Invalid credentials"}, status=status.HTTP_400_BAD_REQUEST)
            
            refresh = RefreshToken.for_user(user)
            return Response({
                "access": str(refresh.access_token),
                "refresh": str(refresh),
                "is_faculty": user.is_faculty
            })
            
        except User.DoesNotExist:
            print(f"No user found with roll_no: {roll_no}")
            return Response({"error": "Invalid credentials"}, status=status.HTTP_400_BAD_REQUEST)

class StudentDetailsView(APIView):
    permission_classes = [IsAuthenticated]

    def get(self, request):
        try:
            # Get the user from the request
            user = request.user
            
            # Check if the user is a student
            if not user.is_student:
                return Response(
                    {'error': 'Access denied. This endpoint is for students only.'},
                    status=status.HTTP_403_FORBIDDEN
                )
            
            # Return student details
            return Response({
                'id': user.id,
                'username': user.username,
                'roll_no': user.roll_no,
                'email': user.email,
                'first_name': user.first_name,
                'last_name': user.last_name,
                'branch': get_branch_full_form(user.branch),
                'year': user.year,
                'is_active': user.is_active
            })
        except Exception as e:
            return Response(
                {'error': str(e)},
                status=status.HTTP_500_INTERNAL_SERVER_ERROR
            )

def get_branch_full_form(branch_code):
    branch_mapping = {
        'CS': 'Computer Science and Engineering',
        'EC': 'Electronics and Communication Engineering',
        'EE': 'Electrical and Electronics Engineering',
        'ME': 'Mechanical Engineering',
        'CE': 'Civil Engineering',
        'MT': 'Metallurgical and Materials Engineering',
        'CH': 'Chemical Engineering',
        'HM': 'School of Humanities and Management',
        'SC': 'School of Sciences',
        'BT': 'Biotechnology',
    }
    return branch_mapping.get(branch_code, branch_code)

class RefreshTokenView(APIView):
    permission_classes = [AllowAny]
    authentication_classes = []
    def post(self, request):
        try:
            refresh_token = request.data.get('refresh_token')
            if not refresh_token:
                return Response(
                    {'error': 'Refresh token is required'},
                    status=status.HTTP_400_BAD_REQUEST
                )

            # Verify the refresh token
            try:
                payload = jwt.decode(
                    refresh_token,
                    settings.SECRET_KEY,
                    algorithms=['HS256']
                )
            except jwt.ExpiredSignatureError:
                return Response(
                    {'error': 'Refresh token has expired'},
                    status=status.HTTP_401_UNAUTHORIZED
                )
            except jwt.InvalidTokenError:
                return Response(
                    {'error': 'Invalid refresh token'},
                    status=status.HTTP_401_UNAUTHORIZED
                )

            # Get user from payload
            user_id = payload.get('user_id')
            User = get_user_model()
            user = User.objects.get(id=user_id)

            # Generate new access token
            access_token = generate_access_token(user)

            return Response({
                'access_token': access_token
            })
        except Exception as e:
            return Response(
                {'error': str(e)},
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
                "branch": get_branch_full_form(user.branch),
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
                "email": student.email
            } for student in students]

            return Response(students_data, status=status.HTTP_200_OK)
        except Exception as e:
            return Response(
                {"error": str(e)},
                status=status.HTTP_400_BAD_REQUEST
            )
