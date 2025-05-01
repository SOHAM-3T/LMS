from django.db import models
from django.utils import timezone
from authentication.models import User
from django.db.models import Avg, Count, F, Q, Sum
from django.db.models.functions import Rank, PercentRank

# Create your models here.

class Question(models.Model):
    DIFFICULTY_CHOICES = [
        ('easy', 'Easy'),
        ('medium', 'Medium'),
        ('hard', 'Hard')
    ]
    
    QUESTION_TYPE_CHOICES = [
        ('mcq', 'Multiple Choice'),
        ('short_answer', 'Short Answer'),
        ('true_false', 'True/False'),
    ]
    
    text = models.TextField()
    topic = models.CharField(max_length=100)
    difficulty = models.CharField(max_length=10, choices=DIFFICULTY_CHOICES)
    type = models.CharField(max_length=20, choices=QUESTION_TYPE_CHOICES, default='short_answer')
    options = models.JSONField(null=True, blank=True, help_text='List of options for MCQ')
    correct_answer = models.JSONField(null=True, blank=True, help_text='Correct answer(s) for MCQ/TrueFalse')
    image = models.ImageField(upload_to='question_images/', null=True, blank=True)
    max_score = models.DecimalField(max_digits=5, decimal_places=2, default=1.0, 
                                  help_text='Maximum score possible for this question')
    created_at = models.DateTimeField(auto_now_add=True)
    created_by = models.ForeignKey(User, on_delete=models.CASCADE)
    quiz = models.ForeignKey('Quiz', related_name='questions', on_delete=models.CASCADE, null=True)

    class Meta:
        app_label = 'quiz'
        indexes = [
            models.Index(fields=['topic', 'difficulty']),
        ]

    def __str__(self):
        return f"{self.topic} - {self.difficulty} - {self.text[:50]}..."

    def calculate_score(self, student_answer):
        """Calculate score for a given student answer"""
        if not student_answer:
            print(f"Empty student answer for question {self.id}")
            return 0

        try:
            print(f"\nDebug - Question {self.id} ({self.type}):")
            print(f"Student answer: {student_answer} (type: {type(student_answer)})")
            print(f"Correct answer: {self.correct_answer} (type: {type(self.correct_answer)})")

            if self.type == 'mcq':
                # For MCQ, compare the selected option
                if isinstance(student_answer, str):
                    student_answer = [student_answer]
                if isinstance(self.correct_answer, str):
                    correct_answer = [self.correct_answer]
                else:
                    correct_answer = self.correct_answer or []
                
                print(f"Processed student answer: {student_answer}")
                print(f"Processed correct answer: {correct_answer}")
                
                # Check if all correct answers are in student's answers
                is_correct = all(ans in student_answer for ans in correct_answer)
                print(f"Is correct: {is_correct}")
                
                if is_correct:
                    return self.max_score
                return 0

            elif self.type == 'true_false':
                # For True/False, compare directly
                student_ans = str(student_answer).lower()
                
                # Handle both string and list correct answers
                if isinstance(self.correct_answer, list):
                    correct_ans = str(self.correct_answer[0]).lower() if self.correct_answer else ""
                else:
                    correct_ans = str(self.correct_answer).lower()
                
                print(f"Comparing True/False: {student_ans} == {correct_ans}")
                
                if student_ans == correct_ans:
                    return self.max_score
                return 0

            elif self.type == 'short_answer':
                # For short answer, compare directly (case-insensitive)
                student_ans = str(student_answer).lower().strip()
                
                # Handle both string and list correct answers
                if isinstance(self.correct_answer, list):
                    correct_ans = str(self.correct_answer[0]).lower().strip() if self.correct_answer else ""
                else:
                    correct_ans = str(self.correct_answer).lower().strip()
                
                print(f"Comparing Short Answer: {student_ans} == {correct_ans}")
                
                if student_ans == correct_ans:
                    return self.max_score
                return 0

        except Exception as e:
            print(f"Error calculating score: {e}")
            return 0

    def save(self, *args, **kwargs):
        super().save(*args, **kwargs)
        if self.quiz:
            self.quiz.calculate_total_score()

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
    total_score = models.DecimalField(max_digits=8, decimal_places=2, null=True, blank=True,
                                    help_text='Total possible score for this quiz')
    created_by = models.ForeignKey(User, on_delete=models.CASCADE)
    created_at = models.DateTimeField(auto_now_add=True)
    is_active = models.BooleanField(default=True)
    
    # New fields for scheduling
    scheduled_start_time = models.DateTimeField(
        null=True,
        blank=True,
        help_text='When the quiz becomes available to students'
    )
    scheduled_end_time = models.DateTimeField(
        null=True,
        blank=True,
        help_text='When the quiz becomes unavailable to students'
    )
    time_limit_minutes = models.PositiveIntegerField(
        null=True,
        blank=True,
        default=30,
        help_text='Time limit in minutes for each student to complete the quiz'
    )
    is_scheduled = models.BooleanField(
        default=False,
        help_text='Whether this quiz is scheduled or available immediately'
    )

    class Meta:
        app_label = 'quiz'
        indexes = [
            models.Index(fields=['course_id', 'created_at']),
            models.Index(fields=['topic', 'difficulty']),
            models.Index(fields=['scheduled_start_time', 'scheduled_end_time']),
        ]

    def __str__(self):
        return f"{self.title} - {self.course_id}"

    def calculate_total_score(self):
        """Calculate total possible score for this quiz"""
        total = self.questions.aggregate(total=Sum('max_score'))['total']
        self.total_score = total or 0
        self.save(update_fields=['total_score'])
        return self.total_score

    def is_available(self):
        """Check if the quiz is currently available to students"""
        now = timezone.now()
        if not self.is_scheduled:
            return True
        return self.scheduled_start_time <= now <= self.scheduled_end_time

    def time_remaining(self):
        """Get time remaining for the quiz in minutes"""
        if not self.is_scheduled:
            return None
        now = timezone.now()
        if now < self.scheduled_start_time:
            return None  # Quiz hasn't started
        if now > self.scheduled_end_time:
            return 0  # Quiz has ended
        return (self.scheduled_end_time - now).total_seconds() / 60

    def can_be_attempted(self, student):
        """Check if a student can attempt this quiz"""
        if not self.is_available():
            return False
        
        # Check if student has already completed the quiz
        assignments = QuizAssignment.objects.filter(
            quiz=self,
            student=student
        )
        if not assignments.exists():
            return False
            
        # Check if all questions are completed
        return not assignments.filter(completed=False).exists()

