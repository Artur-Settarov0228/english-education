from django.db.models.signals import post_save
from django.dispatch import receiver
from .models import Attendance
from app.users.models import Parents
from app.lessons.tasks import send_telegram_message_task

@receiver(post_save, sender=Attendance)
def attendance_post_save(sender, instance, created, **kwargs):
    # O'quvchini dadasini/oyisini topish
    parent = Parents.objects.filter(user=instance.student).first()
    
    if parent and parent.telegram_id:
        # Xabar matnini tuzish
        status_text = {
            'present': 'keldi ✅',
            'late': 'kechikib keldi ⚠️',
            'absent': 'kelmadi ❌'
        }.get(instance.status, instance.status)

        date_str = instance.lesson.date.strftime("%d.%m.%Y")
        
        if created:
            message = (
                f"Assalomu alaykum, <b>{parent.full_name}</b>!\n\n"
                f"Farzandingiz <b>{instance.student.get_full_name() or instance.student.username}</b> "
                f"bugungi ({date_str}) <b>{instance.lesson.topic}</b> darsiga <b>{status_text}</b>."
            )
        else:
            message = (
                f"❗️ <b>Davomat yangilandi</b>\n\n"
                f"Farzandingiz <b>{instance.student.get_full_name() or instance.student.username}</b> ning "
                f"bugungi ({date_str}) <b>{instance.lesson.topic}</b> darsidagi holati <b>{status_text}</b> "
                f"deb o'zgartirildi."
            )

        # Xabarni Celery orqali (RabbitMQ/Redis ishlatib) fonda yuboramiz
        send_telegram_message_task.delay(parent.telegram_id, message)
