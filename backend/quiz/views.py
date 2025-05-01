from django.shortcuts import render
from rest_framework import status
from rest_framework.decorators import api_view, permission_classes, parser_classes
from rest_framework.response import Response
from rest_framework.permissions import IsAuthenticated
from rest_framework.parsers import MultiPartParser, FormParser, JSONParser
from django.db import connection, transaction
from django.contrib.auth import get_user_model
from .models import Quiz, QuizAssignment, Question, StudentPerformance
from .serializers import QuestionSerializer, QuizSerializer, StudentPerformanceSerializer
import logging
import json
from django.utils import timezone
from django.db.models import Q, Sum, Count
import random

User = get_user_model()
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
@parser_classes([MultiPartParser, FormParser, JSONParser])
@permission_classes([IsAuthenticated])
def create_quiz(request):
    try:
        if not request.user.is_faculty:
            return Response({"error": "Only faculty members can create quizzes"}, status=status.HTTP_403_FORBIDDEN)

        serializer = QuizSerializer(data=request.data, context={'request': request})
        if serializer.is_valid():
            quiz = serializer.save()
            User = get_user_model()
            students = User.objects.filter(is_student=True, is_active=True)
            questions = list(quiz.questions.all())
            # Assign questions to students (fixes 0/0 completed issue)
            assignments = []
            import random
            for student in students:
                random.shuffle(questions)
                assigned_questions = questions[:quiz.questions_per_student]
                for question in assigned_questions:
                    assignments.append(QuizAssignment(quiz=quiz, student=student, question=question))
            QuizAssignment.objects.bulk_create(assignments)
            
            # Get serialized questions
            question_serializer = QuestionSerializer(questions, many=True)
            
            return Response({
                'id': quiz.id,
                'title': quiz.title,
                'course_id': quiz.course_id,
                'topic': quiz.topic,
                'difficulty': quiz.difficulty,
                'questions_per_student': quiz.questions_per_student,
                'questions': question_serializer.data,
                'created_at': quiz.created_at,
                'total_students': len(students),
                'completed_students': 0
            }, status=status.HTTP_201_CREATED)
        else:
            return Response(serializer.errors, status=400)
    except Exception as e:
        logger.error(f"Error creating quiz: {str(e)}")
        return Response({"error": "Failed to create quiz. Please try again."}, status=status.HTTP_500_INTERNAL_SERVER_ERROR)

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
def get_student_performance(request, quiz_id=None):
    """Get student's performance across all quizzes or for a specific quiz"""
    try:
        if not request.user.is_student:
            return Response({"error": "Only students can access this endpoint"}, 
                          status=status.HTTP_403_FORBIDDEN)
        
        if quiz_id:
            try:
                # First check if the quiz exists
                quiz = Quiz.objects.get(id=quiz_id)
                
                # Get or create performance record
                performance, created = StudentPerformance.objects.get_or_create(
                    student=request.user,
                    quiz=quiz,
                    defaults={
                        'total_score': 0,
                        'max_possible_score': quiz.total_score or 0
                    }
                )
                
                # If just created or needs update, update the performance
                if created or performance.max_possible_score == 0:
                    performance.update_performance()
                
                # Return formatted response
                data = {
                    'total_score': str(performance.total_score),
                    'max_possible_score': str(performance.max_possible_score),
                    'rank': performance.rank,
                    'percentile': float(performance.percentile) if performance.percentile else None
                }
                print(f"Returning performance data for quiz {quiz_id}: {data}")
                return Response(data)
                
            except Quiz.DoesNotExist:
                print(f"Quiz {quiz_id} not found")
                return Response({"error": "Quiz not found"}, 
                              status=status.HTTP_404_NOT_FOUND)
            except Exception as e:
                print(f"Error processing performance data for quiz {quiz_id}: {str(e)}")
                return Response({"error": "Error processing performance data"}, 
                              status=status.HTTP_500_INTERNAL_SERVER_ERROR)
        
        # Get all performances
        performances = StudentPerformance.objects.filter(student=request.user)
        data = []
        for perf in performances:
            data.append({
                'quiz_id': perf.quiz_id,
                'total_score': str(perf.total_score),
                'max_possible_score': str(perf.max_possible_score),
                'rank': perf.rank,
                'percentile': float(perf.percentile) if perf.percentile else None
            })
        return Response(data)
    
    except Exception as e:
        print(f"Error in get_student_performance: {str(e)}")
        return Response(
            {"error": "Failed to fetch performance data. Please try again."},
            status=status.HTTP_500_INTERNAL_SERVER_ERROR
        )

