from django.test import TestCase
from django.urls import reverse, NoReverseMatch
from rest_framework.test import APIClient
from django.contrib.auth import get_user_model

User = get_user_model()

class QuizApiTests(TestCase):
    def setUp(self):
        self.client = APIClient()
        # Create and authenticate a staff + faculty user
        self.user = User.objects.create_user(username='testuser', password='testpass', is_staff=True)
        self.user.is_faculty = True
        self.user.save()
        self.client.force_authenticate(user=self.user)

    def test_create_quiz_with_various_questions(self):
        try:
            url = reverse('quiz:create_quiz')
        except NoReverseMatch:
            url = '/quiz/create/'
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
                    "correct_answer": "4"
                },
                {
                    "text": "True or False: The sky is blue.",
                    "type": "true_false",
                    "correct_answer": "True"
                },
                {
                    "text": "What is the capital of France?",
                    "type": "short_answer",
                    "correct_answer": "Paris"
                }
            ]
        }
        response = self.client.post(url, data, format='json')
        self.assertIn(response.status_code, [201, 200])
        self.assertEqual(response.data['title'], "Test Quiz")
        self.assertEqual(len(response.data['questions']), 3)

    def test_quiz_update(self):
        try:
            create_url = reverse('quiz:create_quiz')
        except NoReverseMatch:
            create_url = '/quiz/create/'
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
                    "correct_answer": "Water"
                }
            ]
        }
        create_resp = self.client.post(create_url, data, format='json')
        self.assertIn(create_resp.status_code, [201, 200])
        quiz_id = create_resp.data['id'] if 'id' in create_resp.data else create_resp.data.get('pk', 1)

        try:
            update_url = reverse('quiz:quiz_detail_and_edit', args=[quiz_id])
        except NoReverseMatch:
            update_url = f'/quiz/quiz/{quiz_id}/'
        update_data = data.copy()
        update_data['title'] = "Updated Quiz Title"
        update_data['questions'].append({
            "text": "What planet do we live on?",
            "type": "short_answer",
            "correct_answer": "Earth"
        })
        resp = self.client.put(update_url, update_data, format='json')
        self.assertIn(resp.status_code, [200, 202, 201])
        self.assertEqual(resp.data['title'], "Updated Quiz Title")
        self.assertEqual(len(resp.data['questions']), 2)

    def test_quiz_list(self):
        try:
            url = reverse('quiz:faculty_quizzes')
        except NoReverseMatch:
            url = '/quiz/faculty/quizzes/'
        response = self.client.get(url)
        self.assertIn(response.status_code, [200, 201])
        self.assertIsInstance(response.data, list)
