from django.apps import AppConfig


class LessonsConfig(AppConfig):
    default_auto_field = 'django.db.models.BigAutoField'
    name = 'app.lessons'

    def ready(self):
        import app.lessons.signals
