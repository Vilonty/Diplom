from django.db import models
from django.conf import settings
from django.core.validators import MinValueValidator, MaxValueValidator

User = settings.AUTH_USER_MODEL

class Pool(models.Model):
    """Модель пула вопросов — контейнер для группировки вопросов пользователя"""
    name = models.CharField(max_length=100, verbose_name='Название пула')
    description = models.TextField(blank=True, verbose_name='Описание')
    user = models.ForeignKey(User, on_delete=models.CASCADE, related_name='pools', verbose_name='Владелец')
    created_at = models.DateTimeField(auto_now_add=True, verbose_name='Дата создания')
    updated_at = models.DateTimeField(auto_now=True, verbose_name='Дата обновления')
    
    class Meta:
        verbose_name = 'Пул вопросов'
        verbose_name_plural = 'Пулы вопросов'
        ordering = ['-created_at']
    
    def __str__(self):
        return self.name


class Question(models.Model):
    """Модель вопроса — может использоваться в пулах и тестах"""
    text = models.TextField(verbose_name='Текст вопроса')
    image = models.TextField(blank=True, null=True, verbose_name='Картинка вопроса (URL)')
    author = models.ForeignKey(User, on_delete=models.CASCADE, related_name='questions', verbose_name='Автор')
    difficulty = models.IntegerField(
        default=1,
        validators=[MinValueValidator(1), MaxValueValidator(5)],
        verbose_name='Сложность (1-5)'
    )
    explanation = models.TextField(blank=True, verbose_name='Пояснение к ответу')
    usage_count = models.IntegerField(default=0, verbose_name='Счётчик использования')
    is_text_input = models.BooleanField(default=False, verbose_name='Текстовый ввод вместо выбора')
    text_answer = models.CharField(max_length=500, blank=True, default='', verbose_name='Правильный текстовый ответ')
    created_at = models.DateTimeField(auto_now_add=True, verbose_name='Дата создания')
    updated_at = models.DateTimeField(auto_now=True, verbose_name='Дата обновления')
    
    class Meta:
        verbose_name = 'Вопрос'
        verbose_name_plural = 'Вопросы'
        ordering = ['-created_at']
    
    def __str__(self):
        return self.text[:50] if self.text else f"Вопрос {self.id}"


class Answer(models.Model):
    """Модель варианта ответа для вопроса (для вопросов с выбором ответа)"""
    question = models.ForeignKey(Question, on_delete=models.CASCADE, related_name='answers', verbose_name='Вопрос')
    text = models.CharField(max_length=500, verbose_name='Текст варианта')
    is_correct = models.BooleanField(default=False, verbose_name='Правильный ответ')
    order_index = models.IntegerField(verbose_name='Порядковый номер')
    
    class Meta:
        verbose_name = 'Вариант ответа'
        verbose_name_plural = 'Варианты ответов'
        ordering = ['order_index']
    
    def __str__(self):
        return self.text[:50] if self.text else f"Ответ {self.id}"


class PoolQuestion(models.Model):
    """Модель связи пула с вопросами (многие-ко-многим)"""
    pool = models.ForeignKey(Pool, on_delete=models.CASCADE, related_name='pool_questions', verbose_name='Пул')
    question = models.ForeignKey(Question, on_delete=models.CASCADE, related_name='pool_questions', verbose_name='Вопрос')
    added_at = models.DateTimeField(auto_now_add=True, verbose_name='Дата добавления')
    
    class Meta:
        verbose_name = 'Связь пула с вопросом'
        verbose_name_plural = 'Связи пулов с вопросами'
        unique_together = ['pool', 'question']
        ordering = ['added_at']
    
    def __str__(self):
        return f"{self.pool.name} - {self.question.text[:30]}"


class Test(models.Model):
    """Модель теста или опроса"""
    title = models.CharField(max_length=200, verbose_name='Название')
    description = models.TextField(blank=True, verbose_name='Описание')
    author = models.ForeignKey(User, on_delete=models.CASCADE, related_name='tests', verbose_name='Автор')
    is_open = models.BooleanField(default=True, verbose_name='Открытый')
    is_survey = models.BooleanField(default=False, verbose_name='Это опрос')
    time_limit = models.IntegerField(default=0, verbose_name='Ограничение времени (мин)')
    passing_score = models.IntegerField(
        default=70,
        validators=[MinValueValidator(0), MaxValueValidator(100)],
        verbose_name='Проходной балл (%)'
    )
    attempts_limit = models.IntegerField(
        default=0,
        verbose_name='Лимит попыток (0 - без лимита)',
        validators=[MinValueValidator(0)]
    )
    image = models.TextField(blank=True, null=True, verbose_name='Обложка (URL)')
    topics = models.JSONField(default=list, verbose_name='Темы')
    access_token = models.CharField(max_length=50, blank=True, null=True, verbose_name='Токен доступа для приватного теста')
    created_at = models.DateTimeField(auto_now_add=True, verbose_name='Дата создания')
    updated_at = models.DateTimeField(auto_now=True, verbose_name='Дата обновления')
    
    class Meta:
        verbose_name = 'Тест'
        verbose_name_plural = 'Тесты'
        ordering = ['-created_at']
    
    def __str__(self):
        return self.title


