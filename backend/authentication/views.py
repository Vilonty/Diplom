import os
from django.conf import settings
from rest_framework import generics, status
from rest_framework.response import Response
from rest_framework.permissions import AllowAny, IsAuthenticated
from rest_framework.views import APIView
from rest_framework_simplejwt.tokens import RefreshToken
from django.contrib.auth import get_user_model, authenticate
from django.utils import timezone
from django.db.models import Q, Count, Avg
from .serializers import RegisterSerializer, LoginSerializer, UserSerializer, ProfileUpdateSerializer
from .models import FriendRequest
from django.core.files.storage import default_storage
import uuid
from datetime import timedelta 

User = get_user_model()


class UserSearchView(APIView):
    """Поиск пользователей по логину или имени"""
    permission_classes = [AllowAny]
    
    def get(self, request):
        search = request.query_params.get('search', '')
        if len(search) < 2:
            return Response([])
        
        users = User.objects.filter(
            Q(login__icontains=search) | Q(full_name__icontains=search)
        )[:10]
        
        serializer = UserSerializer(users, many=True)
        return Response(serializer.data)


class RegisterView(generics.CreateAPIView):
    """Регистрация нового пользователя"""
    queryset = User.objects.all()
    serializer_class = RegisterSerializer
    permission_classes = [AllowAny]


class LoginView(APIView):
    """Авторизация пользователя"""
    permission_classes = [AllowAny]
    
    def post(self, request):
        login = request.data.get('login')
        password = request.data.get('password')
        
        if not login or not password:
            return Response(
                {'error': 'Логин и пароль обязательны'}, 
                status=status.HTTP_400_BAD_REQUEST
            )
        
        user = authenticate(username=login, password=password)
        
        if user:
            refresh = RefreshToken.for_user(user)
            return Response({
                'refresh': str(refresh),
                'access': str(refresh.access_token),
                'user': UserSerializer(user).data
            })
        
        return Response(
            {'error': 'Неверный логин или пароль'}, 
            status=status.HTTP_401_UNAUTHORIZED
        )


class LogoutView(APIView):
    """Выход из системы (блокировка refresh-токена)"""
    permission_classes = [IsAuthenticated]
    
    def post(self, request):
        try:
            refresh_token = request.data.get('refresh')
            token = RefreshToken(refresh_token)
            token.blacklist()
            return Response({'message': 'Выход выполнен'})
        except Exception:
            return Response({'error': 'Неверный токен'}, status=400)


class ProfileView(APIView):
    """Профиль текущего пользователя (GET - получение, PATCH - обновление)"""
    permission_classes = [IsAuthenticated]
    
    def get(self, request):
        serializer = UserSerializer(request.user)
        return Response(serializer.data)
    
    def patch(self, request):
        serializer = ProfileUpdateSerializer(request.user, data=request.data, partial=True)
        if serializer.is_valid():
            serializer.save()
            request.user.last_seen = timezone.now()
            request.user.save(update_fields=['last_seen'])
            return Response(UserSerializer(request.user).data)
        return Response(serializer.errors, status=status.HTTP_400_BAD_REQUEST)


class UserProfileView(APIView):
    """Просмотр профиля другого пользователя"""
    permission_classes = [AllowAny]
    
    def get(self, request, user_id):
        try:
            user = User.objects.get(id=user_id)
            serializer = UserSerializer(user) 
            return Response(serializer.data)
        except User.DoesNotExist:
            return Response(
                {'error': 'Пользователь не найден'}, 
                status=status.HTTP_404_NOT_FOUND
            )


class UpdateLastSeenView(APIView):
    """Обновление времени последней активности пользователя"""
    permission_classes = [IsAuthenticated]
    
    def post(self, request):
        request.user.last_seen = timezone.now()
        request.user.save(update_fields=['last_seen'])
        return Response({'message': 'updated'})


