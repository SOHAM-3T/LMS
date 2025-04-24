from django.db import models
from django.utils import timezone
from authentication.models import User

# Create your models here.

class Question(models.Model):
    DIFFICULTY_CHOICES = [
        ('easy', 'Easy'),
        ('medium', 'Medium'),
        ('hard', 'Hard')
    ]
    
    text = models.TextField()
    topic = models.CharField(max_length=100)
    difficulty = models.CharField(max_length=10, choices=DIFFICULTY_CHOICES)
    created_at = models.DateTimeField(auto_now_add=True)
    created_by = models.ForeignKey(User, on_delete=models.CASCADE)

    class Meta:
        app_label = 'quiz'
        indexes = [
            models.Index(fields=['topic', 'difficulty']),
        ]

    def __str__(self):
        return f"{self.topic} - {self.difficulty} - {self.text[:50]}..."

class Quiz(models.Model):
    DIFFICULTY_CHOICES = [
        ('easy', 'Easy'),
        ('medium', 'Medium'),
        ('hard', 'Hard')
    ]
    
    title = models.CharField(max_length=200)
    course_id = models.CharField(max_length=20)
    topic = models.CharField(max_length=100)
    difficulty = models.CharField(max_length=10, choices=DIFFICULTY_CHOICES)
    questions_per_student = models.PositiveIntegerField()
    created_by = models.ForeignKey(User, on_delete=models.CASCADE)
    created_at = models.DateTimeField(auto_now_add=True)
    is_active = models.BooleanField(default=True)

    class Meta:
        app_label = 'quiz'
        indexes = [
            models.Index(fields=['course_id', 'created_at']),
            models.Index(fields=['topic', 'difficulty']),
        ]

    def __str__(self):
        return f"{self.title} - {self.course_id}"

class QuizAssignment(models.Model):
    quiz = models.ForeignKey(Quiz, on_delete=models.CASCADE)
    student = models.ForeignKey(User, on_delete=models.CASCADE)
    question = models.ForeignKey(Question, on_delete=models.CASCADE, null=True)  # Allow null temporarily for migration
    question_id_legacy = models.CharField(max_length=100, null=True, blank=True)  # Keep old field for migration
    assigned_at = models.DateTimeField(auto_now_add=True)
    completed = models.BooleanField(default=False)
    student_answer = models.TextField(null=True, blank=True)  # Student's answer to the question
    score = models.DecimalField(max_digits=5, decimal_places=2, null=True, blank=True)  # Score for this question
    submitted_at = models.DateTimeField(null=True, blank=True)  # When the student submitted their answer

    class Meta:
        app_label = 'quiz'
        unique_together = ('quiz', 'student', 'question')
        indexes = [
            models.Index(fields=['quiz', 'student']),
        ]

    def __str__(self):
        if self.question:
            return f"{self.quiz.title} - {self.student.roll_no} - Q{self.question.id}"
        return f"{self.quiz.title} - {self.student.roll_no} - Q{self.question_id_legacy}"
