# Generated by Django 5.1.7 on 2025-04-26 19:44

import django.db.models.deletion
from django.db import migrations, models


class Migration(migrations.Migration):

    dependencies = [
        ("quiz", "0003_question_type_options_correct_answer_image"),
    ]

    operations = [
        migrations.AddField(
            model_name="question",
            name="quiz",
            field=models.ForeignKey(
                null=True,
                on_delete=django.db.models.deletion.CASCADE,
                related_name="questions",
                to="quiz.quiz",
            ),
        ),
    ]
