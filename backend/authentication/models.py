# authentication/models.py

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
    
    is_active = models.BooleanField(
        default=True,
        verbose_name='Активен'
    )
    is_staff = models.BooleanField(  # ← ИСПРАВЛЕНО! Было models.Bodels.BooleanField
        default=False,
        verbose_name='Доступ в админку'
    )
    
    USERNAME_FIELD = 'login'
    REQUIRED_FIELDS = ['email']
    
    objects = UserManager()
    
    class Meta:
        verbose_name = 'Пользователь'
        verbose_name_plural = 'Пользователи'
    
    def __str__(self):
        return self.login