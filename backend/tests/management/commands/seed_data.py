from django.core.management.base import BaseCommand
from django.contrib.auth import get_user_model
from tests.models import Pool, Question, Answer, PoolQuestion, Test, TestQuestion
import random
import os
from django.conf import settings

User = get_user_model()

class Command(BaseCommand):
    help = 'Заполняет базу данных тестовыми данными'

    def handle(self, *args, **options):
        self.stdout.write('Начинаем заполнение базы данных...')
        
        # Получаем пользователя
        try:
            main_user = User.objects.get(login='1234569')
        except User.DoesNotExist:
            main_user = User.objects.first()
        
        if not main_user:
            self.stdout.write(self.style.ERROR('Пользователи не найдены! Сначала создайте пользователя'))
            return
        
        self.stdout.write(f'Используем пользователя: {main_user.login}')
        
        # Получаем список картинок из папки media/tests
        tests_media_path = os.path.join(settings.MEDIA_ROOT, 'tests')
        image_files = []
        if os.path.exists(tests_media_path):
            image_files = [f for f in os.listdir(tests_media_path) 
                          if f.lower().endswith(('.jpg', '.jpeg', '.png', '.gif', '.webp'))]
        
        if not image_files:
            self.stdout.write(self.style.WARNING('Картинки не найдены! Тесты будут без изображений'))
        else:
            self.stdout.write(f'Найдено картинок: {len(image_files)}')
        
        # ==================== ОЧИСТКА СТАРЫХ ДАННЫХ ====================
        self.stdout.write('\n=== Очистка старых данных ===')
        
        TestQuestion.objects.all().delete()
        PoolQuestion.objects.all().delete()
        Test.objects.all().delete()
        Pool.objects.all().delete()
        Answer.objects.all().delete()
        Question.objects.all().delete()
        
        # ==================== СОЗДАНИЕ ВОПРОСОВ (50 шт) ====================
        self.stdout.write('\n=== Создание вопросов ===')
        
        questions_list = [
            # Программирование (15)
            {"text": "Что такое Python?", "answers": ["Язык программирования", "Змея", "Фреймворк", "База данных"], "correct": 0},
            {"text": "Что такое Git?", "answers": ["Система контроля версий", "Язык", "Фреймворк", "IDE"], "correct": 0},
            {"text": "Что такое Docker?", "answers": ["Контейнеризация", "Виртуализация", "Оркестрация", "CI/CD"], "correct": 0},
            {"text": "Что такое REST API?", "answers": ["Архитектура", "Протокол", "Библиотека", "Фреймворк"], "correct": 0},
            {"text": "Что такое SQL?", "answers": ["Язык запросов", "База данных", "СУБД", "Таблица"], "correct": 0},
            {"text": "Что такое NoSQL?", "answers": ["Нереляционная БД", "Реляционная БД", "SQL запрос", "ORM"], "correct": 0},
            {"text": "Что такое ORM?", "answers": ["Объектно-реляционное отображение", "База данных", "Язык", "Фреймворк"], "correct": 0},
            {"text": "Что такое API?", "answers": ["Интерфейс программирования", "Приложение", "Протокол", "Сервер"], "correct": 0},
            {"text": "Что такое JSON?", "answers": ["Формат данных", "Язык", "База данных", "Протокол"], "correct": 0},
            {"text": "Что такое AJAX?", "answers": ["Асинхронные запросы", "Фреймворк", "Библиотека", "Язык"], "correct": 0},
            {"text": "Что такое Webpack?", "answers": ["Сборщик модулей", "Фреймворк", "Библиотека", "Язык"], "correct": 0},
            {"text": "Что такое Babel?", "answers": ["Транспайлер", "Сборщик", "Линтер", "Фреймворк"], "correct": 0},
            {"text": "Что такое CI/CD?", "answers": ["Непрерывная интеграция", "База данных", "Фреймворк", "Язык"], "correct": 0},
            {"text": "Что такое Kubernetes?", "answers": ["Оркестрация контейнеров", "База данных", "Фреймворк", "Язык"], "correct": 0},
            {"text": "Что такое GraphQL?", "answers": ["Язык запросов API", "База данных", "Фреймворк", "Библиотека"], "correct": 0},
            
            # Веб-разработка (15)
            {"text": "Что такое HTML?", "answers": ["Разметка", "Стили", "Скрипты", "База данных"], "correct": 0},
            {"text": "Что такое CSS?", "answers": ["Стили", "Разметка", "Скрипты", "База данных"], "correct": 0},
            {"text": "Что такое JavaScript?", "answers": ["Язык программирования", "Библиотека", "Фреймворк", "Стили"], "correct": 0},
            {"text": "Что такое React?", "answers": ["Библиотека", "Фреймворк", "Язык", "База данных"], "correct": 0},
            {"text": "Что такое Angular?", "answers": ["Фреймворк", "Библиотека", "Язык", "База данных"], "correct": 0},
            {"text": "Что такое Vue.js?", "answers": ["Фреймворк", "Библиотека", "Язык", "База данных"], "correct": 0},
            {"text": "Что такое TypeScript?", "answers": ["Типизированный JS", "Библиотека", "Фреймворк", "Язык"], "correct": 0},
            {"text": "Что такое Node.js?", "answers": ["Среда выполнения", "Фреймворк", "Библиотека", "Язык"], "correct": 0},
            {"text": "Что такое Next.js?", "answers": ["Фреймворк React", "Библиотека", "Язык", "База данных"], "correct": 0},
            {"text": "Что такое Tailwind CSS?", "answers": ["CSS-фреймворк", "Библиотека", "Язык", "Стили"], "correct": 0},
            {"text": "Что такое Bootstrap?", "answers": ["CSS-фреймворк", "Библиотека", "Язык", "Стили"], "correct": 0},
            {"text": "Что такое SASS?", "answers": ["Препроцессор CSS", "Язык", "Фреймворк", "Библиотека"], "correct": 0},
            {"text": "Что такое WebSocket?", "answers": ["Протокол связи", "База данных", "Фреймворк", "Язык"], "correct": 0},
            {"text": "Что такое PWA?", "answers": ["Прогрессивное веб-приложение", "База данных", "Фреймворк", "Протокол"], "correct": 0},
            {"text": "Что такое SSR?", "answers": ["Серверный рендеринг", "Клиентский рендеринг", "База данных", "Протокол"], "correct": 0},
            
            # Базы данных (10)
            {"text": "Что такое первичный ключ?", "answers": ["Уникальный идентификатор", "Индекс", "Связь", "Таблица"], "correct": 0},
            {"text": "Что такое внешний ключ?", "answers": ["Ссылка на другую таблицу", "Уникальный ключ", "Индекс", "Первичный ключ"], "correct": 0},
            {"text": "Что такое индекс в БД?", "answers": ["Ускоряет поиск", "Замедляет поиск", "Хранит данные", "Связывает таблицы"], "correct": 0},
            {"text": "Что такое транзакция?", "answers": ["Группа операций", "Запрос", "Таблица", "Индекс"], "correct": 0},
            {"text": "Что такое ACID?", "answers": ["Свойства транзакций", "База данных", "Язык", "Протокол"], "correct": 0},
            {"text": "Что такое PostgreSQL?", "answers": ["Реляционная БД", "NoSQL БД", "СУБД", "Фреймворк"], "correct": 0},
            {"text": "Что такое MySQL?", "answers": ["Реляционная БД", "NoSQL БД", "СУБД", "Фреймворк"], "correct": 0},
            {"text": "Что такое MongoDB?", "answers": ["NoSQL БД", "Реляционная БД", "СУБД", "Фреймворк"], "correct": 0},
            {"text": "Что такое Redis?", "answers": ["In-memory БД", "Реляционная БД", "NoSQL БД", "СУБД"], "correct": 0},
            {"text": "Что такое Elasticsearch?", "answers": ["Поисковая БД", "Реляционная БД", "NoSQL БД", "СУБД"], "correct": 0},
            
            # Общие знания (10)
            {"text": "Сколько планет в солнечной системе?", "answers": ["8", "7", "9", "10"], "correct": 0},
            {"text": "Сколько континентов на Земле?", "answers": ["6", "5", "7", "4"], "correct": 0},
            {"text": "Столица Франции?", "answers": ["Париж", "Лондон", "Берлин", "Мадрид"], "correct": 0},
            {"text": "Самый большой океан?", "answers": ["Тихий", "Атлантический", "Индийский", "Северный Ледовитый"], "correct": 0},
            {"text": "Самая высокая гора?", "answers": ["Эверест", "Эльбрус", "Килиманджаро", "Мак-Кинли"], "correct": 0},
            {"text": "Кто написал 'Войну и мир'?", "answers": ["Толстой", "Достоевский", "Пушкин", "Чехов"], "correct": 0},
            {"text": "Кто написал 'Евгения Онегина'?", "answers": ["Пушкин", "Лермонтов", "Толстой", "Достоевский"], "correct": 0},
            {"text": "Самая длинная река в мире?", "answers": ["Нил", "Амазонка", "Волга", "Янцзы"], "correct": 0},
            {"text": "Кто открыл Америку?", "answers": ["Колумб", "Магеллан", "Васко да Гама", "Кук"], "correct": 0},
            {"text": "Сколько цветов в радуге?", "answers": ["7", "6", "8", "5"], "correct": 0},
        ]
        
        all_questions = []
        for q_data in questions_list:
            question = Question.objects.create(
                text=q_data["text"],
                author=main_user,
                difficulty=random.randint(1, 5),
                explanation=f"Пояснение: {q_data['text']}"
            )
            
            for idx, answer_text in enumerate(q_data["answers"]):
                Answer.objects.create(
                    question=question,
                    text=answer_text,
                    is_correct=(idx == q_data["correct"]),
                    order_index=idx
                )
            
            all_questions.append(question)
        
        self.stdout.write(f'Всего создано вопросов: {len(all_questions)}')
        
        # ==================== СОЗДАНИЕ ПУЛОВ ====================
        self.stdout.write('\n=== Создание пулов ===')
        
        pools_data = [
            {"name": "Всё для IT", "description": "Вопросы по программированию и IT"},
            {"name": "Веб-разработка", "description": "HTML, CSS, JavaScript, React"},
            {"name": "Базы данных", "description": "SQL, NoSQL, индексы, ключи"},
            {"name": "Python/Django", "description": "Вопросы по Python и Django"},
            {"name": "Frontend", "description": "React, TypeScript, JS"},
            {"name": "Backend", "description": "Node.js, Python, REST API"},
            {"name": "Общая эрудиция", "description": "Разные вопросы на кругозор"},
            {"name": "Собеседование", "description": "Частые вопросы на интервью"},
            {"name": "Технологии", "description": "Docker, Git, Kubernetes"},
            {"name": "Junior уровень", "description": "Для начинающих разработчиков"},
        ]
        
        pools = []
        for pool_data in pools_data:
            pool = Pool.objects.create(
                name=pool_data["name"],
                description=pool_data["description"],
                user=main_user
            )
            pools.append(pool)
            self.stdout.write(f'  Создан пул: {pool.name}')
        
        # Наполняем пулы вопросами
        for pool in pools:
            num_questions = random.randint(15, 25)
            selected_questions = random.sample(all_questions, min(num_questions, len(all_questions)))
            for question in selected_questions:
                PoolQuestion.objects.get_or_create(pool=pool, question=question)
        
        # ==================== СОЗДАНИЕ ТЕСТОВ (50 шт) ====================
        self.stdout.write('\n=== Создание тестов (50 шт) ===')
        
        test_names = [
            "JavaScript Основы", "Python для начинающих", "React Advanced", "Django Master",
            "SQL от простого к сложному", "Git и GitHub", "Docker и Kubernetes",
            "Алгоритмы и структуры данных", "TypeScript полный курс", "Node.js Professional",
            "HTML/CSS Мастер", "Angular для профессионалов", "Vue.js основы",
            "PHP начинающим", "Java Core", "C# .NET разработка", "Go язык программирования",
            "Rust основы", "Kotlin для Android", "Swift iOS разработка",
            "Machine Learning основы", "Data Science введение", "Cloud Computing AWS",
            "DevOps инжиниринг", "Linux администратор", "CyberSecurity основы",
            "Тестирование QA", "SCRUM и Agile", "Управление проектами", "Product Management",
            "UX/UI дизайн", "Графический дизайн", "3D моделирование", "Видеомонтаж",
            "Маркетинг в IT", "SEO оптимизация", "SMM продвижение", "Копирайтинг",
            "Английский для IT", "Немецкий язык", "Французский язык", "Китайский язык",
            "Математика для программистов", "Физика для IT", "Статистика и анализ данных",
            "Экономика для IT", "Бизнес-аналитика", "Финансовая грамотность", "Право в IT",
            "Кибербезопасность", "Блокчейн и криптовалюты"
        ]
        
        topics_list = ['технологии', 'наука', 'программирование', 'веб', 'мобильные', 'данные', 'дизайн', 'менеджмент', 'безопасность', 'искусственный интеллект']
        
        for i, title in enumerate(test_names[:50]):
            num_questions = random.randint(10, 20)
            selected_questions = random.sample(all_questions, min(num_questions, len(all_questions)))
            
            # ПРАВИЛЬНЫЙ ПУТЬ - с /media/tests/
            image_path = None
            if image_files:
                random_image = random.choice(image_files)
                image_path = f'/media/tests/{random_image}'
            
            test = Test.objects.create(
                title=title,
                description=f"Проверьте свои знания по теме '{title}'. Тест состоит из {num_questions} вопросов. Проходной балл - 70%",
                author=main_user,
                is_open=random.choice([True, False]),
                is_survey=False,
                time_limit=random.choice([15, 30, 45, 60, 90]),
                passing_score=random.choice([60, 65, 70, 75, 80]),
                attempts_limit=random.choice([0, 1, 3, 5]),
                image=image_path,
                topics=random.sample(topics_list, random.randint(2, 4))
            )
            
            for idx, question in enumerate(selected_questions):
                TestQuestion.objects.create(
                    test=test,
                    question=question,
                    order_index=idx
                )
            
            status = "открытый" if test.is_open else "приватный"
            img_status = f"📷 {random_image[:20]}..." if image_path else "❌ без картинки"
            self.stdout.write(f'  {i+1:2d}. {title[:35]:35} | {status} | {img_status}')
        
        # ==================== СОЗДАНИЕ ОПРОСОВ (50 шт) ====================
        self.stdout.write('\n=== Создание опросов (50 шт) ===')
        
        survey_names = [
            "Ваше отношение к работе из дома", "Любимый язык программирования", "Как вы учитесь?",
            "Оценка качества образования", "Источники новостей", "Социальные сети",
            "Здоровый образ жизни", "Путешествия", "Книги или фильмы", "Музыкальные предпочтения",
            "Футбол или хоккей?", "Кофе или чай?", "Утро или ночь?", "Windows или macOS?",
            "VS Code или IntelliJ?", "GitHub или GitLab?", "React или Vue?", "Django или Flask?",
            "SQL или NoSQL?", "REST или GraphQL?", "Agile или Waterfall?", "AWS или Azure?",
            "Android или iOS?", "Python или Java?", "TypeScript или JavaScript?",
            "Работа в офисе или удалёнка?", "Фриланс или найм?", "Стартап или корпорация?",
            "Образование: самоучка или курсы?", "Техническая литература или видео?", "Код-ревью: за или против?",
            "Тестирование: TDD или нет?", "Документация: нужна или нет?", "Митинги: польза или вред?",
            "Отпуск: море или горы?", "Спорт: зал или бег?", "Фильмы: комедия или драма?",
            "Книги: бумажные или электронные?", "Игры: онлайн или одиночные?", "Карьера: специалист или менеджер?",
            "Зарплата: больше или интереснее?", "Работа: в команде или соло?", "Открытый исходный код: да или нет?",
            "Конференции: посещать или нет?", "Пет-проекты: нужны или нет?", "Менторство: давать или получать?",
            "Офлайн-митапы: ходить или нет?", "Вторая специальность: нужна?", "Фриланс: основной доход или подработка?",
            "Искусственный интеллект: угроза или помощь?", "Кибербезопасность: важна ли она?"
        ]
        
        for i, title in enumerate(survey_names[:50]):
            num_questions = random.randint(5, 12)
            selected_questions = random.sample(all_questions, min(num_questions, len(all_questions)))
            
            # ПРАВИЛЬНЫЙ ПУТЬ - с /media/tests/
            image_path = None
            if image_files:
                random_image = random.choice(image_files)
                image_path = f'/media/tests/{random_image}'
            
            survey = Test.objects.create(
                title=title,
                description=f"Поделитесь своим мнением в опросе '{title}'",
                author=main_user,
                is_open=random.choice([True, False]),
                is_survey=True,
                time_limit=0,
                passing_score=0,
                attempts_limit=0,
                image=image_path,
                topics=random.sample(topics_list, random.randint(1, 3))
            )
            
            for idx, question in enumerate(selected_questions):
                TestQuestion.objects.create(
                    test=survey,
                    question=question,
                    order_index=idx
                )
            
            status = "открытый" if survey.is_open else "приватный"
            img_status = f"📷 {random_image[:20]}..." if image_path else "❌ без картинки"
            self.stdout.write(f'  {i+1:2d}. {title[:35]:35} | {status} | {img_status}')
        
        # ==================== ПРОВЕРКА ====================
        self.stdout.write('\n=== Проверка созданных тестов ===')
        
        tests_with_images = Test.objects.exclude(image__isnull=True).exclude(image='')
        self.stdout.write(f'Тестов с картинками: {tests_with_images.count()}')
        
        for test in tests_with_images[:5]:
            self.stdout.write(f'  📷 {test.title}: {test.image}')
        
        # ==================== ИТОГИ ====================
        self.stdout.write(self.style.SUCCESS('\n✅ База данных успешно заполнена!'))
        self.stdout.write(f'\n📊 Итоги:')
        self.stdout.write(f'  🔹 Пользователь: {main_user.login}')
        self.stdout.write(f'  🔹 Вопросов создано: {len(all_questions)}')
        self.stdout.write(f'  🔹 Пуллов создано: {len(pools)}')
        self.stdout.write(f'  🔹 Тестов создано: 50')
        self.stdout.write(f'  🔹 Опросов создано: 50')
        
        if image_files:
            self.stdout.write(f'  🔹 Картинок в папке: {len(image_files)}')
            self.stdout.write(f'  🔹 Тестов с картинками: {tests_with_images.count()}')
            self.stdout.write(f'  🔹 Путь к картинкам: /media/tests/имя_файла.jpg')
        else:
            self.stdout.write(self.style.WARNING('  ⚠️ Картинки не найдены! Добавьте картинки в media/tests/'))