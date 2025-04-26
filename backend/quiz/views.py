from django.shortcuts import render
from rest_framework import status
from rest_framework.decorators import api_view, permission_classes
from rest_framework.response import Response
from rest_framework.permissions import IsAuthenticated
from django.db import connection, transaction
from django.contrib.auth import get_user_model
from .models import Quiz, QuizAssignment, Question
import logging
from django.utils import timezone
from django.db.models import Q
import random

logger = logging.getLogger(__name__)

# Create your views here.

@api_view(['DELETE'])
@permission_classes([IsAuthenticated])
def delete_quiz(request, quiz_id):
    """Delete a quiz (faculty only, only by creator)"""
    try:
        quiz = Quiz.objects.get(id=quiz_id)
        if not request.user.is_faculty or quiz.created_by.id != request.user.id:
            return Response({"error": "You can only delete quizzes you created."}, status=status.HTTP_403_FORBIDDEN)
        quiz.delete()
        return Response({"success": True, "message": "Quiz deleted."})
    except Quiz.DoesNotExist:
        return Response({"error": "Quiz not found"}, status=status.HTTP_404_NOT_FOUND)
    except Exception as e:
        logger.error(f"Error deleting quiz: {str(e)}")
        return Response({"error": "Failed to delete quiz. Please try again."}, status=status.HTTP_500_INTERNAL_SERVER_ERROR)

@api_view(['POST'])
@permission_classes([IsAuthenticated])
def create_quiz(request):
    try:
        # Verify faculty status
        if not request.user.is_faculty:
            return Response({"error": "Only faculty members can create quizzes"}, 
                          status=status.HTTP_403_FORBIDDEN)

        # Validate required fields
        required_fields = ['title', 'course_id', 'topic', 'difficulty', 'questions_per_student', 'questions']
        for field in required_fields:
            if field not in request.data:
                return Response({"error": f"Missing required field: {field}"}, 
                              status=status.HTTP_400_BAD_REQUEST)

        # Check if we have enough questions provided
        if len(request.data['questions']) < request.data['questions_per_student']:
            return Response(
                {"error": f"Not enough questions provided. Need at least {request.data['questions_per_student']} questions."},
                status=status.HTTP_400_BAD_REQUEST
            )

        with transaction.atomic():
            # Create quiz
            quiz = Quiz.objects.create(
                title=request.data['title'],
                course_id=request.data['course_id'],
                topic=request.data['topic'],
                difficulty=request.data['difficulty'],
                questions_per_student=request.data['questions_per_student'],
                created_by=request.user
            )

            # Create questions
            questions = []
            for question_text in request.data['questions']:
                question = Question.objects.create(
                    text=question_text,
                    topic=quiz.topic,
                    difficulty=quiz.difficulty,
                    created_by=request.user
                )
                questions.append(question)

            # Get active students
            User = get_user_model()
            students = User.objects.filter(is_student=True, is_active=True)

            # Assign questions to students
            assignments = []
            for student in students:
                # Get random questions for this student
                student_questions = list(questions)  # Create a copy of the list
                random.shuffle(student_questions)  # Shuffle the questions
                student_questions = student_questions[:quiz.questions_per_student]  # Take required number of questions
                
                # Create assignments
                for question in student_questions:
                    assignments.append(
                        QuizAssignment(
                            quiz=quiz,
                            student=student,
                            question=question
                        )
                    )
            
            # Bulk create all assignments
            QuizAssignment.objects.bulk_create(assignments)

        return Response({
            'id': quiz.id,
            'title': quiz.title,
            'course_id': quiz.course_id,
            'topic': quiz.topic,
            'difficulty': quiz.difficulty,
            'created_at': quiz.created_at,
            'total_students': len(students),
            'completed_students': 0  # New quiz, so 0 completed
        }, status=status.HTTP_201_CREATED)

    except Exception as e:
        logger.error(f"Error creating quiz: {str(e)}")
        return Response(
            {"error": "Failed to create quiz. Please try again."},
            status=status.HTTP_500_INTERNAL_SERVER_ERROR
        )

@api_view(['GET'])
@permission_classes([IsAuthenticated])
def get_faculty_quizzes(request):
    """Get all quizzes created by the faculty member"""
    try:
        if not request.user.is_faculty:
            return Response({"error": "Only faculty members can access this endpoint"}, 
                          status=status.HTTP_403_FORBIDDEN)
        
        quizzes = Quiz.objects.filter(created_by=request.user).order_by('-created_at')
        
        response_data = []
        for quiz in quizzes:
            total_students = QuizAssignment.objects.filter(quiz=quiz).values('student').distinct().count()
            completed_students = QuizAssignment.objects.filter(quiz=quiz, completed=True).values('student').distinct().count()
            
            response_data.append({
                'id': quiz.id,
                'title': quiz.title,
                'course_id': quiz.course_id,
                'topic': quiz.topic,
                'difficulty': quiz.difficulty,
                'created_at': quiz.created_at,
                'total_students': total_students,
                'completed_students': completed_students
            })
        
        return Response(response_data)
    
    except Exception as e:
        logger.error(f"Error fetching faculty quizzes: {str(e)}")
        return Response(
            {"error": "Failed to fetch quizzes. Please try again."},
            status=status.HTTP_500_INTERNAL_SERVER_ERROR
        )