class TopUsersView(generics.ListAPIView):
    """Топ пользователей по количеству созданных тестов"""
    permission_classes = [AllowAny]
    serializer_class = UserSerializer
    
    def get_queryset(self):
        from tests.models import Test, TestAttempt
        from django.db.models import Count, Q
        
        users = User.objects.annotate(
            created_tests=Count('tests', filter=Q(tests__is_survey=False), distinct=True),
            completed_tests=Count('test_attempts', filter=Q(test_attempts__is_passed=True, test_attempts__test__is_survey=False), distinct=True)
        ).order_by('-created_tests')[:10]
        
        return users


class SendFriendRequestView(APIView):
    """Отправка заявки в друзья"""
    permission_classes = [IsAuthenticated]
    
    def post(self, request, user_id):
        try:
            to_user = User.objects.get(id=user_id)
            from_user = request.user
            
            if from_user == to_user:
                return Response(
                    {'error': 'Нельзя добавить самого себя в друзья'},
                    status=status.HTTP_400_BAD_REQUEST
                )
            
            if from_user in to_user.friends.all():
                return Response(
                    {'error': 'Вы уже друзья'},
                    status=status.HTTP_400_BAD_REQUEST
                )
            
            existing_request = FriendRequest.objects.filter(
                from_user=from_user, 
                to_user=to_user
            ).first()
            
            if existing_request:
                if existing_request.status == 'pending':
                    return Response(
                        {'error': 'Заявка уже отправлена'},
                        status=status.HTTP_400_BAD_REQUEST
                    )
                elif existing_request.status == 'rejected':
                    existing_request.status = 'pending'
                    existing_request.save()
                    return Response({
                        'message': 'Заявка отправлена повторно',
                        'request_id': existing_request.id
                    }, status=status.HTTP_200_OK)
            
            incoming_request = FriendRequest.objects.filter(
                from_user=to_user,
                to_user=from_user,
                status='pending'
            ).first()
            
            if incoming_request:
                incoming_request.status = 'accepted'
                incoming_request.save()
                from_user.friends.add(to_user)
                to_user.friends.add(from_user)
                return Response({
                    'message': 'Заявка принята автоматически',
                    'is_friend': True
                }, status=status.HTTP_200_OK)
            
            friend_request = FriendRequest.objects.create(
                from_user=from_user,
                to_user=to_user,
                status='pending'
            )
            
            return Response({
                'message': 'Заявка отправлена',
                'request_id': friend_request.id
            }, status=status.HTTP_201_CREATED)
            
        except User.DoesNotExist:
            return Response(
                {'error': 'Пользователь не найден'},
                status=status.HTTP_404_NOT_FOUND
            )


class AcceptFriendRequestView(APIView):
    """Принятие заявки в друзья"""
    permission_classes = [IsAuthenticated]
    
    def post(self, request, request_id):
        try:
            friend_request = FriendRequest.objects.get(id=request_id, to_user=request.user, status='pending')
            
            friend_request.from_user.friends.add(friend_request.to_user)
            friend_request.to_user.friends.add(friend_request.from_user)
            
            friend_request.status = 'accepted'
            friend_request.save()
            
            return Response({'message': 'Заявка принята'})
            
        except FriendRequest.DoesNotExist:
            return Response(
                {'error': 'Заявка не найдена'},
                status=status.HTTP_404_NOT_FOUND
            )


class RejectFriendRequestView(APIView):
    """Отклонение заявки в друзья"""
    permission_classes = [IsAuthenticated]
    
    def delete(self, request, request_id):
        try:
            friend_request = FriendRequest.objects.get(id=request_id, to_user=request.user, status='pending')
            friend_request.status = 'rejected'
            friend_request.save()
            
            return Response({'message': 'Заявка отклонена'})
            
        except FriendRequest.DoesNotExist:
            return Response(
                {'error': 'Заявка не найдена'},
                status=status.HTTP_404_NOT_FOUND
            )


class GetFriendsView(APIView):
    """Получение списка друзей текущего пользователя"""
    permission_classes = [IsAuthenticated]
    
    def get(self, request):
        friends = request.user.friends.all()
        serializer = UserSerializer(friends, many=True)
        return Response(serializer.data)


class GetFriendRequestsView(APIView):
    """Получение списка входящих заявок в друзья"""
    permission_classes = [IsAuthenticated]
    
    def get(self, request):
        requests = FriendRequest.objects.filter(to_user=request.user, status='pending')
        
        data = []
        for req in requests:
            data.append({
                'id': req.id,
                'from_user': UserSerializer(req.from_user).data,
                'created_at': req.created_at
            })
        
        return Response(data)


