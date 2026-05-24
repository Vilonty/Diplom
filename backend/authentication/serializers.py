from rest_framework import serializers
from django.contrib.auth import get_user_model
from rest_framework_simplejwt.tokens import RefreshToken

User = get_user_model()


class UserSerializer(serializers.ModelSerializer):
    """Сериализатор для модели пользователя"""
    
    friends_count = serializers.SerializerMethodField()
    created_tests = serializers.IntegerField(read_only=True)
    completed_tests = serializers.IntegerField(read_only=True)
    
    class Meta:
        model = User
        fields = ('id', 'login', 'email', 'status', 'is_subscribe', 'created_at', 
                  'avatar', 'bio', 'full_name', 'last_seen', 'friends_count',
                  'created_tests', 'completed_tests',
                  'is_muted', 'mute_reason', 'mute_until', 'mute_permanent',
                  'is_banned', 'ban_reason', 'ban_until', 'ban_permanent')
    
    def get_friends_count(self, obj):
        return obj.friends.count()


class ProfileUpdateSerializer(serializers.ModelSerializer):
    """Сериализатор для обновления профиля пользователя"""
    
    class Meta:
        model = User
        fields = ('full_name', 'bio', 'avatar')
    
    def update(self, instance, validated_data):
        if 'full_name' in validated_data:
            instance.full_name = validated_data['full_name']
        if 'bio' in validated_data:
            instance.bio = validated_data['bio']
        if 'avatar' in validated_data:
            avatar_value = validated_data['avatar']
            if avatar_value and avatar_value != '' and avatar_value != 'null':
                instance.avatar = avatar_value
        instance.save()
        return instance


class RegisterSerializer(serializers.ModelSerializer):
    """Сериализатор для регистрации нового пользователя"""
    
    password = serializers.CharField(write_only=True, min_length=6)
    password2 = serializers.CharField(write_only=True, min_length=6)
    subscribe = serializers.BooleanField(write_only=True, required=False, default=False)

    class Meta:
        model = User
        fields = ('login', 'email', 'password', 'password2', 'subscribe')

    def validate(self, data):
        if data['password'] != data['password2']:
            raise serializers.ValidationError({"password": "Пароли не совпадают"})
        
        if not data.get('subscribe', False):
            raise serializers.ValidationError({"subscribe": "Необходимо согласие на обработку персональных данных"})
        
        return data

    def create(self, validated_data):
        validated_data.pop('password2')
        subscribe = validated_data.pop('subscribe', False)
        
        user = User.objects.create_user(
            login=validated_data['login'],
            email=validated_data.get('email', ''),
            password=validated_data['password'],
            is_subscribe=subscribe
        )
        return user


class LoginSerializer(serializers.Serializer):
    """Сериализатор для входа пользователя"""
    
    login = serializers.CharField()
    password = serializers.CharField(write_only=True)

    def validate(self, data):
        from django.contrib.auth import authenticate
        user = authenticate(username=data['login'], password=data['password'])
        if user and user.is_active:
            refresh = RefreshToken.for_user(user)
            return {
                'refresh': str(refresh),
                'access': str(refresh.access_token),
                'user': UserSerializer(user).data
            }
        raise serializers.ValidationError("Неверное имя пользователя или пароль")