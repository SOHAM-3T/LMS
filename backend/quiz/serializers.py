from rest_framework import serializers
from .models import Question, Quiz, QuizAssignment, StudentPerformance
import json

class QuestionSerializer(serializers.ModelSerializer):
    class Meta:
        model = Question
        fields = '__all__'

    def validate(self, data):
        if data.get('type') == 'mcq':
            options = data.get('options', [])
            correct = data.get('correct_answer', [])
            if not isinstance(correct, list):
                raise serializers.ValidationError("Correct answer must be a list for MCQ.")
            for ans in correct:
                if ans not in options:
                    raise serializers.ValidationError(f"Correct answer '{ans}' must be one of the options.")
        if data.get('type') == 'true_false':
            correct = data.get('correct_answer', [])
            if not isinstance(correct, list) or len(correct) != 1:
                raise serializers.ValidationError("Correct answer must be a list with one value for True/False.")
            if correct[0] not in ["True", "False", True, False]:
                raise serializers.ValidationError("Correct answer for True/False must be either 'True' or 'False'.")
        return data

class QuizSerializer(serializers.ModelSerializer):
    questions = QuestionSerializer(many=True, required=False)

    class Meta:
        model = Quiz
        fields = '__all__'
        extra_kwargs = {'created_by': {'required': False}}

    def __init__(self, *args, **kwargs):
        super().__init__(*args, **kwargs)

    def validate(self, attrs):
        return super().validate(attrs)

    def to_internal_value(self, data):
        data = data.copy()  # Make QueryDict mutable to allow assignment
        questions = data.get('questions', [])
        if isinstance(questions, str):
            try:
                questions = json.loads(questions)
            except Exception as e:
                questions = []
        data['questions'] = questions
        ret = super().to_internal_value(data)
        ret['questions'] = questions
        return ret

    def create(self, validated_data):
        """
        Create a quiz along with nested questions, attaching uploaded images.
        """
        questions_data = validated_data.pop('questions', [])
        user = self.context['request'].user
        # Create the quiz instance
        quiz = Quiz.objects.create(created_by=user, **validated_data)
        # Retrieve uploaded images for questions
        images = self.context['request'].FILES.getlist('images')
        # Create each question with its corresponding image
        questions = []
        for idx, question_data in enumerate(questions_data):
            question_data.setdefault('topic', quiz.topic)
            question_data.setdefault('difficulty', quiz.difficulty)
            question_data.pop('quiz', None)
            # Avoid duplicate image kwarg if present in question_data
            question_data.pop('image', None)
            image = images[idx] if idx < len(images) else None
            question = Question.objects.create(
                quiz=quiz,
                created_by=user,
                image=image,
                **question_data
            )
            questions.append(question)
        
        # Add questions to the quiz instance
        quiz.questions.set(questions)
        quiz.save()
        
        # Return the quiz with questions
        return quiz

    def update(self, instance, validated_data):
        """
        Update a quiz and its questions.
        """
        questions_data = validated_data.pop('questions', [])
        user = self.context['request'].user

        # Update quiz fields
        for attr, value in validated_data.items():
            setattr(instance, attr, value)
        instance.save()

        # Handle questions
        if questions_data:
            # Get existing questions
            existing_questions = {str(q.id): q for q in instance.questions.all()}
            
            # Update or create questions
            updated_questions = []
            for question_data in questions_data:
                question_id = str(question_data.get('id'))
                if question_id in existing_questions:
                    # Update existing question
                    question = existing_questions[question_id]
                    for attr, value in question_data.items():
                        if attr not in ['id', 'quiz', 'created_by', 'created_at']:
                            setattr(question, attr, value)
                    question.save()
                    updated_questions.append(question)
                else:
                    # Create new question
                    question_data.pop('id', None)
                    question_data.pop('quiz', None)
                    question_data.pop('created_by', None)
                    question_data.pop('created_at', None)
                    question = Question.objects.create(
                        quiz=instance,
                        created_by=user,
                        **question_data
                    )
                    updated_questions.append(question)

            # Set the updated questions
            instance.questions.set(updated_questions)

        return instance

class StudentPerformanceSerializer(serializers.ModelSerializer):
    """Serializer for student performance data"""
    class Meta:
        model = StudentPerformance
        fields = ['id', 'student', 'quiz', 'total_score', 'max_possible_score', 
                  'percentile', 'rank', 'created_at', 'updated_at']
        read_only_fields = ['id', 'created_at', 'updated_at']

    def to_representation(self, instance):
        """Customize the output representation"""
        ret = super().to_representation(instance)
        ret['student_name'] = f"{instance.student.first_name} {instance.student.last_name}"
        ret['student_roll_no'] = instance.student.roll_no
        ret['quiz_title'] = instance.quiz.title
        ret['course_id'] = instance.quiz.course_id
        ret['topic'] = instance.quiz.topic
        return ret

class QuizAssignmentSerializer(serializers.ModelSerializer):
    class Meta:
        model = QuizAssignment
        fields = '__all__'