class CheckFriendStatusView(APIView):
    """Проверка статуса дружбы с пользователем"""
    permission_classes = [IsAuthenticated]
    
    def get(self, request, user_id):
        try:
            target_user = User.objects.get(id=user_id)
            
            is_friend = target_user in request.user.friends.all()
            
            has_pending_request = FriendRequest.objects.filter(
                from_user=request.user, 
                to_user=target_user, 
                status='pending'
            ).exists()
            
            return Response({
                'is_friend': is_friend,
                'is_friend_request_sent': has_pending_request
            })
            
        except User.DoesNotExist:
            return Response(
                {'error': 'Пользователь не найден'},
                status=status.HTTP_404_NOT_FOUND
            )


class RemoveFriendView(APIView):
    """Удаление пользователя из друзей"""
    permission_classes = [IsAuthenticated]
    
    def delete(self, request, user_id):
        try:
            friend = User.objects.get(id=user_id)
            request.user.friends.remove(friend)
            friend.friends.remove(request.user)
            return Response({'message': 'Друг удалён'})
        except User.DoesNotExist:
            return Response({'error': 'Пользователь не найден'}, status=404)


class CancelFriendRequestView(APIView):
    """Отмена отправленной заявки в друзья"""
    permission_classes = [IsAuthenticated]
    
    def delete(self, request, user_id):
        try:
            to_user = User.objects.get(id=user_id)
            friend_request = FriendRequest.objects.filter(
                from_user=request.user, 
                to_user=to_user, 
                status='pending'
            ).first()
            
            if friend_request:
                friend_request.delete()
                return Response({'message': 'Заявка отменена'})
            return Response({'error': 'Заявка не найдена'}, status=404)
        except User.DoesNotExist:
            return Response({'error': 'Пользователь не найден'}, status=404)


class GetUserFriendsView(APIView):
    """Получение списка друзей конкретного пользователя"""
    permission_classes = [AllowAny]
    
    def get(self, request, user_id):
        try:
            user = User.objects.get(id=user_id)
            friends = user.friends.all()
            serializer = UserSerializer(friends, many=True)
            return Response(serializer.data)
        except User.DoesNotExist:
            return Response(
                {'error': 'Пользователь не найден'},
                status=status.HTTP_404_NOT_FOUND
            )


class UserCompletedTestsView(APIView):
    """Получение списка пройденных тестов пользователя"""
    
    def get(self, request, user_id):
        try:
            user = User.objects.get(id=user_id)
            from tests.models import TestAttempt
            from django.db.models import Max
            
            attempts = TestAttempt.objects.filter(
                user=user, 
                is_passed=True
            ).values('test_id').annotate(
                last_attempt=Max('finished_at')
            ).order_by('-last_attempt')
            
            data = []
            for attempt in attempts:
                test_attempt = TestAttempt.objects.filter(
                    test_id=attempt['test_id'],
                    finished_at=attempt['last_attempt']
                ).first()
                
                if test_attempt:
                    data.append({
                        'id': test_attempt.test.id,
                        'name': test_attempt.test.title,
                        'type': 'опрос' if test_attempt.test.is_survey else 'тест',
                        'author': test_attempt.test.author.full_name or test_attempt.test.author.login,
                        'author_id': test_attempt.test.author.id,
                        'questions': test_attempt.test.test_questions.count(),
                        'result': f"{test_attempt.score}%",
                        'date': test_attempt.finished_at.strftime('%d.%m.%Y') if test_attempt.finished_at else '',
                        'time': f"{test_attempt.test.time_limit} мин" if test_attempt.test.time_limit else 'без ограничения'
                    })
            
            return Response(data)
        except User.DoesNotExist:
            return Response({'error': 'Пользователь не найден'}, status=404)


