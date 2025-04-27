from rest_framework import serializers
from .models import Question, Quiz, QuizAssignment
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
        questions_data = validated_data.pop('questions', [])
        user = self.context['request'].user if 'request' in self.context else None
        validated_data['created_by'] = user
        quiz = Quiz.objects.create(**validated_data)
        for question_data in questions_data:
            question_data.setdefault('topic', quiz.topic)
            question_data.setdefault('difficulty', quiz.difficulty)
            question_data.pop('quiz', None)
            try:
                Question.objects.create(quiz=quiz, created_by=user, **question_data)
            except Exception as e:
                pass
        return quiz

    def update(self, instance, validated_data):
        questions_data = validated_data.pop('questions', None)
        user = self.context['request'].user if 'request' in self.context else None
        validated_data['created_by'] = user
        for attr, value in validated_data.items():
            setattr(instance, attr, value)
        instance.save()
        if questions_data is not None:
            # Remove old questions and add new ones
            instance.questions.all().delete()
            for question_data in questions_data:
                question_data.setdefault('topic', instance.topic)
                question_data.setdefault('difficulty', instance.difficulty)
                question_data.pop('quiz', None)
                try:
                    Question.objects.create(quiz=instance, created_by=user, **question_data)
                except Exception as e:
                    pass
        else:
            pass
        return instance

class QuizAssignmentSerializer(serializers.ModelSerializer):
    class Meta:
        model = QuizAssignment
        fields = '__all__'
