from django.db import models
from django.contrib.auth.models import AbstractBaseUser, PermissionsMixin, BaseUserManager

class UserManager(BaseUserManager):
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
    login = models.CharField(
        max_length=50, 
        unique=True,
        verbose_name='Логин'
    )
    email = models.EmailField(
        unique=True,
        verbose_name='Email'
    )
    status = models.CharField(
        max_length=20, 
        default='user',
        choices=[('user', 'Пользователь'), ('admin', 'Администратор')],
        verbose_name='Статус'
    )
    created_at = models.DateTimeField(
        auto_now_add=True,
        verbose_name='Дата регистрации'
    )
    
    # ДОБАВЬ ЭТО ПОЛЕ:
    is_subscribe = models.BooleanField(
        default=False,
        verbose_name='Согласие на обработку данных'
    )
    
    is_active = models.BooleanField(
        default=True,
        verbose_name='Активен'
    )
    is_staff = models.BooleanField( 
        default=False,
        verbose_name='Доступ в админку'
    )

    avatar = models.TextField(blank=True, null=True)

    bio = models.TextField(
        max_length=200, 
        blank=True, 
        default='',
        verbose_name='О себе'
    )
    full_name = models.CharField(
        max_length=50, 
        blank=True, 
        default='',
        verbose_name='Имя пользователя'
    )
    last_seen = models.DateTimeField(
        auto_now=True,
        verbose_name='Последний заход'
    )
    friends = models.ManyToManyField(
        'self', 
        blank=True, 
        symmetrical=True,
        verbose_name='Друзья'
    )
    
    USERNAME_FIELD = 'login'
    REQUIRED_FIELDS = ['email']
    
    objects = UserManager()
    
    class Meta:
        verbose_name = 'Пользователь'
        verbose_name_plural = 'Пользователи'
    
    def __str__(self):
        return self.login

# Добавь в конец файла authentication/models.py

class FriendRequest(models.Model):
    """Заявки в друзья"""
    STATUS_CHOICES = (
        ('pending', 'Ожидает'),
        ('accepted', 'Принята'),
        ('rejected', 'Отклонена'),
    )
    
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
    status = models.CharField(
        max_length=10, 
        choices=STATUS_CHOICES, 
        default='pending',
        verbose_name='Статус'
    )
    created_at = models.DateTimeField(auto_now_add=True, verbose_name='Дата создания')
    
    class Meta:
        unique_together = ['from_user', 'to_user']
        verbose_name = 'Заявка в друзья'
        verbose_name_plural = 'Заявки в друзья'
    
    def __str__(self):
        return f"{self.from_user} -> {self.to_user} ({self.status})"

class FriendRequest(models.Model):
    """Заявки в друзья"""
    STATUS_CHOICES = (
        ('pending', 'Ожидает'),
        ('accepted', 'Принята'),
        ('rejected', 'Отклонена'),
    )
    
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
    status = models.CharField(
        max_length=10, 
        choices=STATUS_CHOICES, 
        default='pending',
        verbose_name='Статус'
    )
    created_at = models.DateTimeField(auto_now_add=True, verbose_name='Дата создания')
    
    class Meta:
        unique_together = ['from_user', 'to_user']
        verbose_name = 'Заявка в друзья'
        verbose_name_plural = 'Заявки в друзья'
    
    def __str__(self):
        return f"{self.from_user} -> {self.to_user} ({self.status})"