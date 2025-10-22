from django.conf import settings
from django.db import migrations, models


def set_existing_posts_as_published(apps, schema_editor):
    Post = apps.get_model("blog", "Post")
    Post.objects.filter(status="draft").update(status="published")


def noop(apps, schema_editor):
    pass


class Migration(migrations.Migration):

    dependencies = [
        migrations.swappable_dependency(settings.AUTH_USER_MODEL),
        ("blog", "0007_remove_translation_indexes"),
    ]

    operations = [
        migrations.AddField(
            model_name="post",
            name="status",
            field=models.CharField(
                choices=[
                    ("draft", "Borrador"),
                    ("in_review", "En revisión"),
                    ("published", "Publicado"),
                    ("archived", "Archivado"),
                ],
                default="draft",
                max_length=20,
                verbose_name="Estado",
            ),
        ),
        migrations.AddField(
            model_name="post",
            name="created_by",
            field=models.ForeignKey(
                blank=True,
                null=True,
                on_delete=models.deletion.SET_NULL,
                related_name="created_posts",
                to=settings.AUTH_USER_MODEL,
                verbose_name="Creado por",
            ),
        ),
        migrations.AddField(
            model_name="post",
            name="modified_by",
            field=models.ForeignKey(
                blank=True,
                null=True,
                on_delete=models.deletion.SET_NULL,
                related_name="modified_posts",
                to=settings.AUTH_USER_MODEL,
                verbose_name="Modificado por",
            ),
        ),
        migrations.RunPython(set_existing_posts_as_published, noop),
    ]