@api_view(['GET'])
@permission_classes([IsAuthenticated])
def get_class_performance(request, quiz_id):
    """Get class performance statistics for a quiz"""
    try:
        if not request.user.is_faculty:
            return Response({"error": "Only faculty can access this endpoint"}, 
                          status=status.HTTP_403_FORBIDDEN)
        
        try:
            quiz = Quiz.objects.get(id=quiz_id)
        except Quiz.DoesNotExist:
            return Response({"error": "Quiz not found"}, 
                          status=status.HTTP_404_NOT_FOUND)
        
        # Get all performances for this quiz
        performances = StudentPerformance.objects.filter(quiz=quiz)
        
        # Calculate statistics
        total_students = performances.count()
        if total_students == 0:
            return Response({
                'quiz_title': quiz.title,
                'total_students': 0,
                'average_score': 0,
                'top_performers': [],
                'score_distribution': {
                    '0-20': 0, '21-40': 0, '41-60': 0, '61-80': 0, '81-100': 0
                },
                'max_possible_score': quiz.total_score or 0
            })
        
        # Calculate average score
        total_score = performances.aggregate(total=Sum('total_score'))['total'] or 0
        avg_score = total_score / total_students if total_students > 0 else 0
        
        # Get top performers
        top_performers = performances.order_by('-total_score')[:5]
        top_performers_data = StudentPerformanceSerializer(top_performers, many=True).data
        
        # Calculate score distribution
        score_distribution = {
            '0-20': 0,
            '21-40': 0,
            '41-60': 0,
            '61-80': 0,
            '81-100': 0
        }
        
        quiz_max_score = quiz.total_score or 0
        if quiz_max_score > 0:
            for perf in performances:
                score_percent = (float(perf.total_score) / float(quiz_max_score)) * 100
                if score_percent <= 20:
                    score_distribution['0-20'] += 1
                elif score_percent <= 40:
                    score_distribution['21-40'] += 1
                elif score_percent <= 60:
                    score_distribution['41-60'] += 1
                elif score_percent <= 80:
                    score_distribution['61-80'] += 1
                else:
                    score_distribution['81-100'] += 1
        
        response = {
            'quiz_title': quiz.title,
            'total_students': total_students,
            'average_score': float(avg_score),
            'top_performers': top_performers_data,
            'score_distribution': score_distribution,
            'max_possible_score': quiz_max_score
        }
        
        return Response(response)
    
    except Exception as e:
        logger.error(f"Error fetching class performance: {str(e)}")
        return Response(
            {"error": "Failed to fetch class performance data. Please try again."},
            status=status.HTTP_500_INTERNAL_SERVER_ERROR
        )

@api_view(['GET'])
@permission_classes([IsAuthenticated])
def get_student_rankings(request, quiz_id):
    """Get student rankings for a quiz"""
    try:
        if not request.user.is_faculty:
            return Response({"error": "Only faculty can access this endpoint"}, 
                          status=status.HTTP_403_FORBIDDEN)
        
        try:
            quiz = Quiz.objects.get(id=quiz_id)
        except Quiz.DoesNotExist:
            return Response({"error": "Quiz not found"}, 
                          status=status.HTTP_404_NOT_FOUND)
        
        # Get all performances for this quiz ordered by score
        performances = StudentPerformance.objects.filter(quiz=quiz).order_by('-total_score')
        total_students = performances.count()
        
        # Update ranks and percentiles based on position
        for i, performance in enumerate(performances):
            # Calculate scores below (number of students with lower scores)
            scores_below = total_students - (i + 1)
            
            # Calculate percentile using the formula:
            # Percentile = (Number of scores below) / (Total number of scores) * 100
            performance.percentile = (scores_below / total_students) * 100 if total_students > 0 else 100
            performance.rank = i + 1
            performance.save(update_fields=['percentile', 'rank'])
        
        # Get updated rankings
        rankings = performances.order_by('-total_score', 'student__roll_no')
        serializer = StudentPerformanceSerializer(rankings, many=True)
        
        return Response(serializer.data)
    
    except Exception as e:
        logger.error(f"Error fetching student rankings: {str(e)}")
        return Response(
            {"error": "Failed to fetch student rankings. Please try again."},
            status=status.HTTP_500_INTERNAL_SERVER_ERROR
        )