class UserCreatedTestsView(APIView):
    """Получение списка созданных тестов пользователя (только открытые)"""
    permission_classes = [AllowAny]
    
    def get(self, request, user_id):
        try:
            user = User.objects.get(id=user_id)
            from tests.models import Test
            # ДОЛЖНО БЫТЬ is_open=True
            tests = Test.objects.filter(author=user, is_open=True)
            
            data = []
            for test in tests:
                data.append({
                    'id': test.id,
                    'title': test.title,
                    'is_survey': test.is_survey,
                    'questions_count': test.test_questions.count(),
                    'attempts_count': test.attempts.filter(is_passed=True).count(),
                    'average_rating': test.ratings.aggregate(avg=Avg('rating'))['avg'] or 0,
                    'description': test.description or 'Нет описания',
                    'is_open': test.is_open
                })
            return Response(data)
        except User.DoesNotExist:
            return Response({'error': 'Пользователь не найден'}, status=404)


class UploadAvatarView(APIView):
    """Загрузка аватара пользователя"""
    permission_classes = [IsAuthenticated]
    
    def post(self, request):
        image_file = request.FILES.get('avatar')
        
        if not image_file:
            return Response({'error': 'Файл не найден'}, status=status.HTTP_400_BAD_REQUEST)
        
        allowed_types = ['image/jpeg', 'image/png', 'image/gif', 'image/webp']
        if image_file.content_type not in allowed_types:
            return Response(
                {'error': f'Неподдерживаемый формат. Поддерживаются: {", ".join(allowed_types)}'}, 
                status=status.HTTP_400_BAD_REQUEST
            )
        
        upload_dir = os.path.join(settings.MEDIA_ROOT, 'avatars')
        os.makedirs(upload_dir, exist_ok=True)
        
        ext = os.path.splitext(image_file.name)[1]
        filename = f"avatars/{request.user.id}_{uuid.uuid4().hex}{ext}"
        
        saved_path = default_storage.save(filename, image_file)
        file_url = default_storage.url(saved_path)
        
        request.user.avatar = file_url
        request.user.save(update_fields=['avatar'])
        
        return Response({
            'url': file_url,
            'filename': filename
        }, status=status.HTTP_201_CREATED)


class ReportUserView(APIView):
    """Жалоба на пользователя"""
    permission_classes = [IsAuthenticated]
    
    def post(self, request):
        target_id = request.data.get('target_id')
        reason = request.data.get('reason')
        
        if not target_id:
            return Response(
                {'error': 'ID пользователя обязателен'},
                status=status.HTTP_400_BAD_REQUEST
            )
        
        if not reason:
            return Response(
                {'error': 'Причина жалобы обязательна'},
                status=status.HTTP_400_BAD_REQUEST
            )
        
        try:
            target_user = User.objects.get(id=target_id)
        except User.DoesNotExist:
            return Response(
                {'error': 'Пользователь не найден'},
                status=status.HTTP_404_NOT_FOUND
            )
        
        # Создаём жалобу (если у вас есть модель Report)
        # Если модели нет, создайте её или используйте существующую
        
        from reports.models import Report  # если есть модель Report
        
        report = Report.objects.create(
            reporter=request.user,
            reported_user=target_user,
            reason=reason,
            created_at=timezone.now()
        )
        
        return Response({
            'message': 'Жалоба отправлена',
            'report_id': report.id
        }, status=status.HTTP_201_CREATED)

class MuteUserView(APIView):
    """Замутить пользователя (запрет на комментарии)"""
    permission_classes = [IsAuthenticated]
    
    def post(self, request, user_id):
        if request.user.status != 'admin':
            return Response({'error': 'Нет прав'}, status=403)
        
        try:
            user = User.objects.get(id=user_id)
            reason = request.data.get('reason', '')
            duration = request.data.get('duration')
            duration_value = request.data.get('duration_value')
            duration_unit = request.data.get('duration_unit')
            
            # Устанавливаем флаг is_muted в True
            user.is_muted = True
            user.mute_reason = reason
            
            if duration == 'permanent':
                user.mute_permanent = True
                user.mute_until = None
            else:
                user.mute_permanent = False
                if duration_value and duration_unit:
                    if duration_unit == 'hours':
                        delta = timedelta(hours=int(duration_value))
                    elif duration_unit == 'days':
                        delta = timedelta(days=int(duration_value))
                    elif duration_unit == 'weeks':
                        delta = timedelta(weeks=int(duration_value))
                    elif duration_unit == 'months':
                        delta = timedelta(days=int(duration_value) * 30)
                    else:
                        delta = timedelta(days=1)
                    user.mute_until = timezone.now() + delta
            
            user.save()
            
            # Проверяем что сохранилось
            print(f"User {user.login} muted: {user.is_muted}, until: {user.mute_until}")
            
            if duration == 'permanent':
                mute_text = "перманентно"
            else:
                mute_text = f"до {user.mute_until.strftime('%d.%m.%Y %H:%M')}" if user.mute_until else "навсегда"
            
            return Response({'message': f'Пользователь {user.login} замучен {mute_text}'})
            
        except User.DoesNotExist:
            return Response({'error': 'Пользователь не найден'}, status=404)