class QuizAssignment(models.Model):
    quiz = models.ForeignKey(Quiz, on_delete=models.CASCADE)
    student = models.ForeignKey(User, on_delete=models.CASCADE)
    question = models.ForeignKey(Question, on_delete=models.CASCADE)
    assigned_at = models.DateTimeField(auto_now_add=True)
    completed = models.BooleanField(default=False)
    student_answer = models.TextField(null=True, blank=True)
    score = models.DecimalField(max_digits=5, decimal_places=2, null=True, blank=True)
    submitted_at = models.DateTimeField(null=True, blank=True)
    is_graded = models.BooleanField(default=False)

    class Meta:
        app_label = 'quiz'
        unique_together = ('quiz', 'student', 'question')
        indexes = [
            models.Index(fields=['quiz', 'student']),
        ]

    def __str__(self):
        return f"{self.quiz.title} - {self.student.roll_no} - Q{self.question.id}"

    def save(self, *args, **kwargs):
        print(f"\nDebug - Saving QuizAssignment:")
        print(f"Question ID: {self.question.id}")
        print(f"Student Answer: {self.student_answer}")
        print(f"Current Score: {self.score}")
        print(f"Is Graded: {self.is_graded}")

        # Calculate score if not already graded
        if self.student_answer and not self.is_graded:
            print("Calculating score...")
            self.score = self.question.calculate_score(self.student_answer)
            print(f"Calculated Score: {self.score}")
            self.is_graded = True

        super().save(*args, **kwargs)
        
        # Create or update StudentPerformance record
        performance, created = StudentPerformance.objects.get_or_create(
            student=self.student,
            quiz=self.quiz,
            defaults={
                'total_score': 0,
                'max_possible_score': self.quiz.total_score or 0
            }
        )
        
        if self.is_graded:
            print("Updating performance...")
            performance.update_performance()

