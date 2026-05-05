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

User = get_user_model()

class UserSearchView(APIView):
    """Поиск пользователей по нику"""
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
    queryset = User.objects.all()
    serializer_class = RegisterSerializer
    permission_classes = [AllowAny]

class LoginView(APIView):
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
    permission_classes = [IsAuthenticated]
    
    def get(self, request):
        serializer = UserSerializer(request.user)
        return Response(serializer.data)
    
    def patch(self, request):
        print("Полученные данные:", request.data)
        print("Тип avatar:", type(request.data.get('avatar')))
        print("Длина avatar:", len(request.data.get('avatar', '')))
        
        serializer = ProfileUpdateSerializer(request.user, data=request.data, partial=True)
        if serializer.is_valid():
            serializer.save()
            request.user.last_seen = timezone.now()
            request.user.save(update_fields=['last_seen'])
            return Response(UserSerializer(request.user).data)
        print("Ошибки валидации:", serializer.errors)
        return Response(serializer.errors, status=status.HTTP_400_BAD_REQUEST)

class UserProfileView(APIView):
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
    permission_classes = [IsAuthenticated]
    
    def post(self, request):
        request.user.last_seen = timezone.now()
        request.user.save(update_fields=['last_seen'])
        return Response({'message': 'updated'})

class TopUsersView(generics.ListAPIView):
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
    """Отправить заявку в друзья"""
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
            
            # Проверяем, не являются ли уже друзьями
            if from_user in to_user.friends.all():
                return Response(
                    {'error': 'Вы уже друзья'},
                    status=status.HTTP_400_BAD_REQUEST
                )
            
            # Проверяем, есть ли уже заявка
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
                    # Если была отклонена, обновляем статус
                    existing_request.status = 'pending'
                    existing_request.save()
                    return Response({
                        'message': 'Заявка отправлена повторно',
                        'request_id': existing_request.id
                    }, status=status.HTTP_200_OK)
            
            # Проверяем, есть ли входящая заявка от этого пользователя
            incoming_request = FriendRequest.objects.filter(
                from_user=to_user,
                to_user=from_user,
                status='pending'
            ).first()
            
            if incoming_request:
                # Если есть входящая заявка, сразу принимаем её
                incoming_request.status = 'accepted'
                incoming_request.save()
                from_user.friends.add(to_user)
                to_user.friends.add(from_user)
                return Response({
                    'message': 'Заявка принята автоматически',
                    'is_friend': True
                }, status=status.HTTP_200_OK)
            
            # Создаём новую заявку
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
    """Принять заявку в друзья"""
    permission_classes = [IsAuthenticated]
    
    def post(self, request, request_id):
        try:
            friend_request = FriendRequest.objects.get(id=request_id, to_user=request.user, status='pending')
            
            # Добавляем в друзья
            friend_request.from_user.friends.add(friend_request.to_user)
            friend_request.to_user.friends.add(friend_request.from_user)
            
            # Обновляем статус заявки
            friend_request.status = 'accepted'
            friend_request.save()
            
            return Response({'message': 'Заявка принята'})
            
        except FriendRequest.DoesNotExist:
            return Response(
                {'error': 'Заявка не найдена'},
                status=status.HTTP_404_NOT_FOUND
            )

class RejectFriendRequestView(APIView):
    """Отклонить заявку в друзья"""
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
    """Получить список друзей"""
    permission_classes = [IsAuthenticated]
    
    def get(self, request):
        friends = request.user.friends.all()
        serializer = UserSerializer(friends, many=True)
        return Response(serializer.data)

class GetFriendRequestsView(APIView):
    """Получить входящие заявки в друзья"""
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
    """Проверить статус дружбы с пользователем"""
    permission_classes = [IsAuthenticated]
    
    def get(self, request, user_id):
        try:
            target_user = User.objects.get(id=user_id)
            
            # Проверяем, являются ли друзьями
            is_friend = target_user in request.user.friends.all()
            
            # Проверяем, есть ли исходящая заявка
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
    """Удалить из друзей"""
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
    """Отменить отправленную заявку"""
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
    """Получить друзей конкретного пользователя"""
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
    def get(self, request, user_id):
        try:
            user = User.objects.get(id=user_id)
            from tests.models import TestAttempt
            from django.db.models import Max
            
            # Берем последнюю попытку по каждому тесту
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
    """Получить созданные тесты пользователя"""
    permission_classes = [AllowAny]
    
    def get(self, request, user_id):
        try:
            user = User.objects.get(id=user_id)
            from tests.models import Test
            tests = Test.objects.filter(author=user, is_open=True)
            
            data = []
            for test in tests:
                data.append({
                    'id': test.id,
                    'name': test.title,
                    'type': 'опрос' if test.is_survey else 'тест',
                    'questions': test.test_questions.count(),
                    'completed': test.attempts.filter(is_passed=True).count(),
                    'rating': test.ratings.aggregate(avg=Avg('rating'))['avg'] or 0,
                    'description': test.description or 'Нет описания'
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
        
        # Создаём папку для аватаров
        upload_dir = os.path.join(settings.MEDIA_ROOT, 'avatars')
        os.makedirs(upload_dir, exist_ok=True)
        
        ext = os.path.splitext(image_file.name)[1]
        filename = f"avatars/{request.user.id}_{uuid.uuid4().hex}{ext}"
        
        # Сохраняем файл
        saved_path = default_storage.save(filename, image_file)
        file_url = default_storage.url(saved_path)
        
        # Обновляем аватар пользователя
        request.user.avatar = file_url
        request.user.save(update_fields=['avatar'])
        
        return Response({
            'url': file_url,
            'filename': filename
        }, status=status.HTTP_201_CREATED)