class UnmuteUserView(APIView):
    """Размутить пользователя"""
    permission_classes = [IsAuthenticated]
    
    def post(self, request, user_id):
        if request.user.status != 'admin':
            return Response({'error': 'Нет прав'}, status=403)
        
        try:
            user = User.objects.get(id=user_id)
            user.is_muted = False
            user.mute_reason = ''
            user.mute_until = None
            user.mute_permanent = False
            user.save()
            
            print(f"User {user.login} unmuted: {user.is_muted}")
            
            return Response({'message': f'Пользователь {user.login} размучен'})
        except User.DoesNotExist:
            return Response({'error': 'Пользователь не найден'}, status=404)


class BanUserView(APIView):
    """Забанить пользователя (запрет на создание тестов и комментарии)"""
    permission_classes = [IsAuthenticated]
    
    def post(self, request, user_id):
        if request.user.status != 'admin':
            return Response({'error': 'Нет прав'}, status=403)
        
        try:
            user = User.objects.get(id=user_id)
            reason = request.data.get('reason', '')
            duration = request.data.get('duration')
            duration_value = request.data.get('duration_value')
            duration_unit = request.data.get('duration_unit')
            
            # Бан
            user.is_banned = True
            user.ban_reason = reason
            
            # Также мутим при бане
            user.is_muted = True
            user.mute_reason = reason
            
            if duration == 'permanent':
                user.ban_permanent = True
                user.ban_until = None
                user.mute_permanent = True
                user.mute_until = None
            else:
                user.ban_permanent = False
                user.mute_permanent = False
                if duration_value and duration_unit:
                    if duration_unit == 'hours':
                        delta = timedelta(hours=int(duration_value))
                    elif duration_unit == 'days':
                        delta = timedelta(days=int(duration_value))
                    elif duration_unit == 'weeks':
                        delta = timedelta(weeks=int(duration_value))
                    elif duration_unit == 'months':
                        delta = timedelta(days=int(duration_value) * 30)
                    else:
                        delta = timedelta(days=1)
                    ban_until_time = timezone.now() + delta
                    user.ban_until = ban_until_time
                    user.mute_until = ban_until_time
            
            user.save()
            
            ban_text = "перманентно" if duration == 'permanent' else f"до {user.ban_until.strftime('%d.%m.%Y %H:%M')}"
            return Response({'message': f'Пользователь {user.login} забанен {ban_text}'})
            
        except User.DoesNotExist:
            return Response({'error': 'Пользователь не найден'}, status=404)


class UnbanUserView(APIView):
    """Разбанить пользователя (и снять мут)"""
    permission_classes = [IsAuthenticated]
    
    def post(self, request, user_id):
        if request.user.status != 'admin':
            return Response({'error': 'Нет прав'}, status=403)
        
        try:
            user = User.objects.get(id=user_id)
            
            # Снимаем бан
            user.is_banned = False
            user.ban_reason = ''
            user.ban_until = None
            user.ban_permanent = False
            
            # Снимаем мут
            user.is_muted = False
            user.mute_reason = ''
            user.mute_until = None
            user.mute_permanent = False
            
            user.save()
            return Response({'message': f'Пользователь {user.login} разбанен и размучен'})
        except User.DoesNotExist:
            return Response({'error': 'Пользователь не найден'}, status=404)