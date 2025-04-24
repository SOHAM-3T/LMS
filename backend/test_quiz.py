import os
import django

os.environ.setdefault('DJANGO_SETTINGS_MODULE', 'backend.settings')
django.setup()

from quiz.models import Question, Quiz, QuizAssignment
from authentication.models import User

# Get faculty user
faculty = User.objects.get(roll_no='423194')

# Create a quiz
quiz = Quiz.objects.create(
    title="Python Basics Quiz",
    course_id="CS101",
    topic="Python Fundamentals",
    difficulty="medium",
    questions_per_student=5,
    created_by=faculty
)

# Get available questions
available_questions = Question.objects.filter(
    topic=quiz.topic,
    difficulty=quiz.difficulty
)

print(f"Available questions: {available_questions.count()}")

# Get active students
students = User.objects.filter(is_student=True, is_active=True)
print(f"Active students: {students.count()}")

# Assign questions to students
for student in students:
    # Get random questions for this student
    student_questions = available_questions.order_by('?')[:quiz.questions_per_student]
    
    # Create assignments
    assignments = [
        QuizAssignment(
            quiz=quiz,
            student=student,
            question=question
        ) for question in student_questions
    ]
    QuizAssignment.objects.bulk_create(assignments)

print("Quiz created and questions assigned successfully!")

# Print assignments for verification
assignments = QuizAssignment.objects.filter(quiz=quiz)
print(f"\nTotal assignments created: {assignments.count()}")
for assignment in assignments:
    print(f"Student: {assignment.student.roll_no}, Question: {assignment.question.text}")
