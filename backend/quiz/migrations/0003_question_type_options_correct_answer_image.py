from django.db import migrations, models
import django.db.models.deletion

class Migration(migrations.Migration):

    dependencies = [
        ('quiz', '0002_quizassignment_score_quizassignment_student_answer_and_more'),
    ]

    operations = [
        migrations.AddField(
            model_name='question',
            name='type',
            field=models.CharField(
                max_length=20,
                choices=[('mcq', 'Multiple Choice'), ('short_answer', 'Short Answer'), ('true_false', 'True/False')],
                default='short_answer',
            ),
        ),
        migrations.AddField(
            model_name='question',
            name='options',
            field=models.JSONField(null=True, blank=True, help_text='List of options for MCQ'),
        ),
        migrations.AddField(
            model_name='question',
            name='correct_answer',
            field=models.CharField(max_length=255, null=True, blank=True, help_text='Correct answer for MCQ/TrueFalse'),
        ),
        migrations.AddField(
            model_name='question',
            name='image',
            field=models.ImageField(upload_to='question_images/', null=True, blank=True),
        ),
    ]