@api_view(['GET'])
@permission_classes([IsAuthenticated])
def get_student_quizzes(request):
    """Get all quizzes assigned to the student"""
    try:
        if not request.user.is_student:
            return Response({"error": "Only students can access this endpoint"}, 
                          status=status.HTTP_403_FORBIDDEN)
        
        # Get all quiz assignments for the student
        assignments = QuizAssignment.objects.filter(student=request.user)
        
        # Group by quiz
        quizzes = {}
        for assignment in assignments:
            quiz_id = assignment.quiz.id
            if quiz_id not in quizzes:
                quizzes[quiz_id] = {
                    'id': quiz_id,
                    'title': assignment.quiz.title,
                    'course_id': assignment.quiz.course_id,
                    'topic': assignment.quiz.topic,
                    'difficulty': assignment.quiz.difficulty,
                    'created_at': assignment.quiz.created_at,
                    'total_questions': assignment.quiz.questions_per_student,
                    'completed_questions': 0,
                    'is_completed': False
                }
            
            if assignment.completed:
                quizzes[quiz_id]['completed_questions'] += 1
                
            if quizzes[quiz_id]['completed_questions'] == quizzes[quiz_id]['total_questions']:
                quizzes[quiz_id]['is_completed'] = True
        
        return Response(list(quizzes.values()))
    
    except Exception as e:
        logger.error(f"Error fetching student quizzes: {str(e)}")
        return Response(
            {"error": "Failed to fetch quizzes. Please try again."},
            status=status.HTTP_500_INTERNAL_SERVER_ERROR
        )

@api_view(['GET'])
@permission_classes([IsAuthenticated])
def get_quiz_questions(request, quiz_id):
    """Get questions for a specific quiz"""
    try:
        if not request.user.is_student:
            return Response({"error": "Only students can access this endpoint"}, 
                          status=status.HTTP_403_FORBIDDEN)
        
        # Get all assignments for this quiz and student
        assignments = QuizAssignment.objects.filter(
            quiz_id=quiz_id,
            student=request.user
        ).select_related('question')
        
        if not assignments:
            return Response({"error": "Quiz not found or not assigned to you"}, 
                          status=status.HTTP_404_NOT_FOUND)
        
        questions = []
        for assignment in assignments:
            questions.append({
                'assignment_id': assignment.id,
                'question_text': assignment.question.text,
                'is_completed': assignment.completed,
                'student_answer': assignment.student_answer if assignment.completed else None,
                'score': assignment.score if assignment.completed else None
            })
        
        return Response(questions)
    
    except Exception as e:
        logger.error(f"Error fetching quiz questions: {str(e)}")
        return Response(
            {"error": "Failed to fetch questions. Please try again."},
            status=status.HTTP_500_INTERNAL_SERVER_ERROR
        )

@api_view(['POST'])
@permission_classes([IsAuthenticated])
def submit_answer(request, assignment_id):
    """Submit an answer for a quiz question"""
    try:
        if not request.user.is_student:
            return Response({"error": "Only students can submit answers"}, 
                          status=status.HTTP_403_FORBIDDEN)
        
        # Get the assignment
        try:
            assignment = QuizAssignment.objects.get(
                id=assignment_id,
                student=request.user
            )
        except QuizAssignment.DoesNotExist:
            return Response({"error": "Assignment not found"}, 
                          status=status.HTTP_404_NOT_FOUND)
        
        # Check if already completed
        if assignment.completed:
            return Response({"error": "This question has already been answered"}, 
                          status=status.HTTP_400_BAD_REQUEST)
        
        # Validate request data
        if 'answer' not in request.data:
            return Response({"error": "Answer is required"}, 
                          status=status.HTTP_400_BAD_REQUEST)
        
        # Update the assignment
        assignment.student_answer = request.data['answer']
        assignment.completed = True
        assignment.submitted_at = timezone.now()
        assignment.save()
        
        return Response({
            "message": "Answer submitted successfully",
            "assignment_id": assignment.id
        })
    
    except Exception as e:
        logger.error(f"Error submitting answer: {str(e)}")
        return Response(
            {"error": "Failed to submit answer. Please try again."},
            status=status.HTTP_500_INTERNAL_SERVER_ERROR
        )

