from django.test import TestCase
from django.urls import reverse
from rest_framework import status
from rest_framework.test import APITestCase, APIClient
from quiz.models import Question, Quiz, QuizAssignment, StudentPerformance
from authentication.models import User
import json

class ScoringAndRankingTests(APITestCase):
    def setUp(self):
        # Create test users
        self.faculty = User.objects.create_user(
            username='faculty_test',
            roll_no='123456',
            first_name='Test',
            last_name='Faculty',
            email='faculty@test.com',
            password='password123',
            is_faculty=True,
            is_student=False
        )
        
        self.student = User.objects.create_user(
            username='student_test',
            roll_no='523151',
            first_name='Test',
            last_name='Student',
            email='student@test.com',
            password='password123',
            is_faculty=False,
            is_student=True
        )
        
        # Create test quiz
        self.quiz = Quiz.objects.create(
            title='Test Quiz',
            course_id='CS101',
            topic='Python Basics',
            difficulty='medium',
            questions_per_student=2,
            created_by=self.faculty
        )
        
        # Create test questions
        self.question1 = Question.objects.create(
            text='What is Python?',
            topic='Python Basics',
            difficulty='easy',
            type='mcq',
            options=['Programming language', 'Framework', 'Database'],
            correct_answer=['Programming language'],
            max_score=2.0,
            created_by=self.faculty,
            quiz=self.quiz
        )
        
        self.question2 = Question.objects.create(
            text='True or False: Python is case-sensitive.',
            topic='Python Basics',
            difficulty='easy',
            type='true_false',
            correct_answer=['True'],
            max_score=1.0,
            created_by=self.faculty,
            quiz=self.quiz
        )
        
        # Create quiz assignments
        self.assignment1 = QuizAssignment.objects.create(
            quiz=self.quiz,
            student=self.student,
            question=self.question1,
            student_answer='Programming language'
        )
        
        self.assignment2 = QuizAssignment.objects.create(
            quiz=self.quiz,
            student=self.student,
            question=self.question2,
            student_answer='True'
        )
        
        # Update quiz total score
        self.quiz.calculate_total_score()
        
        # Create client for testing
        self.client = APIClient()
        
    def test_student_performance(self):
        """Test student performance endpoints"""
        # Test with auth as student
        self.client.force_authenticate(user=self.student)
        
        # Get all performances
        response = self.client.get(reverse('quiz:student_performance'))
        self.assertEqual(response.status_code, status.HTTP_200_OK)
        self.assertEqual(len(response.data), 1)
        
        # Get specific quiz performance
        response = self.client.get(reverse('quiz:student_quiz_performance', args=[self.quiz.id]))
        self.assertEqual(response.status_code, status.HTTP_200_OK)
        self.assertEqual(response.data['quiz_title'], self.quiz.title)
        
    def test_class_performance(self):
        """Test class performance statistics"""
        # Test with auth as faculty
        self.client.force_authenticate(user=self.faculty)
        
        response = self.client.get(reverse('quiz:class_performance', args=[self.quiz.id]))
        self.assertEqual(response.status_code, status.HTTP_200_OK)
        self.assertEqual(response.data['quiz_title'], self.quiz.title)
        self.assertEqual(response.data['total_students'], 1)
        
    def test_student_rankings(self):
        """Test student rankings endpoint"""
        # Test with auth as faculty
        self.client.force_authenticate(user=self.faculty)
        
        response = self.client.get(reverse('quiz:student_rankings', args=[self.quiz.id]))
        self.assertEqual(response.status_code, status.HTTP_200_OK)
        self.assertEqual(len(response.data), 1)
        
    def test_update_question_score(self):
        """Test updating question score"""
        # Test with auth as faculty
        self.client.force_authenticate(user=self.faculty)
        
        # Update score for assignment1
        data = {'score': 1.5}
        response = self.client.post(
            reverse('quiz:update_question_score', args=[self.assignment1.id]),
            data,
            format='json'
        )
        self.assertEqual(response.status_code, status.HTTP_200_OK)
        
        # Check if score was updated
        self.assignment1.refresh_from_db()
        self.assertEqual(self.assignment1.score, 1.5)
        
        # Check if student performance was updated
        performance = StudentPerformance.objects.get(student=self.student, quiz=self.quiz)
        self.assertEqual(performance.total_score, 1.5)
        
    def test_unauthorized_access(self):
        """Test unauthorized access to endpoints"""
        # Test student trying to access faculty endpoints
        self.client.force_authenticate(user=self.student)
        
        response = self.client.get(reverse('quiz:class_performance', args=[self.quiz.id]))
        self.assertEqual(response.status_code, status.HTTP_403_FORBIDDEN)
        
        # Test faculty trying to access student endpoints
        self.client.force_authenticate(user=self.faculty)
        
        response = self.client.get(reverse('quiz:student_performance'))
        self.assertEqual(response.status_code, status.HTTP_403_FORBIDDEN)
        
    def test_invalid_quiz(self):
        """Test with invalid quiz ID"""
        # Test with auth as faculty
        self.client.force_authenticate(user=self.faculty)
        
        response = self.client.get(reverse('quiz:class_performance', args=[9999]))
        self.assertEqual(response.status_code, status.HTTP_404_NOT_FOUND)
        
    def test_invalid_assignment(self):
        """Test with invalid assignment ID"""
        # Test with auth as faculty
        self.client.force_authenticate(user=self.faculty)
        
        data = {'score': 1.5}
        response = self.client.post(
            reverse('quiz:update_question_score', args=[9999]),
            data,
            format='json'
        )
        self.assertEqual(response.status_code, status.HTTP_404_NOT_FOUND)
