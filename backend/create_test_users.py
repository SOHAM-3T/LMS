import os
import django

os.environ.setdefault('DJANGO_SETTINGS_MODULE', 'backend.settings')
django.setup()

from authentication.models import User

def create_users():
    # Create faculty user
    faculty, created = User.objects.get_or_create(
        roll_no='423194',
        defaults={
            'first_name': 'Faculty',
            'last_name': 'Test',
            'email': 'faculty@test.com',
            'is_faculty': True,
            'is_student': False,
            'is_active': True
        }
    )
    if created:
        faculty.set_password('password123')
        faculty.save()
        print("Created faculty user")
    else:
        print("Faculty user already exists")

    # Create student user
    student, created = User.objects.get_or_create(
        roll_no='523151',
        defaults={
            'first_name': 'Student',
            'last_name': 'Test',
            'email': 'student@test.com',
            'is_faculty': False,
            'is_student': True,
            'is_active': True
        }
    )
    if created:
        student.set_password('password123')
        student.save()
        print("Created student user")
    else:
        print("Student user already exists")

if __name__ == '__main__':
    create_users()
