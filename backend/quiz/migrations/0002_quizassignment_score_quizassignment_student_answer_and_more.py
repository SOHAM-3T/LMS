# Generated by Django 5.1.7 on 2025-04-24 14:12

from django.db import migrations, models


class Migration(migrations.Migration):

    dependencies = [
        ("quiz", "0001_initial"),
    ]

    operations = [
        migrations.AddField(
            model_name="quizassignment",
            name="score",
            field=models.DecimalField(
                blank=True, decimal_places=2, max_digits=5, null=True
            ),
        ),
        migrations.AddField(
            model_name="quizassignment",
            name="student_answer",
            field=models.TextField(blank=True, null=True),
        ),
        migrations.AddField(
            model_name="quizassignment",
            name="submitted_at",
            field=models.DateTimeField(blank=True, null=True),
        ),
    ]
