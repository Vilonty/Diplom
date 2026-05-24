from django.db import models
from django.contrib.auth.models import AbstractBaseUser, PermissionsMixin, BaseUserManager
from django.utils import timezone  # ДОБАВИТЬ ЭТОТ ИМПОРТ


class UserManager(BaseUserManager):
    """Менеджер для модели пользователя"""
    
    def create_user(self, login, email, password=None, **extra_fields):
        if not login:
            raise ValueError('Логин обязателен')
        if not email:
            raise ValueError('Email обязателен')
        
        email = self.normalize_email(email)
        user = self.model(login=login, email=email, **extra_fields)
        user.set_password(password)
        user.save(using=self._db)
        return user
    
    def create_superuser(self, login, email, password=None, **extra_fields):
        extra_fields.setdefault('is_staff', True)
        extra_fields.setdefault('is_superuser', True)
        return self.create_user(login, email, password, **extra_fields)


class User(AbstractBaseUser, PermissionsMixin):
    """Модель пользователя"""
    
    # Основные учётные данные
    login = models.CharField(
        max_length=50, 
        unique=True,
        verbose_name='Логин'
    )
    email = models.EmailField(
        unique=True,
        verbose_name='Email'
    )
    
    # Персональная информация
    full_name = models.CharField(
        max_length=50, 
        blank=True, 
        default='',
        verbose_name='Имя пользователя'
    )
    bio = models.TextField(
        max_length=200, 
        blank=True, 
        default='',
        verbose_name='О себе'
    )
    avatar = models.TextField(
        blank=True, 
        null=True,
        verbose_name='Аватар (URL)'
    )
    
    # Социальные связи
    friends = models.ManyToManyField(
        'self', 
        blank=True, 
        symmetrical=True,
        verbose_name='Друзья'
    )
    
    # Роли и права
    status = models.CharField(
        max_length=20, 
        default='user',
        choices=[('user', 'Пользователь'), ('admin', 'Администратор')],
        verbose_name='Статус'
    )
    is_active = models.BooleanField(
        default=True,
        verbose_name='Активен'
    )
    is_staff = models.BooleanField(
        default=False,
        verbose_name='Доступ в админку'
    )
    is_subscribe = models.BooleanField(
        default=False,
        verbose_name='Согласие на обработку данных'
    )
    
    # Временные метки
    created_at = models.DateTimeField(
        auto_now_add=True,
        verbose_name='Дата регистрации'
    )
    last_seen = models.DateTimeField(
        auto_now=True,
        verbose_name='Последний заход'
    )

    # Мут и бан
    is_muted = models.BooleanField(default=False, verbose_name='Замучен')
    mute_reason = models.TextField(blank=True, default='', verbose_name='Причина мута')
    mute_until = models.DateTimeField(null=True, blank=True, verbose_name='Мут до')
    mute_permanent = models.BooleanField(default=False, verbose_name='Перманентный мут')
    
    is_banned = models.BooleanField(default=False, verbose_name='Забанен')
    ban_reason = models.TextField(blank=True, default='', verbose_name='Причина бана')
    ban_until = models.DateTimeField(null=True, blank=True, verbose_name='Бан до')
    ban_permanent = models.BooleanField(default=False, verbose_name='Перманентный бан')
    
    # Настройки аутентификации
    USERNAME_FIELD = 'login'
    REQUIRED_FIELDS = ['email']
    objects = UserManager()

    def is_muted_active(self):
        """Проверка активного мута"""
        if not self.is_muted:
            return False
        if self.mute_permanent:
            return True
        if self.mute_until and timezone.now() > self.mute_until:
            # Мут истёк - автоматически снимаем
            self.is_muted = False
            self.mute_reason = ''
            self.mute_until = None
            self.mute_permanent = False
            self.save(update_fields=['is_muted', 'mute_reason', 'mute_until', 'mute_permanent'])
            return False
        return True
    
    def is_banned_active(self):
        """Проверка активного бана"""
        if not self.is_banned:
            return False
        if self.ban_permanent:
            return True
        if self.ban_until and timezone.now() > self.ban_until:
            # Бан истёк - автоматически снимаем
            self.is_banned = False
            self.ban_reason = ''
            self.ban_until = None
            self.ban_permanent = False
            self.is_active = True
            self.save(update_fields=['is_banned', 'ban_reason', 'ban_until', 'ban_permanent', 'is_active'])
            return False
        return True
    
    class Meta:
        verbose_name = 'Пользователь'
        verbose_name_plural = 'Пользователи'
    
    def __str__(self):
        return self.login
        


class FriendRequest(models.Model):
    """Модель заявки в друзья"""
    
    STATUS_CHOICES = (
        ('pending', 'Ожидает'),
        ('accepted', 'Принята'),
        ('rejected', 'Отклонена'),
    )
    
    # Связи с пользователями
    from_user = models.ForeignKey(
        User, 
        on_delete=models.CASCADE, 
        related_name='sent_requests',
        verbose_name='От кого'
    )
    to_user = models.ForeignKey(
        User, 
        on_delete=models.CASCADE, 
        related_name='received_requests',
        verbose_name='Кому'
    )
    
    # Статус и время
    status = models.CharField(
        max_length=10, 
        choices=STATUS_CHOICES, 
        default='pending',
        verbose_name='Статус'
    )
    created_at = models.DateTimeField(
        auto_now_add=True,
        verbose_name='Дата создания'
    )
    
    class Meta:
        unique_together = ['from_user', 'to_user']
        verbose_name = 'Заявка в друзья'
        verbose_name_plural = 'Заявки в друзья'
    
    def __str__(self):
        return f"{self.from_user} -> {self.to_user} ({self.status})"