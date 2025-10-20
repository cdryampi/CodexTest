# Generated manually for reactions feature
from __future__ import annotations

from django.conf import settings
from django.db import migrations, models
import django.db.models.deletion


class Migration(migrations.Migration):

    dependencies = [
        ("contenttypes", "0002_remove_content_type_name"),
        ("blog", "0003_category_post_categories"),
        migrations.swappable_dependency(settings.AUTH_USER_MODEL),
    ]

    operations = [
        migrations.CreateModel(
            name="Reaction",
            fields=[
                ("id", models.BigAutoField(auto_created=True, primary_key=True, serialize=False, verbose_name="ID")),
                ("object_id", models.PositiveBigIntegerField()),
                ("type", models.CharField(choices=[
                    ("like", "Me gusta"),
                    ("love", "Me encanta"),
                    ("clap", "Aplausos"),
                    ("wow", "Asombro"),
                    ("laugh", "Me divierte"),
                    ("insight", "Interesante"),
                ], max_length=20, verbose_name="Tipo")),
                ("created_at", models.DateTimeField(auto_now_add=True, verbose_name="Creado")),
                ("content_type", models.ForeignKey(on_delete=django.db.models.deletion.CASCADE, to="contenttypes.contenttype")),
                (
                    "user",
                    models.ForeignKey(
                        on_delete=django.db.models.deletion.CASCADE,
                        related_name="reactions",
                        to=settings.AUTH_USER_MODEL,
                        verbose_name="Usuario",
                    ),
                ),
            ],
            options={
                "verbose_name": "Reacción",
                "verbose_name_plural": "Reacciones",
                "ordering": ["-created_at", "-id"],
                "unique_together": {("user", "content_type", "object_id", "type")},
            },
        ),
        migrations.AddIndex(
            model_name="reaction",
            index=models.Index(fields=["content_type", "object_id"], name="blog_react_content_8f27e5_idx"),
        ),
        migrations.AddIndex(
            model_name="reaction",
            index=models.Index(fields=["user", "content_type", "object_id"], name="blog_react_user_co_3f2b9e_idx"),
        ),
    ]
