import requests
import json
from datetime import datetime
import time

BASE_URL = 'http://127.0.0.1:8000'

def print_separator():
    print("\n" + "="*50 + "\n")

def login_user(roll_no, password):
    response = requests.post(
        f'{BASE_URL}/auth/login/',
        json={'roll_no': roll_no, 'password': password}
    )
    print(f"\nLogging in as {roll_no}...")
    print(f"Status: {response.status_code}")
    data = response.json()
    print(f"Response: {json.dumps(data, indent=2)}")
    return data.get('access')

def test_faculty_endpoints(token):
    headers = {'Authorization': f'Bearer {token}'}
    
    print_separator()
    print("=== Testing Faculty Endpoints ===")
    
    # Create a quiz
    print_separator()
    print("1. Creating a quiz...")
    quiz_data = {
        'title': 'Test Quiz',
        'course_id': 'CS101',
        'topic': 'Python Fundamentals',
        'difficulty': 'medium',
        'questions_per_student': 3
    }
    response = requests.post(f'{BASE_URL}/quiz/create/', json=quiz_data, headers=headers)
    print(f"Status: {response.status_code}")
    print(f"Response: {json.dumps(response.json(), indent=2)}")
    
    # Get faculty quizzes
    print_separator()
    print("2. Getting faculty quizzes...")
    response = requests.get(f'{BASE_URL}/quiz/faculty/quizzes/', headers=headers)
    print(f"Status: {response.status_code}")
    print(f"Response: {json.dumps(response.json(), indent=2)}")
    
    # Get quiz results (using the first quiz from the list)
    if response.status_code == 200 and response.json():
        quiz_id = response.json()[0]['id']
        print_separator()
        print(f"3. Getting results for quiz {quiz_id}...")
        response = requests.get(f'{BASE_URL}/quiz/quiz/{quiz_id}/results/', headers=headers)
        print(f"Status: {response.status_code}")
        print(f"Response: {json.dumps(response.json(), indent=2)}")
    
def test_student_endpoints(token):
    headers = {'Authorization': f'Bearer {token}'}
    
    print_separator()
    print("=== Testing Student Endpoints ===")
    
    # Get student quizzes
    print_separator()
    print("1. Getting student quizzes...")
    response = requests.get(f'{BASE_URL}/quiz/student/quizzes/', headers=headers)
    print(f"Status: {response.status_code}")
    print(f"Response: {json.dumps(response.json(), indent=2)}")
    
    # Get quiz questions (using the first quiz from the list)
    if response.status_code == 200 and response.json():
        quiz_id = response.json()[0]['id']
        print_separator()
        print(f"2. Getting questions for quiz {quiz_id}...")
        response = requests.get(f'{BASE_URL}/quiz/student/quiz/{quiz_id}/questions/', headers=headers)
        print(f"Status: {response.status_code}")
        questions_response = response.json()
        print(f"Response: {json.dumps(questions_response, indent=2)}")
        
        # Submit an answer for the first question
        if response.status_code == 200 and questions_response:
            assignment_id = questions_response[0]['assignment_id']
            print_separator()
            print(f"3. Submitting answer for assignment {assignment_id}...")
            answer_data = {
                'answer': 'This is a test answer for the question.'
            }
            response = requests.post(
                f'{BASE_URL}/quiz/student/assignment/{assignment_id}/submit/',
                json=answer_data,
                headers=headers
            )
            print(f"Status: {response.status_code}")
            print(f"Response: {json.dumps(response.json(), indent=2)}")
            
            # Get quiz results as student
            print_separator()
            print(f"4. Getting results for quiz {quiz_id} as student...")
            response = requests.get(f'{BASE_URL}/quiz/quiz/{quiz_id}/results/', headers=headers)
            print(f"Status: {response.status_code}")
            print(f"Response: {json.dumps(response.json(), indent=2)}")

def main():
    # Test faculty endpoints
    print("\nStarting API endpoint tests...")
    print_separator()
    
    faculty_token = login_user('423194', 'soham')
    if faculty_token:
        test_faculty_endpoints(faculty_token)
        # Wait a bit to let the quiz be created
        time.sleep(2)
    
    # Test student endpoints
    student_token = login_user('523151', 'password123')
    if student_token:
        test_student_endpoints(student_token)

if __name__ == '__main__':
    main()
