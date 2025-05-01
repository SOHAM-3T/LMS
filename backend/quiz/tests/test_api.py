from django.test import TestCase
from django.urls import reverse, NoReverseMatch
from rest_framework.test import APIClient
from django.contrib.auth import get_user_model
from django.core.files.uploadedfile import SimpleUploadedFile
import json

User = get_user_model()

class QuizApiTests(TestCase):
    def setUp(self):
        self.client = APIClient()
        # Create and authenticate a staff + faculty user
        self.user = User.objects.create_user(username='testuser', password='testpass', is_staff=True)
        self.user.is_faculty = True
        self.user.save()
        self.client.force_authenticate(user=self.user)
        
        # Create mock image file
        self.mock_image = SimpleUploadedFile(
            name='test_image.jpg',
            content=b'test image content',
            content_type='image/jpeg'
        )

    def test_create_quiz_with_various_questions(self):
        url = reverse('quiz:create_quiz')
        data = {
            "title": "Test Quiz",
            "course_id": "CSE101",
            "topic": "Math",
            "difficulty": "easy",
            "questions_per_student": 2,
            "questions": [
                {
                    "text": "What is 2+2?",
                    "type": "mcq",
                    "options": ["3", "4", "5"],
                    "correct_answer": ["4"],
                    "max_score": 2.0,
                    "topic": "Math",
                    "difficulty": "easy",
                    "created_by": self.user.id
                },
                {
                    "text": "True or False: The sky is blue.",
                    "type": "true_false",
                    "correct_answer": ["True"],
                    "max_score": 1.0,
                    "topic": "Math",
                    "difficulty": "easy",
                    "created_by": self.user.id
                },
                {
                    "text": "What is the capital of France?",
                    "type": "short_answer",
                    "correct_answer": ["Paris"],
                    "max_score": 2.0,
                    "topic": "Math",
                    "difficulty": "easy",
                    "created_by": self.user.id
                }
            ]
        }
        # Create mock image file
        mock_image = SimpleUploadedFile(
            name='test_image.jpg',
            content=b'',
            content_type='image/jpeg'
        )
        
        # Add image to request.FILES
        response = self.client.post(url, data, format='multipart', FILES={'images': [self.mock_image, self.mock_image, self.mock_image]})
        print(f"Create quiz response: {response.data}")
        self.assertEqual(response.status_code, 201)
        self.assertEqual(response.data['title'], "Test Quiz")
        self.assertEqual(len(response.data['questions']), 3)
        # Verify questions were created with correct data
        for question in response.data['questions']:
            self.assertIn('text', question)
            self.assertIn('type', question)
            self.assertIn('max_score', question)
            self.assertIn('topic', question)
            self.assertIn('difficulty', question)
            self.assertIn('created_by', question)
            self.assertEqual(question['created_by'], self.user.id)

    def test_quiz_update(self):
        create_url = reverse('quiz:create_quiz')
        data = {
            "title": "Quiz to Update",
            "course_id": "CSE102",
            "topic": "Science",
            "difficulty": "medium",
            "questions_per_student": 1,
            "questions": [
                {
                    "text": "What is H2O?",
                    "type": "short_answer",
                    "correct_answer": ["Water"],
                    "max_score": 2.0,
                    "topic": "Science",
                    "difficulty": "medium",
                    "created_by": self.user.id
                }
            ]
        }
        # Add image to request.FILES
        create_resp = self.client.post(create_url, data, format='multipart', FILES={'images': [self.mock_image]})
        print(f"Create quiz update response: {create_resp.data}")
        self.assertEqual(create_resp.status_code, 201)
        quiz_id = create_resp.data['id']
        # Verify questions were created with correct data
        for question in create_resp.data['questions']:
            self.assertIn('text', question)
            self.assertIn('type', question)
            self.assertIn('max_score', question)
            self.assertIn('topic', question)
            self.assertIn('difficulty', question)
            self.assertIn('created_by', question)
            self.assertEqual(question['created_by'], self.user.id)

        update_url = reverse('quiz:quiz_detail_and_edit', args=[quiz_id])
        update_data = data.copy()
        update_data['title'] = "Updated Quiz Title"
        update_data['questions'].append({
            "text": "What planet do we live on?",
            "type": "short_answer",
            "correct_answer": ["Earth"],
            "max_score": 2.0,
            "topic": "Science",
            "difficulty": "medium",
            "created_by": self.user.id
        })
        # Update quiz without images since we're not creating new questions
        resp = self.client.put(update_url, update_data, format='json')
        print(f"Update quiz response: {resp.data}")
        self.assertEqual(resp.status_code, 200)
        self.assertEqual(resp.status_code, 200)
        self.assertEqual(resp.data['title'], "Updated Quiz Title")
        self.assertEqual(len(resp.data['questions']), 2)

    def test_quiz_list(self):
        url = reverse('quiz:faculty_quizzes')
        response = self.client.get(url)
        self.assertEqual(response.status_code, 200)
        self.assertIsInstance(response.data, list)
