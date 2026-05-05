from django.core.management.base import BaseCommand
from django.contrib.auth import get_user_model
from tests.models import Pool, Question, Answer, PoolQuestion, Test, TestQuestion
import random

User = get_user_model()

class Command(BaseCommand):
    help = 'Заполняет базу данных тестовыми данными'

    def handle(self, *args, **options):
        self.stdout.write('Начинаем заполнение базы данных...')
        
        # Получаем пользователей
        try:
            main_user = User.objects.get(login='1234569')
        except User.DoesNotExist:
            main_user = User.objects.first()
        
        if not main_user:
            self.stdout.write(self.style.ERROR('Пользователи не найдены! Сначала создайте пользователя'))
            return
        
        self.stdout.write(f'Используем пользователя: {main_user.login}')
        
        # Создаем вопросы (20 штук)
        questions_list = [
            {"text": "Что такое React?", "answers": ["Библиотека", "Фреймворк", "Язык", "База данных"], "correct": 0},
            {"text": "Что такое TypeScript?", "answers": ["Язык программирования", "Библиотека", "Фреймворк", "Инструмент"], "correct": 0},
            {"text": "Что такое CSS?", "answers": ["Стили", "Скрипты", "Разметка", "База данных"], "correct": 0},
            {"text": "Что такое HTML?", "answers": ["Разметка", "Стили", "Скрипты", "База данных"], "correct": 0},
            {"text": "Что такое JavaScript?", "answers": ["Язык программирования", "Библиотека", "Фреймворк", "База данных"], "correct": 0},
            {"text": "Что такое Python?", "answers": ["Язык программирования", "Библиотека", "Фреймворк", "База данных"], "correct": 0},
            {"text": "Что такое Django?", "answers": ["Фреймворк", "Язык", "Библиотека", "База данных"], "correct": 0},
            {"text": "Что такое REST API?", "answers": ["Архитектура", "Библиотека", "Фреймворк", "Язык"], "correct": 0},
            {"text": "Что такое Git?", "answers": ["Система контроля версий", "Язык", "Фреймворк", "Библиотека"], "correct": 0},
            {"text": "Что такое Docker?", "answers": ["Контейнеризация", "Язык", "Фреймворк", "Библиотека"], "correct": 0},
            {"text": "Сколько будет 2 + 2?", "answers": ["4", "3", "5", "6"], "correct": 0},
            {"text": "Сколько планет в солнечной системе?", "answers": ["8", "7", "9", "10"], "correct": 0},
            {"text": "Что такое HTTP?", "answers": ["Протокол", "Язык", "Фреймворк", "Библиотека"], "correct": 0},
            {"text": "Что такое SQL?", "answers": ["Язык запросов", "База данных", "Фреймворк", "Библиотека"], "correct": 0},
            {"text": "Что такое MongoDB?", "answers": ["NoSQL база данных", "SQL база", "Фреймворк", "Язык"], "correct": 0},
        ]
        
        questions_created = []
        for i, q_data in enumerate(questions_list[:15]):
            question = Question.objects.create(
                text=q_data["text"],
                author=main_user,
                difficulty=random.randint(1, 5),
                explanation=f"Пояснение к вопросу: {q_data['text']}"
            )
            
            for idx, answer_text in enumerate(q_data["answers"]):
                Answer.objects.create(
                    question=question,
                    text=answer_text,
                    is_correct=(idx == q_data["correct"]),
                    order_index=idx
                )
            
            questions_created.append(question)
            self.stdout.write(f'  Создан вопрос: {question.text[:50]}')
        
        # Создаем пулы вопросов
        pools_data = [
            {"name": "Основы программирования", "description": "Базовые вопросы по программированию"},
            {"name": "Веб-разработка", "description": "HTML, CSS, JavaScript"},
            {"name": "Базы данных", "description": "SQL, NoSQL"},
            {"name": "Математика", "description": "Базовые математические вопросы"},
            {"name": "Общие знания", "description": "Разные вопросы на эрудицию"},
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
        
        # Добавляем вопросы в пулы
        for pool in pools:
            num_questions = random.randint(4, 6)
            selected_questions = random.sample(questions_created, min(num_questions, len(questions_created)))
            for question in selected_questions[:num_questions]:
                PoolQuestion.objects.get_or_create(pool=pool, question=question)
            self.stdout.write(f'  В пул "{pool.name}" добавлено {len(selected_questions[:num_questions])} вопросов')
        
        # Создаем тесты (12 штук)
        test_titles = [
            "JavaScript Основы", "Python для начинающих", "Веб-разработка Full Stack",
            "Алгоритмы и структуры данных", "React Advanced", "Django Master",
            "SQL от простого к сложному", "Git и GitHub", "Docker и Kubernetes",
            "Математика для программистов", "Английский для IT", "Soft Skills"
        ]
        
        topics_list = ['наука', 'спорт', 'сериалы', 'анимации', 'игры']
        
        for title in test_titles:
            num_questions = random.randint(4, 8)
            selected_questions = random.sample(questions_created, min(num_questions, len(questions_created)))
            
            test = Test.objects.create(
                title=title,
                description=f"Этот тест проверит ваши знания по теме '{title}'",
                author=main_user,
                is_open=True,
                is_survey=False,
                time_limit=random.choice([15, 30, 45, 60]),
                passing_score=random.choice([60, 70, 80]),
                attempts_limit=0,
                topics=random.sample(topics_list, random.randint(1, 3))
            )
            
            for idx, question in enumerate(selected_questions[:num_questions]):
                TestQuestion.objects.create(
                    test=test,
                    question=question,
                    order_index=idx
                )
            
            self.stdout.write(f'  Создан тест: {test.title} (вопросов: {num_questions})')
        
        # Создаем опросы (10 штук)
        survey_titles = [
            "Ваше отношение к работе из дома", "Любимый язык программирования",
            "Как вы учитесь?", "Оценка качества образования", "Источники новостей",
            "Социальные сети", "Здоровый образ жизни", "Путешествия",
            "Книги или фильмы", "Музыкальные предпочтения"
        ]
        
        for title in survey_titles:
            num_questions = random.randint(4, 6)
            selected_questions = random.sample(questions_created, min(num_questions, len(questions_created)))
            
            survey = Test.objects.create(
                title=title,
                description=f"Опрос на тему: {title}",
                author=main_user,
                is_open=True,
                is_survey=True,
                time_limit=0,
                passing_score=0,
                attempts_limit=0,
                topics=random.sample(topics_list, random.randint(1, 3))
            )
            
            for idx, question in enumerate(selected_questions[:num_questions]):
                TestQuestion.objects.create(
                    test=survey,
                    question=question,
                    order_index=idx
                )
            
            self.stdout.write(f'  Создан опрос: {survey.title} (вопросов: {num_questions})')
        
        self.stdout.write(self.style.SUCCESS(f'База данных успешно заполнена!'))
        self.stdout.write(f'  - Создано вопросов: {len(questions_created)}')
        self.stdout.write(f'  - Создано пулов: {len(pools)}')
        self.stdout.write(f'  - Создано тестов: 12')
        self.stdout.write(f'  - Создано опросов: 10')