@api_view(['GET'])
@permission_classes([IsAuthenticated])
def get_quiz_results(request, quiz_id):
    """Get results for a specific quiz"""
    try:
        # Check if user is faculty and created this quiz
        quiz = Quiz.objects.get(id=quiz_id)
        if request.user.is_faculty:
            if quiz.created_by != request.user:
                return Response({"error": "You can only view results for quizzes you created"}, 
                              status=status.HTTP_403_FORBIDDEN)
        elif request.user.is_student:
            if not QuizAssignment.objects.filter(quiz=quiz, student=request.user).exists():
                return Response({"error": "Quiz not found or not assigned to you"}, 
                              status=status.HTTP_404_NOT_FOUND)
        else:
            return Response({"error": "Unauthorized"}, status=status.HTTP_403_FORBIDDEN)
        
        # Get all assignments for this quiz
        assignments = QuizAssignment.objects.filter(quiz=quiz)
        if request.user.is_student:
            assignments = assignments.filter(student=request.user)
        
        assignments = assignments.select_related('student', 'question')
        
        results = []
        for assignment in assignments:
            result = {
                'student_roll_no': assignment.student.roll_no,
                'student_name': f"{assignment.student.first_name} {assignment.student.last_name}",
                'question_text': assignment.question.text,
                'submitted_at': assignment.submitted_at,
                'is_completed': assignment.completed,
            }
            
            if assignment.completed:
                result.update({
                    'answer': assignment.student_answer,
                    'score': assignment.score
                })
            
            results.append(result)
        
        return Response(results)
    
    except Quiz.DoesNotExist:
        return Response({"error": "Quiz not found"}, status=status.HTTP_404_NOT_FOUND)
    except Exception as e:
        logger.error(f"Error fetching quiz results: {str(e)}")
        return Response(
            {"error": "Failed to fetch results. Please try again."},
            status=status.HTTP_500_INTERNAL_SERVER_ERROR
        )

@api_view(['GET', 'PUT'])
@permission_classes([IsAuthenticated])
def quiz_detail_and_edit(request, quiz_id):
    """GET: Fetch quiz details; PUT: Edit quiz (faculty only)"""
    try:
        quiz = Quiz.objects.get(id=quiz_id)
        if request.method == 'GET':
            logger.info(f"quiz_detail: Request user id={request.user.id}, quiz.created_by.id={quiz.created_by.id}")
            if request.user.is_faculty:
                if quiz.created_by.id != request.user.id:
                    logger.warning(f"quiz_detail: Forbidden. Request user id={request.user.id}, quiz.created_by.id={quiz.created_by.id}")
                    return Response({"error": "You can only view quizzes you created"}, status=status.HTTP_403_FORBIDDEN)
            questions = list(Question.objects.filter(quizassignment__quiz=quiz).values_list('text', flat=True).distinct())
            total_students = QuizAssignment.objects.filter(quiz=quiz).values('student').distinct().count()
            completed_students = QuizAssignment.objects.filter(quiz=quiz, completed=True).values('student').distinct().count()
            data = {
                'id': quiz.id,
                'title': quiz.title,
                'course_id': quiz.course_id,
                'topic': quiz.topic,
                'difficulty': quiz.difficulty,
                'questions_per_student': quiz.questions_per_student,
                'questions': questions,
                'created_at': quiz.created_at,
                'total_students': total_students,
                'completed_students': completed_students,
            }
            return Response(data)
        elif request.method == 'PUT':
            if not request.user.is_faculty or quiz.created_by.id != request.user.id:
                return Response({"error": "You can only edit quizzes you created."}, status=status.HTTP_403_FORBIDDEN)
            data = request.data
            for field in ['title', 'course_id', 'topic', 'difficulty', 'questions_per_student']:
                if field in data:
                    setattr(quiz, field, data[field])
            quiz.save()

            # --- UPDATE QUESTIONS LOGIC ---
            if 'questions' in data:
                new_questions_texts = [q.strip() for q in data['questions'] if q.strip()]
                # Get all existing assignments for this quiz
                assignments = QuizAssignment.objects.filter(quiz=quiz)
                existing_questions = set(assignments.values_list('question__text', flat=True))
                # Remove assignments for questions that are no longer present
                assignments.exclude(question__text__in=new_questions_texts).delete()
                # Add new questions and assignments if needed
                for q_text in new_questions_texts:
                    if q_text not in existing_questions:
                        # Create Question
                        question = Question.objects.create(
                            text=q_text,
                            topic=quiz.topic,
                            difficulty=quiz.difficulty,
                            created_by=request.user
                        )
                        # Assign to all active students
                        User = get_user_model()
                        students = User.objects.filter(is_student=True, is_active=True)
                        new_assignments = [
                            QuizAssignment(quiz=quiz, student=student, question=question)
                            for student in students
                        ]
                        QuizAssignment.objects.bulk_create(new_assignments)
            return Response({"success": True, "quiz_id": quiz.id})
    except Quiz.DoesNotExist:
        logger.error(f"quiz_detail: Quiz with id={quiz_id} does not exist.")
        return Response({"error": "Quiz not found"}, status=status.HTTP_404_NOT_FOUND)
    except Exception as e:
        logger.error(f"Error in quiz_detail_and_edit: {str(e)}")
        return Response({"error": "Failed to process quiz detail/edit. Please try again."}, status=status.HTTP_500_INTERNAL_SERVER_ERROR)