@api_view(['POST'])
@permission_classes([IsAuthenticated])
def update_question_score(request, assignment_id):
    """Update score for a specific question assignment"""
    try:
        if not request.user.is_faculty:
            return Response({"error": "Only faculty can update scores"}, 
                          status=status.HTTP_403_FORBIDDEN)
        
        try:
            assignment = QuizAssignment.objects.get(id=assignment_id)
        except QuizAssignment.DoesNotExist:
            return Response({"error": "Assignment not found"}, 
                          status=status.HTTP_404_NOT_FOUND)
        
        score = request.data.get('score')
        if score is None:
            return Response({"error": "Score is required"}, 
                          status=status.HTTP_400_BAD_REQUEST)
        
        try:
            score = float(score)
            if score < 0 or score > assignment.question.max_score:
                return Response({"error": f"Score must be between 0 and {assignment.question.max_score}"}, 
                              status=status.HTTP_400_BAD_REQUEST)
            
            assignment.score = score
            assignment.is_graded = True
            assignment.save()
            
            # Update student performance
            performance, created = StudentPerformance.objects.get_or_create(
                student=assignment.student,
                quiz=assignment.quiz
            )
            performance.update_performance()
            
            return Response({"success": True, "message": "Score updated successfully"})
        
        except ValueError:
            return Response({"error": "Invalid score format"}, 
                          status=status.HTTP_400_BAD_REQUEST)
    
    except Exception as e:
        logger.error(f"Error updating question score: {str(e)}")
        return Response(
            {"error": "Failed to update score. Please try again."},
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
            question = assignment.question
            image_url = None
            if question.image:
                try:
                    image_url = request.build_absolute_uri(question.image.url)
                    logger.info(f"Image URL for question {question.id}: {image_url}")
                except Exception as e:
                    logger.error(f"Error building image URL for question {question.id}: {str(e)}")
            
            questions.append({
                'assignment_id': assignment.id,
                'question_text': question.text,
                'type': question.type,
                'options': question.options,
                'image': image_url,
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
    """Submit an answer for a quiz assignment"""
    try:
        if not request.user.is_student:
            return Response({"error": "Only students can submit answers"}, 
                          status=status.HTTP_403_FORBIDDEN)
        
        try:
            assignment = QuizAssignment.objects.get(id=assignment_id, student=request.user)
        except QuizAssignment.DoesNotExist:
            return Response({"error": "Assignment not found"}, 
                          status=status.HTTP_404_NOT_FOUND)
        
        # Update assignment
        assignment.student_answer = request.data.get('answer')
        assignment.completed = True
        assignment.submitted_at = timezone.now()
        assignment.save()
        
        # Check if all questions are completed
        quiz = assignment.quiz
        total_assignments = QuizAssignment.objects.filter(
            quiz=quiz,
            student=request.user
        ).count()
        
        completed_assignments = QuizAssignment.objects.filter(
            quiz=quiz,
            student=request.user,
            completed=True
        ).count()
        
        if total_assignments == completed_assignments:
            # Create or update performance record
            try:
                performance = StudentPerformance.objects.get(
                    student=request.user,
                    quiz=quiz
                )
            except StudentPerformance.DoesNotExist:
                performance = StudentPerformance.objects.create(
                    student=request.user,
                    quiz=quiz,
                    total_score=0,
                    max_possible_score=quiz.total_score or 0
                )
            
            # Update performance if all questions are graded
            graded_assignments = QuizAssignment.objects.filter(
                student=request.user,
                quiz=quiz,
                is_graded=True
            )
            if graded_assignments.count() == total_assignments:
                performance.update_performance()
        
        return Response({"message": "Answer submitted successfully"})
    
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
            from .serializers import QuizSerializer
            serializer = QuizSerializer(quiz)
            return Response(serializer.data)
        elif request.method == 'PUT':
            print('quiz_detail_and_edit PUT called')
            print('Incoming data:', request.data)
            questions = request.data.get('questions', None)
            print('Incoming questions:', questions)
            if not request.user.is_faculty or quiz.created_by.id != request.user.id:
                return Response({"error": "You can only edit quizzes you created."}, status=status.HTTP_403_FORBIDDEN)
            from .serializers import QuizSerializer, QuestionSerializer
            serializer = QuizSerializer(quiz, data=request.data, context={'request': request})
            if serializer.is_valid():
                quiz = serializer.save()
                # Get serialized questions
                question_serializer = QuestionSerializer(quiz.questions.all(), many=True)
                
                # Update the response data with questions
                response_data = serializer.data
                response_data['questions'] = question_serializer.data
                
                return Response(response_data)
            else:
                print(serializer.errors)
                return Response(serializer.errors, status=400)
    except Quiz.DoesNotExist:
        logger.error(f"quiz_detail: Quiz with id={quiz_id} does not exist.")
        return Response({"error": "Quiz not found"}, status=status.HTTP_404_NOT_FOUND)
    except Exception as e:
        logger.error(f"Error in quiz_detail_and_edit: {str(e)}")
        return Response({"error": "Failed to process quiz detail/edit. Please try again."}, status=status.HTTP_500_INTERNAL_SERVER_ERROR)

@api_view(['POST'])
@permission_classes([IsAuthenticated])
def grade_quiz(request, quiz_id):
    """Grade a quiz for a student"""
    try:
        if not request.user.is_teacher:
            return Response({"error": "Only teachers can grade quizzes"}, 
                          status=status.HTTP_403_FORBIDDEN)
        
        try:
            quiz = Quiz.objects.get(id=quiz_id)
        except Quiz.DoesNotExist:
            return Response({"error": "Quiz not found"}, 
                          status=status.HTTP_404_NOT_FOUND)
        
        student_id = request.data.get('student_id')
        if not student_id:
            return Response({"error": "Student ID is required"}, 
                          status=status.HTTP_400_BAD_REQUEST)
        
        try:
            student = User.objects.get(id=student_id, is_student=True)
        except User.DoesNotExist:
            return Response({"error": "Student not found"}, 
                          status=status.HTTP_404_NOT_FOUND)
        
        # Get all assignments for this student and quiz
        assignments = QuizAssignment.objects.filter(
            quiz=quiz,
            student=student
        )
        
        # Update each assignment with grade and feedback
        for assignment in assignments:
            grade = request.data.get(f'grade_{assignment.id}')
            feedback = request.data.get(f'feedback_{assignment.id}')
            
            if grade is not None:
                assignment.grade = grade
                assignment.feedback = feedback
                assignment.is_graded = True
                assignment.graded_by = request.user
                assignment.graded_at = timezone.now()
                assignment.save()
        
        # Update or create performance record
        try:
            performance = StudentPerformance.objects.get(
                student=student,
                quiz=quiz
            )
        except StudentPerformance.DoesNotExist:
            performance = StudentPerformance.objects.create(
                student=student,
                quiz=quiz,
                total_score=0,
                max_possible_score=quiz.total_score or 0
            )
        
        # Update performance
        performance.update_performance()
        
        return Response({"message": "Quiz graded successfully"})
    
    except Exception as e:
        logger.error(f"Error grading quiz: {str(e)}")
        return Response(
            {"error": "Failed to grade quiz. Please try again."},
            status=status.HTTP_500_INTERNAL_SERVER_ERROR
        )

@api_view(['GET'])
@permission_classes([IsAuthenticated])
def get_student_quiz_performance(request, quiz_id):
    """Get performance data for all students in a specific quiz"""
    try:
        if not request.user.is_faculty:
            return Response({"error": "Only faculty members can access this endpoint"}, 
                          status=status.HTTP_403_FORBIDDEN)
        
        # Get all quiz assignments for this quiz
        quiz_assignments = QuizAssignment.objects.filter(quiz_id=quiz_id)
        
        # Calculate performance metrics
        performance_data = []
        for assignment in quiz_assignments:
            student = assignment.student
            score = assignment.score or 0
            max_score = assignment.max_score or 1
            
            # Calculate percentile
            total_assignments = quiz_assignments.count()
            better_scores = quiz_assignments.filter(score__gt=score).count()
            percentile = ((total_assignments - better_scores) / total_assignments) * 100 if total_assignments > 0 else 0
            
            # Calculate rank
            rank = better_scores + 1
            
            performance_data.append({
                'student_id': student.id,
                'username': student.username,
                'first_name': student.first_name,
                'last_name': student.last_name,
                'email': student.email,
                'score': score,
                'max_score': max_score,
                'percentage': (score / max_score) * 100 if max_score > 0 else 0,
                'rank': rank,
                'percentile': round(percentile, 2),
                'completed': assignment.completed,
                'submitted_at': assignment.submitted_at
            })
        
        # Sort by score in descending order
        performance_data.sort(key=lambda x: x['score'], reverse=True)
        
        return Response(performance_data)
    
    except Exception as e:
        logger.error(f"Error fetching student quiz performance: {str(e)}")
        return Response(
            {"error": "Failed to fetch performance data. Please try again."},
            status=status.HTTP_500_INTERNAL_SERVER_ERROR
        )