class TestQuestion(models.Model):
    """Модель связи теста с вопросами (многие-ко-многим с порядковым номером)"""
    test = models.ForeignKey(Test, on_delete=models.CASCADE, related_name='test_questions', verbose_name='Тест')
    question = models.ForeignKey(Question, on_delete=models.CASCADE, related_name='test_questions', verbose_name='Вопрос')
    order_index = models.IntegerField(verbose_name='Порядковый номер')
    added_at = models.DateTimeField(auto_now_add=True, verbose_name='Дата добавления')
    
    class Meta:
        verbose_name = 'Связь теста с вопросом'
        verbose_name_plural = 'Связи тестов с вопросами'
        unique_together = ['test', 'question']
        ordering = ['order_index']
    
    def __str__(self):
        return f"{self.test.title} - {self.question.text[:30]}"


class TestAttempt(models.Model):
    """Модель попытки прохождения теста пользователем"""
    user = models.ForeignKey(User, on_delete=models.CASCADE, related_name='test_attempts', verbose_name='Пользователь', null=True, blank=True)
    test = models.ForeignKey(Test, on_delete=models.CASCADE, related_name='attempts', verbose_name='Тест')
    score = models.IntegerField(verbose_name='Результат (%)')
    is_passed = models.BooleanField(default=False, verbose_name='Пройден')
    answers = models.JSONField(default=dict, verbose_name='Ответы пользователя')
    started_at = models.DateTimeField(auto_now_add=True, verbose_name='Время начала')
    finished_at = models.DateTimeField(null=True, blank=True, verbose_name='Время завершения')
    
    class Meta:
        verbose_name = 'Попытка теста'
        verbose_name_plural = 'Попытки тестов'
        ordering = ['-started_at']
    
    def __str__(self):
        user_login = self.user.login if self.user else 'Аноним'
        return f"{user_login} - {self.test.title} - {self.score}%"


class TestRating(models.Model):
    """Модель оценки (рейтинга) теста пользователями"""
    test = models.ForeignKey(Test, on_delete=models.CASCADE, related_name='ratings', verbose_name='Тест')
    user = models.ForeignKey(User, on_delete=models.CASCADE, related_name='test_ratings', verbose_name='Пользователь')
    rating = models.IntegerField(validators=[MinValueValidator(1), MaxValueValidator(5)], verbose_name='Оценка (1-5)')
    created_at = models.DateTimeField(auto_now_add=True, verbose_name='Дата оценки')
    
    class Meta:
        unique_together = ['test', 'user']
        verbose_name = 'Рейтинг теста'
        verbose_name_plural = 'Рейтинги тестов'
    
    def __str__(self):
        return f"{self.test.title} - {self.user.login}: {self.rating}"


class TestComment(models.Model):
    """Модель комментария к тесту"""
    test = models.ForeignKey(Test, on_delete=models.CASCADE, related_name='comments', verbose_name='Тест')
    user = models.ForeignKey(User, on_delete=models.CASCADE, related_name='test_comments', verbose_name='Пользователь')
    text = models.TextField(verbose_name='Текст комментария')
    created_at = models.DateTimeField(auto_now_add=True, verbose_name='Дата создания')
    updated_at = models.DateTimeField(auto_now=True, verbose_name='Дата обновления')
    
    class Meta:
        verbose_name = 'Комментарий к тесту'
        verbose_name_plural = 'Комментарии к тестам'
        ordering = ['-created_at']
    
    def __str__(self):
        return f"{self.user.login} - {self.test.title[:30]}"


class Report(models.Model):
    """Модель жалобы (репорта) на тест, комментарий или пользователя"""
    
    TARGET_TYPES = (
        ('test', 'Тест'),
        ('comment', 'Комментарий'),
        ('user', 'Пользователь'),
    )
    
    STATUS_CHOICES = (
        ('pending', 'На рассмотрении'),
        ('reviewed', 'Проверено'),
        ('resolved', 'Решено'),
    )
    
    target_type = models.CharField(max_length=10, choices=TARGET_TYPES, verbose_name='Тип цели')
    target_id = models.IntegerField(verbose_name='ID цели')  # Для comment - ID комментария
    test_id = models.IntegerField(null=True, blank=True, verbose_name='ID теста (для комментариев)')  # ДОБАВИТЬ
    user = models.ForeignKey(User, on_delete=models.CASCADE, related_name='reports', verbose_name='Пользователь')
    reason = models.TextField(verbose_name='Причина жалобы')
    comment = models.TextField(blank=True, default='', verbose_name='Комментарий')
    status = models.CharField(max_length=10, choices=STATUS_CHOICES, default='pending', verbose_name='Статус')
    created_at = models.DateTimeField(auto_now_add=True, verbose_name='Дата создания')
    updated_at = models.DateTimeField(auto_now=True, verbose_name='Дата обновления')
    
    class Meta:
        verbose_name = 'Репорт'
        verbose_name_plural = 'Репорты'
        ordering = ['-created_at']
    
    def __str__(self):
        return f"{self.user} -> {self.target_type}:{self.target_id} ({self.reason})"