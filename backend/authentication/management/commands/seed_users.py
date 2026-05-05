from django.core.management.base import BaseCommand
from django.contrib.auth import get_user_model
import random

User = get_user_model()

class Command(BaseCommand):
    help = 'Создаёт тестовых пользователей'

    def handle(self, *args, **options):
        self.stdout.write('Создаём тестовых пользователей...')
        
        test_users = [
            {"login": "alex_dev", "email": "alex@test.com", "full_name": "Алексей Разработчик", "bio": "Backend разработчик, люблю Python и Django"},
            {"login": "maria_front", "email": "maria@test.com", "full_name": "Мария Фронтенд", "bio": "Frontend разработчик, React и TypeScript"},
            {"login": "ivan_back", "email": "ivan@test.com", "full_name": "Иван Бэкенд", "bio": "Специалист по базам данных и API"},
            {"login": "elena_full", "email": "elena@test.com", "full_name": "Елена Fullstack", "bio": "Люблю создавать полные веб-приложения"},
            {"login": "dmitry_pm", "email": "dmitry@test.com", "full_name": "Дмитрий Менеджер", "bio": "Продакт-менеджер, организую процессы"},
            {"login": "olga_design", "email": "olga@test.com", "full_name": "Ольга Дизайнер", "bio": "UI/UX дизайнер, создаю красивые интерфейсы"},
            {"login": "sergey_qa", "email": "sergey@test.com", "full_name": "Сергей Тестировщик", "bio": "QA инженер, ищу баги"},
            {"login": "anna_devops", "email": "anna@test.com", "full_name": "Анна DevOps", "bio": "Автоматизирую развёртывание"},
            {"login": "pavel_analyst", "email": "pavel@test.com", "full_name": "Павел Аналитик", "bio": "Анализирую данные и метрики"},
            {"login": "kate_mobile", "email": "kate@test.com", "full_name": "Екатерина Мобильный", "bio": "Разработчик мобильных приложений"},
            {"login": "mikhail_arch", "email": "mikhail@test.com", "full_name": "Михаил Архитектор", "bio": "Архитектор программных систем"},
            {"login": "nina_ml", "email": "nina@test.com", "full_name": "Нина ML", "bio": "Специалист по машинному обучению"},
            {"login": "artem_sec", "email": "artem@test.com", "full_name": "Артем Безопасник", "bio": "Специалист по кибербезопасности"},
            {"login": "victoria_support", "email": "victoria@test.com", "full_name": "Виктория Саппорт", "bio": "Техническая поддержка"},
            {"login": "oleg_sales", "email": "oleg@test.com", "full_name": "Олег Продажи", "bio": "Менеджер по продажам IT решений"},
        ]
        
        created_count = 0
        existing_count = 0
        
        for user_data in test_users:
            try:
                user, created = User.objects.get_or_create(
                    login=user_data["login"],
                    defaults={
                        "email": user_data["email"],
                        "full_name": user_data["full_name"],
                        "bio": user_data["bio"],
                        "is_active": True,
                        "status": "user"
                    }
                )
                
                if created:
                    user.set_password("test123456")
                    user.save()
                    created_count += 1
                    self.stdout.write(f'  ✅ Создан пользователь: {user.login} - {user.full_name}')
                else:
                    existing_count += 1
                    
            except Exception as e:
                self.stdout.write(self.style.ERROR(f'  ❌ Ошибка при создании {user_data["login"]}: {e}'))
        
        self.stdout.write(self.style.SUCCESS(f'\n✨ Готово! Создано: {created_count}, уже существовало: {existing_count}'))
        self.stdout.write(f'📝 Пароль для всех пользователей: test123456')