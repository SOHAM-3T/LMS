from django.urls import path
from . import views

app_name = 'quiz'

urlpatterns = [
    path('create/', views.create_quiz, name='create_quiz'),
    path('faculty/quizzes/', views.get_faculty_quizzes, name='faculty_quizzes'),
    path('student/quizzes/', views.get_student_quizzes, name='student_quizzes'),
    path('student/quiz/<int:quiz_id>/questions/', views.get_quiz_questions, name='quiz_questions'),
    path('student/assignment/<int:assignment_id>/submit/', views.submit_answer, name='submit_answer'),
    path('quiz/<int:quiz_id>/', views.quiz_detail_and_edit, name='quiz_detail_and_edit'),
    path('quiz/<int:quiz_id>/delete/', views.delete_quiz, name='delete_quiz'),
    path('quiz/<int:quiz_id>/results/', views.get_quiz_results, name='quiz_results'),
    
    # Scoring and Ranking Endpoints
    path('student/performance/', views.get_student_performance, name='student_performance'),
    path('student/performance/<int:quiz_id>/', views.get_student_performance, name='student_quiz_performance'),
    path('quiz/<int:quiz_id>/class-performance/', views.get_class_performance, name='class_performance'),
    path('quiz/<int:quiz_id>/rankings/', views.get_student_rankings, name='student_rankings'),
    path('assignment/<int:assignment_id>/score/', views.update_question_score, name='update_question_score'),
    path('quiz/<int:quiz_id>/performance/', views.get_student_quiz_performance, name='student_quiz_performance'),
]
