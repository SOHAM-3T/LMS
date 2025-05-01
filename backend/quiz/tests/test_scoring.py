from django.test import TestCase
from django.urls import reverse
from rest_framework import status
from rest_framework.test import APITestCase, APIClient
from quiz.models import Question, Quiz, QuizAssignment, StudentPerformance
from authentication.models import User
import json
from decimal import Decimal

class AdvancedScoringTests(APITestCase):
    def setUp(self):
        # Create test users
        self.faculty = User.objects.create_user(
            username='faculty123',
            roll_no='123456',
            first_name='Test',
            last_name='Faculty',
            email='faculty@test.com',
            password='password123',
            is_faculty=True,
            is_student=False
        )
        
        # Create multiple students
        self.students = []
        for i in range(5):
            student = User.objects.create_user(
                username=f'student{i}',
                roll_no=f'52315{i}',
                first_name=f'Test{i}',
                last_name='Student',
                email=f'student{i}@test.com',
                password='password123',
                is_faculty=False,
                is_student=True
            )
            self.students.append(student)
        
        # Create test quiz with varying difficulty questions
        self.quiz = Quiz.objects.create(
            title='Advanced Test Quiz',
            course_id='CS101',
            topic='Python Advanced',
            difficulty='hard',
            questions_per_student=3,
            created_by=self.faculty
        )
        
        # Create test questions with different max scores
        self.questions = []
        for i in range(3):
            question = Question.objects.create(
                text=f'Advanced Question {i+1}',
                topic='Python Advanced',
                difficulty='hard',
                type='mcq',
                options=['Option A', 'Option B', 'Option C'],
                correct_answer=['Option A'],
                max_score=Decimal(f'{i+1}.5'),  # Different max scores: 1.5, 2.5, 3.5
                created_by=self.faculty,
                quiz=self.quiz
            )
            self.questions.append(question)
        
        # Create quiz assignments for all students
        self.assignments = []
        for student in self.students:
            for question in self.questions:
                assignment = QuizAssignment.objects.create(
                    quiz=self.quiz,
                    student=student,
                    question=question,
                    student_answer='Option A'  # All students answer correctly
                )
                self.assignments.append(assignment)
        
        # Update quiz total score
        self.quiz.calculate_total_score()
        
        # Create client for testing
        self.client = APIClient()
    
    def test_multiple_student_performance(self):
        """Test performance calculation with multiple students"""
        # Test with auth as faculty
        self.client.force_authenticate(user=self.faculty)
        
        # Grade all assignments
        for assignment in self.assignments:
            response = self.client.post(
                reverse('quiz:update_question_score', args=[assignment.id]),
                {'score': str(assignment.question.max_score)},
                format='json'
            )
            self.assertEqual(response.status_code, status.HTTP_200_OK)
        
        # Get class performance
        response = self.client.get(reverse('quiz:class_performance', args=[self.quiz.id]))
        self.assertEqual(response.status_code, status.HTTP_200_OK)
        
        # Verify all students have perfect scores
        self.assertEqual(response.data['total_students'], 5)
        self.assertEqual(float(response.data['average_score']), 7.5)
        
        # Verify score distribution
        self.assertEqual(response.data['score_distribution']['81-100'], 5)
    
    def test_partial_scores(self):
        """Test performance with partial scores"""
        # Test with auth as faculty
        self.client.force_authenticate(user=self.faculty)
        
        # Grade assignments with partial scores
        for i, assignment in enumerate(self.assignments):
            score = assignment.question.max_score * Decimal('0.5')  # 50% of max score
            response = self.client.post(
                reverse('quiz:update_question_score', args=[assignment.id]),
                {'score': str(score)},
                format='json'
            )
            self.assertEqual(response.status_code, status.HTTP_200_OK)
        
        # Get class performance
        response = self.client.get(reverse('quiz:class_performance', args=[self.quiz.id]))
        self.assertEqual(response.status_code, status.HTTP_200_OK)
        
        # Verify average score is 50% of total
        self.assertEqual(float(response.data['average_score']), 3.75)
        
        # Verify score distribution
        self.assertEqual(response.data['score_distribution']['41-60'], 5)
    
    def test_student_rankings(self):
        """Test student rankings with varying scores"""
        # Test with auth as faculty
        self.client.force_authenticate(user=self.faculty)
        
        # Grade assignments with different scores for each student
        # Each student gets a different percentage of max score
        # Student 0: 20% of max score
        # Student 1: 40% of max score
        # Student 2: 60% of max score
        # Student 3: 80% of max score
        # Student 4: 100% of max score
        for i, student in enumerate(self.students):
            student_assignments = [a for a in self.assignments if a.student == student]
            percentage = (i + 1) * 0.2  # 0.2, 0.4, 0.6, 0.8, 1.0
            for assignment in student_assignments:
                score = assignment.question.max_score * Decimal(str(percentage))
                response = self.client.post(
                    reverse('quiz:update_question_score', args=[assignment.id]),
                    {'score': str(score)},
                    format='json'
                )
                self.assertEqual(response.status_code, status.HTTP_200_OK)
        
        # Get student rankings
        response = self.client.get(reverse('quiz:student_rankings', args=[self.quiz.id]))
        self.assertEqual(response.status_code, status.HTTP_200_OK)
        
        # Verify rankings are in correct order (highest to lowest)
        scores = [float(perf['total_score']) for perf in response.data]
        self.assertEqual(scores, sorted(scores, reverse=True))
        
        # Verify percentiles using the correct statistical formula
        # For 5 students with distinct scores:
        # Student 4 (highest): (4 below + 0 equal) / 5 * 100 = 80%
        # Student 3: (3 below + 0 equal) / 5 * 100 = 60%
        # Student 2: (2 below + 0 equal) / 5 * 100 = 40%
        # Student 1: (1 below + 0 equal) / 5 * 100 = 20%
        # Student 0 (lowest): (0 below + 0 equal) / 5 * 100 = 0%
        expected_percentiles = [80.0, 60.0, 40.0, 20.0, 0.0]
        for i, perf in enumerate(response.data):
            self.assertAlmostEqual(float(perf['percentile']), expected_percentiles[i], places=1)
    
    def test_invalid_scores(self):
        """Test handling of invalid scores"""
        # Test with auth as faculty
        self.client.force_authenticate(user=self.faculty)
        
        # Test negative score
        response = self.client.post(
            reverse('quiz:update_question_score', args=[self.assignments[0].id]),
            {'score': '-1.0'},
            format='json'
        )
        self.assertEqual(response.status_code, status.HTTP_400_BAD_REQUEST)
        
        # Test score higher than max
        response = self.client.post(
            reverse('quiz:update_question_score', args=[self.assignments[0].id]),
            {'score': '10.0'},
            format='json'
        )
        self.assertEqual(response.status_code, status.HTTP_400_BAD_REQUEST)
        
        # Test invalid score format
        response = self.client.post(
            reverse('quiz:update_question_score', args=[self.assignments[0].id]),
            {'score': 'invalid'},
            format='json'
        )
        self.assertEqual(response.status_code, status.HTTP_400_BAD_REQUEST)
    
    def test_performance_updates(self):
        """Test performance updates when scores change"""
        # Test with auth as faculty
        self.client.force_authenticate(user=self.faculty)
        
        # Initial score
        response = self.client.post(
            reverse('quiz:update_question_score', args=[self.assignments[0].id]),
            {'score': '1.0'},
            format='json'
        )
        self.assertEqual(response.status_code, status.HTTP_200_OK)
        
        # Get initial performance
        self.client.force_authenticate(user=self.students[0])
        response = self.client.get(reverse('quiz:student_quiz_performance', args=[self.quiz.id]))
        self.assertEqual(response.status_code, status.HTTP_200_OK)
        initial_score = response.data['total_score']
        
        # Update score
        self.client.force_authenticate(user=self.faculty)
        response = self.client.post(
            reverse('quiz:update_question_score', args=[self.assignments[0].id]),
            {'score': '1.5'},
            format='json'
        )
        self.assertEqual(response.status_code, status.HTTP_200_OK)
        
        # Verify performance was updated
        self.client.force_authenticate(user=self.students[0])
        response = self.client.get(reverse('quiz:student_quiz_performance', args=[self.quiz.id]))
        self.assertEqual(response.status_code, status.HTTP_200_OK)
        self.assertGreater(float(response.data['total_score']), float(initial_score)) 