class StudentPerformance(models.Model):
    """Tracks overall student performance across all quizzes"""
    student = models.ForeignKey(User, on_delete=models.CASCADE)
    quiz = models.ForeignKey(Quiz, on_delete=models.CASCADE)
    total_score = models.DecimalField(max_digits=8, decimal_places=2, default=0)
    max_possible_score = models.DecimalField(max_digits=8, decimal_places=2, default=0)
    percentile = models.DecimalField(max_digits=5, decimal_places=2, null=True, blank=True)
    rank = models.IntegerField(null=True, blank=True)
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)

    class Meta:
        app_label = 'quiz'
        unique_together = ('student', 'quiz')
        indexes = [
            models.Index(fields=['student', 'quiz']),
            models.Index(fields=['quiz', 'rank']),
            models.Index(fields=['quiz', 'percentile']),
        ]

    def __str__(self):
        return f"{self.quiz.title} - {self.student.roll_no} - Score: {self.total_score}/{self.max_possible_score}"

    def update_performance(self):
        """Update performance metrics based on quiz assignments"""
        try:
            # Get all completed assignments for this student and quiz
            assignments = QuizAssignment.objects.filter(
                student=self.student,
                quiz=self.quiz,
                completed=True
            )
            
            # Calculate total score from graded assignments
            total_score = assignments.filter(is_graded=True).aggregate(
                total=Sum('score'))['total'] or 0
            
            # Always use quiz's total score
            max_score = self.quiz.total_score if self.quiz.total_score is not None else 0
            
            # Update scores
            self.total_score = total_score
            self.max_possible_score = max_score
            
            # Calculate rank and percentile
            all_performances = StudentPerformance.objects.filter(quiz=self.quiz)
            total_students = all_performances.count()
            
            if total_students > 0:
                # Calculate scores below (number of students with lower scores)
                scores_below = all_performances.filter(total_score__lt=self.total_score).count()
                
                # Calculate percentile
                self.percentile = (scores_below / total_students) * 100
                
                # Calculate rank (1-based)
                scores_above = all_performances.filter(total_score__gt=self.total_score).count()
                self.rank = scores_above + 1
            else:
                self.percentile = 100
                self.rank = 1
            
            self.save()
            return True
        except Exception as e:
            print(f"Error updating performance: {str(e)}")
            return False

class QuizResults(models.Model):
    """Stores final results for a quiz after it has ended"""
    quiz = models.ForeignKey(Quiz, on_delete=models.CASCADE)
    student = models.ForeignKey(User, on_delete=models.CASCADE)
    total_score = models.DecimalField(max_digits=8, decimal_places=2)
    max_possible_score = models.DecimalField(max_digits=8, decimal_places=2)
    percentile = models.DecimalField(max_digits=5, decimal_places=2)
    rank = models.IntegerField()
    time_taken_minutes = models.DecimalField(max_digits=5, decimal_places=2)
    submitted_at = models.DateTimeField()
    created_at = models.DateTimeField(auto_now_add=True)

    class Meta:
        app_label = 'quiz'
        unique_together = ('quiz', 'student')
        indexes = [
            models.Index(fields=['quiz', 'rank']),
            models.Index(fields=['quiz', 'percentile']),
            models.Index(fields=['student', 'quiz']),
        ]

    def __str__(self):
        return f"{self.quiz.title} - {self.student.roll_no} - Score: {self.total_score}/{self.max_possible_score}"

    @classmethod
    def generate_results(cls, quiz):
        """Generate final results for all students who attempted the quiz"""
        if quiz.is_available():
            return  # Don't generate results if quiz is still active
            
        # Get all performances
        performances = StudentPerformance.objects.filter(quiz=quiz)
        
        # Calculate ranks and percentiles
        total_students = performances.count()
        if total_students == 0:
            return
            
        # Order by score and update ranks
        performances = performances.order_by('-total_score')
        for i, perf in enumerate(performances):
            # Calculate scores below (number of students with lower scores)
            scores_below = total_students - (i + 1)
            
            # Calculate percentile
            percentile = (scores_below / (total_students - 1)) * 100 if total_students > 1 else 100.0
            
            # Get time taken
            last_assignment = QuizAssignment.objects.filter(
                quiz=quiz,
                student=perf.student,
                completed=True
            ).order_by('-submitted_at').first()
            
            time_taken = None
            if last_assignment:
                time_taken = (last_assignment.submitted_at - quiz.scheduled_start_time).total_seconds() / 60
            
            # Create or update result
            cls.objects.update_or_create(
                quiz=quiz,
                student=perf.student,
                defaults={
                    'total_score': perf.total_score,
                    'max_possible_score': perf.max_possible_score,
                    'percentile': percentile,
                    'rank': i + 1,
                    'time_taken_minutes': time_taken or 0,
                    'submitted_at': last_assignment.submitted_at if last_assignment else quiz.scheduled_end_time
                }
            )
