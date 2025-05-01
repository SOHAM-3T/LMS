import requests
import json

# Configuration
BASE_URL = "http://127.0.0.1:8000"  # Updated to match frontend config
QUIZ_ID = "59"
TOKEN = "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJ0b2tlbl90eXBlIjoiYWNjZXNzIiwiZXhwIjoxNzQ2NjQ4Mzk1LCJpYXQiOjE3NDYwNDM1OTUsImp0aSI6ImFhMWU5NTM0NDFmYTRiMTliZTcxODJhOGZjZjRiYTQzIiwidXNlcl9pZCI6IjY1NDFhZGQyLWM3ZTEtNGE3Ni1iMzFkLTEzY2M5NGVkYjc4NCJ9.svC3qa-KJbEqL6kwlZ_3hmKCegFoFYSqA6VVKHqXgS0"

def print_debug_info(prefix, response):
    print(f"\n=== {prefix} Debug Info ===")
    print(f"URL: {response.url}")
    print(f"Status Code: {response.status_code}")
    print(f"Response Headers: {dict(response.headers)}")
    print(f"Request Headers: {dict(response.request.headers)}")
    print("\nResponse Content:")
    try:
        print(response.text)
        if response.headers.get('content-type', '').startswith('application/json'):
            print("\nParsed JSON:")
            print(json.dumps(response.json(), indent=2))
    except Exception as e:
        print(f"Error parsing response: {str(e)}")
    print("="*50)

def test_performance_endpoint():
    """Test the quiz performance endpoint"""
    url = f"{BASE_URL}/quiz/student/performance/{QUIZ_ID}/"
    headers = {
        'Authorization': f'Bearer {TOKEN}',
        'Accept': 'application/json',
        'Cache-Control': 'no-cache, no-store, must-revalidate',
        'Pragma': 'no-cache',
        'Expires': '0'
    }

    try:
        print("\nTesting Quiz Performance Endpoint...")
        response = requests.get(url, headers=headers)
        print_debug_info("Performance Endpoint", response)
    except requests.RequestException as e:
        print(f"\nError making request to performance endpoint: {str(e)}")

def test_quiz_results_endpoint():
    """Test the quiz results endpoint"""
    url = f"{BASE_URL}/quiz/quiz/{QUIZ_ID}/results/"
    headers = {
        'Authorization': f'Bearer {TOKEN}',
        'Accept': 'application/json',
        'Cache-Control': 'no-cache, no-store, must-revalidate',
        'Pragma': 'no-cache',
        'Expires': '0'
    }

    try:
        print("\nTesting Quiz Results Endpoint...")
        response = requests.get(url, headers=headers)
        print_debug_info("Quiz Results Endpoint", response)
    except requests.RequestException as e:
        print(f"\nError making request to results endpoint: {str(e)}")

if __name__ == "__main__":
    print("=== Testing Quiz API Endpoints ===")
    test_performance_endpoint()
    test_quiz_results_endpoint() 