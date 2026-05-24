from rest_framework import generics, status, viewsets, filters
from rest_framework.response import Response
from rest_framework.permissions import IsAuthenticated, AllowAny
from rest_framework.views import APIView
from rest_framework.decorators import action
from django.conf import settings
from django.db.models import Q, Count, Avg
from django.contrib.auth import get_user_model
from django.utils import timezone
import django.db.models as models
import uuid
from django.core.files.storage import default_storage
from django.core.files.base import ContentFile
import os
from .models import Pool, Question, Answer, PoolQuestion, Test, TestQuestion, TestAttempt, TestRating, TestComment, Report
from .serializers import (
    PoolSerializer, PoolDetailSerializer, QuestionSerializer, 
    QuestionCreateSerializer, PoolQuestionSerializer, TestSerializer,
    TestDetailSerializer, TestCreateSerializer, TestAttemptSerializer,
    TestCommentSerializer, TestRatingSerializer, ReportSerializer, UserSerializer
)

User = get_user_model()


# ==================== ПОИСК И ЗАГРУЗКИ ====================

class TestSearchView(generics.ListAPIView):
    """Поиск и фильтрация тестов (только открытые)"""
    permission_classes = [AllowAny]
    serializer_class = TestSerializer
    
    def get_queryset(self):
        queryset = Test.objects.filter(is_open=True)
        
        search = self.request.query_params.get('search', None)
        if search:
            queryset = queryset.filter(title__icontains=search)
        
        sort = self.request.query_params.get('sort', None)
        if sort == 'new':
            queryset = queryset.order_by('-created_at')
        elif sort == 'old':
            queryset = queryset.order_by('created_at')
        elif sort == 'popular':
            # Сортировка по среднему рейтингу
            queryset = queryset.annotate(
                avg_rating=models.Avg('ratings__rating')
            ).order_by(models.functions.Coalesce('avg_rating', 0).desc(), '-created_at')
        elif sort == 'az':
            queryset = queryset.order_by('title')
        
        type_filter = self.request.query_params.get('type', None)
        if type_filter == 'test':
            queryset = queryset.filter(is_survey=False)
        elif type_filter == 'survey':
            queryset = queryset.filter(is_survey=True)
        
        topics = self.request.query_params.getlist('topics', [])
        if topics:
            queryset = queryset.filter(topics__overlap=topics)
        
        return queryset.distinct()


class UploadImageView(APIView):
    """Загрузка изображений для вопросов и тестов"""
    permission_classes = [IsAuthenticated]
    
    def post(self, request):
        image_file = request.FILES.get('image')
        image_type = request.data.get('type', 'question')
        
        if not image_file:
            return Response({'error': 'Файл не найден'}, status=status.HTTP_400_BAD_REQUEST)
        
        allowed_types = ['image/jpeg', 'image/png', 'image/gif', 'image/webp']
        if image_file.content_type not in allowed_types:
            return Response(
                {'error': f'Неподдерживаемый формат. Поддерживаются: {", ".join(allowed_types)}'}, 
                status=status.HTTP_400_BAD_REQUEST
            )
        
        folder = 'questions' if image_type == 'question' else 'tests'
        upload_dir = os.path.join(settings.MEDIA_ROOT, folder)
        os.makedirs(upload_dir, exist_ok=True)
        
        ext = os.path.splitext(image_file.name)[1]
        filename = f"{folder}/{uuid.uuid4().hex}{ext}"
        
        saved_path = default_storage.save(filename, ContentFile(image_file.read()))
        file_url = default_storage.url(saved_path)
        
        return Response({
            'url': file_url,
            'filename': filename
        }, status=status.HTTP_201_CREATED)


# ==================== ВОПРОСЫ ====================

class QuestionViewSet(viewsets.ModelViewSet):
    """CRUD для вопросов (только свои)"""
    permission_classes = [IsAuthenticated]
    
    def get_queryset(self):
        return Question.objects.filter(author=self.request.user).select_related('author')
    
    def get_serializer_class(self):
        if self.action == 'create':
            return QuestionCreateSerializer
        return QuestionSerializer
    
    def perform_create(self, serializer):
        serializer.save(author=self.request.user)


class QuestionBatchCreateView(APIView):
    """Массовое создание вопросов"""
    permission_classes = [IsAuthenticated]
    
    def post(self, request):
        questions_data = request.data.get('questions', [])
        
        if not questions_data:
            return Response({'error': 'Нет данных для создания'}, status=status.HTTP_400_BAD_REQUEST)
        
        created_questions = []
        errors = []
        
        for idx, question_data in enumerate(questions_data):
            serializer = QuestionCreateSerializer(
                data=question_data,
                context={'request': request}
            )
            
            if serializer.is_valid():
                question = serializer.save()
                created_questions.append({
                    'id': question.id,
                    'text': question.text
                })
            else:
                errors.append({
                    'index': idx,
                    'errors': serializer.errors
                })
        
        return Response({
            'created': created_questions,
            'errors': errors,
            'total_created': len(created_questions)
        }, status=status.HTTP_201_CREATED if created_questions else status.HTTP_400_BAD_REQUEST)


# ==================== ПУЛЫ ВОПРОСОВ ====================

class PoolViewSet(viewsets.ModelViewSet):
    """CRUD для пулов вопросов"""
    permission_classes = [IsAuthenticated]
    
    def get_queryset(self):
        return Pool.objects.filter(user=self.request.user)
    
    def get_serializer_class(self):
        if self.action == 'retrieve':
            return PoolDetailSerializer
        return PoolSerializer
    
    def perform_create(self, serializer):
        serializer.save(user=self.request.user)
    
    @action(detail=True, methods=['post'], url_path='questions')
    def add_question(self, request, pk=None):
        """Добавление вопроса в пул"""
        pool = self.get_object()
        question_id = request.data.get('question_id')
        
        if not question_id:
            last_question = Question.objects.filter(author=request.user).order_by('-id').first()
            if last_question:
                question_id = last_question.id
            else:
                return Response(
                    {'error': 'No question found'}, 
                    status=status.HTTP_400_BAD_REQUEST
                )
        
        try:
            question = Question.objects.get(id=question_id)
        except Question.DoesNotExist:
            return Response(
                {'error': 'Question not found'}, 
                status=status.HTTP_404_NOT_FOUND
            )
        
        pool_question, created = PoolQuestion.objects.get_or_create(
            pool=pool, question=question
        )
        
        if created:
            return Response(
                {'message': 'Question added to pool'}, 
                status=status.HTTP_201_CREATED
            )
        return Response(
            {'message': 'Question already in pool'}, 
            status=status.HTTP_200_OK
        )
    
    @action(detail=True, methods=['delete'], url_path='questions/(?P<question_id>[^/.]+)')
    def remove_question(self, request, pk=None, question_id=None):
        """Удаление вопроса из пула"""
        pool = self.get_object()
        
        try:
            pool_question = PoolQuestion.objects.get(
                pool=pool, question_id=question_id
            )
            pool_question.delete()
            return Response({'message': 'Question removed from pool'})
        except PoolQuestion.DoesNotExist:
            return Response(
                {'error': 'Question not found in pool'}, 
                status=status.HTTP_404_NOT_FOUND
            )


class AvailablePoolsView(generics.ListAPIView):
    """Список доступных пулов текущего пользователя"""
    permission_classes = [IsAuthenticated]
    serializer_class = PoolSerializer
    
    def get_queryset(self):
        return Pool.objects.filter(user=self.request.user)


# ==================== ТЕСТЫ ====================

class TestViewSet(viewsets.ModelViewSet):
    """CRUD для тестов"""
    permission_classes = [AllowAny]
    
    def get_queryset(self):
        return Test.objects.filter(is_open=True).distinct()
    
    def get_permissions(self):
            if self.action == 'create':
                return [IsAuthenticated()]
            return [AllowAny()]
    
    def get_serializer_class(self):
        if self.action == 'create':
            return TestCreateSerializer
        if self.action == 'retrieve':
            return TestDetailSerializer
        return TestSerializer
    
    def retrieve(self, request, *args, **kwargs):
        """Получение теста с проверкой доступа к приватным"""
        try:
            test = Test.objects.get(id=kwargs['pk'])
        except Test.DoesNotExist:
            return Response({'error': 'Тест не найден'}, status=status.HTTP_404_NOT_FOUND)
        
        if not test.is_open:
            has_access = False
            
            if request.user.is_authenticated and request.user == test.author:
                has_access = True
            
            access_token = request.query_params.get('token', None)
            if test.access_token and access_token == test.access_token:
                has_access = True
            
            if request.user.is_authenticated:
                existing_attempt = TestAttempt.objects.filter(
                    user=request.user,
                    test=test,
                    finished_at__isnull=True
                ).first()
                if existing_attempt:
                    has_access = True
            
            if not has_access:
                return Response(
                    {'error': 'Этот тест приватный. Доступ возможен только по ссылке от автора.'},
                    status=status.HTTP_403_FORBIDDEN
                )
        
        serializer = TestDetailSerializer(test)
        return Response(serializer.data)
    
    def perform_create(self, serializer):
        access_token = str(uuid.uuid4())[:8] if not serializer.validated_data.get('is_open', True) else None
        serializer.save(author=self.request.user, access_token=access_token)


class UserTestsView(generics.ListAPIView):
    """Список тестов текущего пользователя (автора)"""
    permission_classes = [IsAuthenticated]
    serializer_class = TestSerializer
    
    def get_queryset(self):
        return Test.objects.filter(author=self.request.user)


class MyTestsView(generics.ListAPIView):
    """Все тесты автора (включая приватные) - только для самого автора"""
    permission_classes = [IsAuthenticated]
    serializer_class = TestSerializer
    
    def get_queryset(self):
        user_id = self.kwargs.get('user_id')
        if not self.request.user.is_authenticated or self.request.user.id != user_id:
            return Test.objects.none()
        return Test.objects.filter(author_id=user_id).annotate(
            attempts_count=Count('attempts', distinct=True),
            average_rating=Avg('ratings__rating')
        )


class CreatedTestsView(generics.ListAPIView):
    """Открытые тесты автора (для просмотра другими)"""
    permission_classes = [AllowAny]
    serializer_class = TestSerializer
    
    def get_queryset(self):
        user_id = self.kwargs.get('user_id')
        return Test.objects.filter(
            author_id=user_id, 
            is_open=True  # ТОЛЬКО ОТКРЫТЫЕ
        ).annotate(
            attempts_count=Count('attempts', distinct=True),
            average_rating=Avg('ratings__rating')
        )


class CompletedTestsView(generics.ListAPIView):
    """Пройденные тесты пользователя"""
    permission_classes = [AllowAny]
    serializer_class = TestAttemptSerializer
    
    def get_queryset(self):
        user_id = self.kwargs.get('user_id')
        return TestAttempt.objects.filter(
            user_id=user_id, 
            finished_at__isnull=False
        ).select_related('test').order_by('-finished_at')
    
    def list(self, request, *args, **kwargs):
        queryset = self.get_queryset()
        serializer = self.get_serializer(queryset, many=True)
        
        data = []
        for item, attempt in zip(serializer.data, queryset):
            item['is_open'] = attempt.test.is_open
            item['started_at'] = attempt.started_at.isoformat() if attempt.started_at else None
            item['finished_at'] = attempt.finished_at.isoformat() if attempt.finished_at else None
            data.append(item)
        
        return Response(data)


# ==================== ПРОХОЖДЕНИЕ ТЕСТОВ ====================

class StartTestView(APIView):
    """Начало прохождения теста (создание попытки)"""
    permission_classes = [AllowAny]
    
    def post(self, request, test_id):
        try:
            test = Test.objects.get(id=test_id)
            
            if not test.is_open:
                access_token = request.data.get('access_token', None) or request.query_params.get('token', None)
                
                has_access = False
                
                if request.user.is_authenticated and request.user == test.author:
                    has_access = True
                
                if test.access_token and access_token == test.access_token:
                    has_access = True
                
                if request.user.is_authenticated:
                    existing_attempt = TestAttempt.objects.filter(
                        user=request.user,
                        test=test,
                        finished_at__isnull=True
                    ).first()
                    if existing_attempt:
                        has_access = True
                
                if not has_access:
                    return Response(
                        {'error': 'Этот тест приватный. Доступ возможен только по ссылке от автора.'},
                        status=status.HTTP_403_FORBIDDEN
                    )
            
            if test.attempts_limit > 0:
                if request.user.is_authenticated:
                    attempts_count = TestAttempt.objects.filter(
                        user=request.user, 
                        test=test
                    ).count()
                    if attempts_count >= test.attempts_limit:
                        return Response(
                            {'error': f'Достигнут лимит попыток ({test.attempts_limit})'}, 
                            status=status.HTTP_400_BAD_REQUEST
                        )
            
            attempt = TestAttempt.objects.create(
                user=request.user if request.user.is_authenticated else None,
                test=test,
                score=0,
                is_passed=False,
                answers={}
            )
            
            return Response({
                'attempt_id': attempt.id,
                'test_id': test.id,
                'questions_count': test.test_questions.count(),
                'time_limit': test.time_limit,
                'is_survey': test.is_survey
            })
            
        except Test.DoesNotExist:
            return Response({'error': 'Тест не найден'}, status=status.HTTP_404_NOT_FOUND)


class GetQuestionView(APIView):
    """Получение вопроса по индексу"""
    permission_classes = [AllowAny]
    
    def get(self, request, test_id, question_index):
        try:
            test = Test.objects.get(id=test_id)
            test_questions = test.test_questions.select_related('question').all().order_by('order_index')
            
            if question_index < 1 or question_index > len(test_questions):
                return Response({'error': 'Вопрос не найден'}, status=status.HTTP_404_NOT_FOUND)
            
            test_question = test_questions[question_index - 1]
            question = test_question.question
            
            answers = list(question.answers.values('id', 'text', 'is_correct', 'order_index'))
            
            image_url = None
            if question.image:
                if hasattr(question.image, 'url'):
                    image_url = question.image.url
                else:
                    image_url = question.image
            
            return Response({
                'question_id': question.id,
                'question_text': question.text,
                'question_image': image_url,
                'is_text_input': question.is_text_input,
                'text_answer': question.text_answer,
                'answers': answers,
                'current': question_index,
                'total': len(test_questions),
                'test_title': test.title,
                'test_id': test.id,
                'time_limit': test.time_limit,
                'is_survey': test.is_survey
            })
            
        except Test.DoesNotExist:
            return Response({'error': 'Тест не найден'}, status=status.HTTP_404_NOT_FOUND)


class SubmitAnswerView(APIView):
    """Отправка ответа на вопрос"""
    permission_classes = [AllowAny]
    
    def post(self, request, attempt_id, question_id):
        try:
            if request.user.is_authenticated:
                attempt = TestAttempt.objects.get(id=attempt_id, user=request.user)
            else:
                attempt = TestAttempt.objects.get(id=attempt_id)
            
            question = Question.objects.get(id=question_id)
            test = attempt.test
            
            answer_data = request.data.get('answer')
            is_correct = False
            
            if test.is_survey:
                is_correct = True
                user_answer_value = answer_data
            elif question.is_text_input:
                correct_answer = question.text_answer.lower().strip()
                user_answer = str(answer_data).lower().strip()
                is_correct = user_answer == correct_answer
                user_answer_value = user_answer
            else:
                user_answer = answer_data
                try:
                    selected_answer = Answer.objects.get(id=user_answer, question=question)
                    is_correct = selected_answer.is_correct
                    user_answer_value = selected_answer.text
                except Answer.DoesNotExist:
                    user_answer_value = None
            
            answers = attempt.answers
            answers[str(question_id)] = {
                'answer': user_answer_value,
                'is_correct': is_correct,
                'question_text': question.text
            }
            attempt.answers = answers
            attempt.save()
            
            return Response({
                'is_correct': is_correct,
                'correct_answer': question.text_answer if question.is_text_input else None
            })
            
        except TestAttempt.DoesNotExist:
            return Response({'error': 'Попытка не найдена'}, status=status.HTTP_404_NOT_FOUND)
        except Question.DoesNotExist:
            return Response({'error': 'Вопрос не найден'}, status=status.HTTP_404_NOT_FOUND)


class FinishTestView(APIView):
    """Завершение теста и расчёт результата"""
    permission_classes = [AllowAny]
    
    def post(self, request, attempt_id):
        try:
            if request.user.is_authenticated:
                attempt = TestAttempt.objects.get(id=attempt_id, user=request.user)
            else:
                attempt = TestAttempt.objects.get(id=attempt_id)
            
            test = attempt.test
            
            total_questions = test.test_questions.count()
            correct_answers = 0
            
            if test.is_survey:
                score = 0
                is_passed = True
            else:
                for key, value in attempt.answers.items():
                    if value.get('is_correct'):
                        correct_answers += 1
                
                score = int((correct_answers / total_questions) * 100) if total_questions > 0 else 0
                is_passed = score >= test.passing_score
            
            attempt.score = score
            attempt.is_passed = is_passed
            attempt.finished_at = timezone.now()
            attempt.save()
            
            for question_id in attempt.answers.keys():
                try:
                    question = Question.objects.get(id=question_id)
                    question.usage_count += 1
                    question.save(update_fields=['usage_count'])
                except Question.DoesNotExist:
                    pass
            
            return Response({
                'score': score,
                'is_passed': is_passed,
                'total_questions': total_questions,
                'correct_answers': correct_answers,
                'test_id': test.id,
                'test_title': test.title,
                'is_survey': test.is_survey
            })
            
        except TestAttempt.DoesNotExist:
            return Response({'error': 'Попытка не найдена'}, status=status.HTTP_404_NOT_FOUND)


class GetAttemptView(APIView):
    """Получение информации о попытке"""
    permission_classes = [AllowAny]
    
    def get(self, request, attempt_id):
        try:
            attempt = TestAttempt.objects.get(id=attempt_id)
            
            answers_list = []
            for q_id, answer_data in attempt.answers.items():
                try:
                    question = Question.objects.get(id=q_id)
                    answers_list.append({
                        'question_id': q_id,
                        'question_text': answer_data.get('question_text', question.text),
                        'user_answer': answer_data.get('answer'),
                        'is_correct': answer_data.get('is_correct', False)
                    })
                except Question.DoesNotExist:
                    pass
            
            return Response({
                'id': attempt.id,
                'score': attempt.score,
                'is_passed': attempt.is_passed,
                'answers': answers_list,
                'started_at': attempt.started_at,
                'finished_at': attempt.finished_at,
                'test': {
                    'id': attempt.test.id,
                    'title': attempt.test.title,
                    'passing_score': attempt.test.passing_score,
                    'is_survey': attempt.test.is_survey,
                    'author_info': {
                        'id': attempt.test.author.id,
                        'login': attempt.test.author.login,
                        'full_name': attempt.test.author.full_name
                    }
                }
            })
            
        except TestAttempt.DoesNotExist:
            return Response({'error': 'Попытка не найдена'}, status=status.HTTP_404_NOT_FOUND)


class TestAttemptView(APIView):
    """Сохранение результатов попытки (альтернативный метод)"""
    permission_classes = [IsAuthenticated]
    
    def post(self, request, test_id):
        try:
            test = Test.objects.get(id=test_id)
            
            if test.is_survey:
                score = 0
                is_passed = True
            else:
                score = request.data.get('score', 0)
                is_passed = score >= test.passing_score
            
            answers = request.data.get('answers', {})
            
            attempt = TestAttempt.objects.create(
                user=request.user,
                test=test,
                score=score,
                is_passed=is_passed,
                answers=answers,
                finished_at=request.data.get('finished_at')
            )
            
            if not test.is_survey:
                for question_id in answers.keys():
                    try:
                        question = Question.objects.get(id=question_id)
                        question.usage_count += 1
                        question.save(update_fields=['usage_count'])
                    except Question.DoesNotExist:
                        pass
            
            serializer = TestAttemptSerializer(attempt)
            return Response(serializer.data, status=status.HTTP_201_CREATED)
            
        except Test.DoesNotExist:
            return Response({'error': 'Test not found'}, status=status.HTTP_404_NOT_FOUND)


# ==================== КОММЕНТАРИИ И ОЦЕНКИ ====================

class TestCommentsView(APIView):
    """Получение и создание комментариев к тесту"""
    permission_classes = [AllowAny]
    
    def get(self, request, test_id):
        try:
            test = Test.objects.get(id=test_id)
            comments = test.comments.select_related('user').all()
            serializer = TestCommentSerializer(comments, many=True)
            return Response(serializer.data)
        except Test.DoesNotExist:
            return Response({'error': 'Тест не найден'}, status=status.HTTP_404_NOT_FOUND)
    
    def post(self, request, test_id):
        if not request.user.is_authenticated:
            return Response({'error': 'Требуется авторизация'}, status=status.HTTP_401_UNAUTHORIZED)
        
        try:
            test = Test.objects.get(id=test_id)
            text = request.data.get('text')
            
            if not text or not text.strip():
                return Response({'error': 'Текст комментария не может быть пустым'}, status=status.HTTP_400_BAD_REQUEST)
            
            comment = TestComment.objects.create(
                test=test,
                user=request.user,
                text=text.strip()
            )
            
            serializer = TestCommentSerializer(comment)
            return Response(serializer.data, status=status.HTTP_201_CREATED)
            
        except Test.DoesNotExist:
            return Response({'error': 'Тест не найден'}, status=status.HTTP_404_NOT_FOUND)


class RateTestView(APIView):
    """Оценка теста (рейтинг)"""
    
    def get_permissions(self):
        if self.request.method == 'POST':
            return [IsAuthenticated()]
        return [AllowAny()]
    
    def post(self, request, test_id):
        try:
            test = Test.objects.get(id=test_id)
            rating = request.data.get('rating')
            
            if not rating or rating < 1 or rating > 5:
                return Response({'error': 'Оценка должна быть от 1 до 5'}, status=status.HTTP_400_BAD_REQUEST)
            
            existing_rating = TestRating.objects.filter(test=test, user=request.user).first()
            if existing_rating:
                return Response({
                    'error': 'Вы уже оценили этот тест',
                    'previous_rating': existing_rating.rating
                }, status=status.HTTP_400_BAD_REQUEST)
            
            TestRating.objects.create(
                test=test,
                user=request.user,
                rating=rating
            )
            
            avg_rating = test.ratings.aggregate(avg=models.Avg('rating'))['avg']
            
            return Response({
                'rating': rating,
                'average_rating': round(avg_rating, 1) if avg_rating else 0,
                'ratings_count': test.ratings.count(),
                'message': 'Спасибо за оценку!'
            })
            
        except Test.DoesNotExist:
            return Response({'error': 'Тест не найден'}, status=status.HTTP_404_NOT_FOUND)
    
    def get(self, request, test_id):
        try:
            test = Test.objects.get(id=test_id)
            user_rating = None
            if request.user.is_authenticated:
                user_rating_obj = TestRating.objects.filter(test=test, user=request.user).first()
                if user_rating_obj:
                    user_rating = user_rating_obj.rating
            
            avg_rating = test.ratings.aggregate(avg=models.Avg('rating'))['avg']
            
            return Response({
                'average_rating': round(avg_rating, 1) if avg_rating else 0,
                'ratings_count': test.ratings.count(),
                'user_rating': user_rating
            })
            
        except Test.DoesNotExist:
            return Response({'error': 'Тест не найден'}, status=status.HTTP_404_NOT_FOUND)


# ==================== РЕПОРТЫ (ЖАЛОБЫ) ====================

class ReportUserView(APIView):
    """Жалоба на пользователя"""
    permission_classes = [IsAuthenticated]
    
    def post(self, request):
        target_id = request.data.get('target_id')
        reason = request.data.get('reason')
        comment = request.data.get('comment', '')  # УБЕДИСЬ ЧТО ЭТА СТРОКА ЕСТЬ
        
        print("=== REPORT USER DEBUG ===")
        print(f"target_id: {target_id}")
        print(f"reason: {reason}")
        print(f"comment: {comment}")
        print("========================")
        
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
        
        # Проверяем, не отправлял ли пользователь уже жалобу на этого пользователя
        existing_report = Report.objects.filter(
            user=request.user,
            target_type='user',
            target_id=target_id,
            status='pending'
        ).first()
        
        if existing_report:
            return Response(
                {'error': 'Вы уже отправляли жалобу на этого пользователя'},
                status=status.HTTP_400_BAD_REQUEST
            )
        
        # Создаём жалобу с комментарием
        report = Report.objects.create(
            target_type='user',
            target_id=target_id,
            user=request.user,
            reason=reason,
            comment=comment,  # УБЕДИСЬ ЧТО ЭТА СТРОКА ЕСТЬ
            status='pending'
        )
        
        return Response({
            'message': 'Жалоба отправлена',
            'report_id': report.id
        }, status=status.HTTP_201_CREATED)

class ReportView(APIView):
    """Создание жалобы на тест или комментарий"""
    permission_classes = [IsAuthenticated]
    
    def post(self, request):
        target_type = request.data.get('target_type')
        target_id = request.data.get('target_id')
        test_id = request.data.get('test_id', None)  # ДОБАВИТЬ - ID теста для комментария
        reason = request.data.get('reason')
        comment = request.data.get('comment', '')
        
        if not target_type or not target_id or not reason:
            return Response(
                {'error': 'Не все поля заполнены'},
                status=status.HTTP_400_BAD_REQUEST
            )
        
        if target_type not in ['test', 'comment']:
            return Response(
                {'error': 'Неверный тип цели'},
                status=status.HTTP_400_BAD_REQUEST
            )
        
        if target_type == 'test':
            if not Test.objects.filter(id=target_id).exists():
                return Response(
                    {'error': 'Тест не найден'},
                    status=status.HTTP_404_NOT_FOUND
                )
        else:
            if not TestComment.objects.filter(id=target_id).exists():
                return Response(
                    {'error': 'Комментарий не найден'},
                    status=status.HTTP_404_NOT_FOUND
                )
        
        # Проверяем, не отправлял ли пользователь уже жалобу
        existing_report = Report.objects.filter(
            user=request.user,
            target_type=target_type,
            target_id=target_id,
            status='pending'
        ).first()
        
        if existing_report:
            return Response(
                {'error': 'Вы уже отправляли жалобу на этот объект'},
                status=status.HTTP_400_BAD_REQUEST
            )
        
        # СОЗДАЁМ ЖАЛОБУ
        report_data = {
            'target_type': target_type,
            'target_id': target_id,
            'user': request.user,
            'reason': reason,
            'comment': comment,
            'status': 'pending'
        }
        
        # Для комментария сохраняем ID теста
        if target_type == 'comment' and test_id:
            report_data['test_id'] = test_id
        
        report = Report.objects.create(**report_data)
        
        return Response({
            'id': report.id,
            'message': 'Жалоба отправлена'
        }, status=status.HTTP_201_CREATED)


class ReportListView(APIView):
    """Список жалоб (только для администратора)"""
    permission_classes = [IsAuthenticated]
    
    def get(self, request):
        if request.user.status != 'admin':
            return Response(
                {'error': 'Доступ запрещен'},
                status=status.HTTP_403_FORBIDDEN
            )
        
        status_filter = request.query_params.get('status', None)
        reports = Report.objects.all()
        
        if status_filter:
            reports = reports.filter(status=status_filter)
        
        serializer = ReportSerializer(reports, many=True)
        return Response(serializer.data)


class ReportDetailView(APIView):
    """Просмотр и обновление статуса жалобы (только для администратора)"""
    permission_classes = [IsAuthenticated]
    
    def get_object(self, report_id):
        try:
            return Report.objects.get(id=report_id)
        except Report.DoesNotExist:
            return None
    
    def get(self, request, report_id):
        if request.user.status != 'admin':
            return Response(
                {'error': 'Доступ запрещен'},
                status=status.HTTP_403_FORBIDDEN
            )
        
        report = self.get_object(report_id)
        if not report:
            return Response(
                {'error': 'Репорт не найден'},
                status=status.HTTP_404_NOT_FOUND
            )
        
        serializer = ReportSerializer(report)
        return Response(serializer.data)
    
    def patch(self, request, report_id):
        if request.user.status != 'admin':
            return Response(
                {'error': 'Доступ запрещен'},
                status=status.HTTP_403_FORBIDDEN
            )
        
        report = self.get_object(report_id)
        if not report:
            return Response(
                {'error': 'Репорт не найден'},
                status=status.HTTP_404_NOT_FOUND
            )
        
        status_new = request.data.get('status')
        if status_new in ['reviewed', 'resolved']:
            report.status = status_new
            report.save()
            serializer = ReportSerializer(report)
            return Response(serializer.data)
        
        return Response(
            {'error': 'Неверный статус'},
            status=status.HTTP_400_BAD_REQUEST
        )

#баны и муты 

class MuteUserView(APIView):
    """Замутить пользователя (запрет на комментарии)"""
    permission_classes = [IsAuthenticated]
    
    def post(self, request, user_id):
        if request.user.status != 'admin':
            return Response({'error': 'Нет прав'}, status=403)
        
        try:
            user = User.objects.get(id=user_id)
            reason = request.data.get('reason', '')
            user.is_muted = True
            user.mute_reason = reason
            user.save()
            return Response({'message': f'Пользователь {user.login} замучен'})
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
            user.save()
            return Response({'message': f'Пользователь {user.login} размучен'})
        except User.DoesNotExist:
            return Response({'error': 'Пользователь не найден'}, status=404)


class BanUserView(APIView):
    """Забанить пользователя (запрет на создание тестов)"""
    permission_classes = [IsAuthenticated]
    
    def post(self, request, user_id):
        if request.user.status != 'admin':
            return Response({'error': 'Нет прав'}, status=403)
        
        try:
            user = User.objects.get(id=user_id)
            reason = request.data.get('reason', '')
            user.is_banned = True
            user.ban_reason = reason
            user.is_active = False
            user.save()
            return Response({'message': f'Пользователь {user.login} забанен'})
        except User.DoesNotExist:
            return Response({'error': 'Пользователь не найден'}, status=404)


class UnbanUserView(APIView):
    """Разбанить пользователя"""
    permission_classes = [IsAuthenticated]
    
    def post(self, request, user_id):
        if request.user.status != 'admin':
            return Response({'error': 'Нет прав'}, status=403)
        
        try:
            user = User.objects.get(id=user_id)
            user.is_banned = False
            user.ban_reason = ''
            user.is_active = True
            user.save()
            return Response({'message': f'Пользователь {user.login} разбанен'})
        except User.DoesNotExist:
            return Response({'error': 'Пользователь не найден'}, status=404)

class DeleteCommentView(APIView):
    """Удаление комментария (только для админа)"""
    permission_classes = [IsAuthenticated]
    
    def delete(self, request, comment_id):
        # Проверка прав администратора
        if request.user.status != 'admin':
            return Response(
                {'error': 'У вас нет прав для удаления комментариев'},
                status=status.HTTP_403_FORBIDDEN
            )
        
        try:
            comment = TestComment.objects.get(id=comment_id)
            comment.delete()
            return Response(
                {'message': 'Комментарий успешно удалён'},
                status=status.HTTP_200_OK
            )
        except TestComment.DoesNotExist:
            return Response(
                {'error': 'Комментарий не найден'},
                status=status.HTTP_404_NOT_FOUND
            )

class TestStatsView(APIView):
    """Статистика по тесту для автора"""
    permission_classes = [IsAuthenticated]
    
    def get(self, request, test_id):
        try:
            test = Test.objects.get(id=test_id)
        except Test.DoesNotExist:
            return Response({'error': 'Тест не найден'}, status=404)
        
        # Только автор может смотреть статистику
        if request.user != test.author:
            return Response({'error': 'Нет прав'}, status=403)
        
        attempts = TestAttempt.objects.filter(test=test, finished_at__isnull=False)
        
        total_attempts = attempts.count()
        passed_attempts = attempts.filter(is_passed=True).count()
        average_score = attempts.aggregate(avg=Avg('score'))['avg'] or 0
        
        attempts_data = []
        for attempt in attempts.order_by('-finished_at'):
            # Обработка анонимных пользователей (user может быть None)
            if attempt.user:
                user_data = {
                    'id': attempt.user.id,
                    'login': attempt.user.login,
                    'full_name': attempt.user.full_name,
                    'avatar': attempt.user.avatar,
                }
            else:
                user_data = {
                    'id': 0,
                    'login': 'Аноним',
                    'full_name': 'Анонимный пользователь',
                    'avatar': None,
                }
            
            attempts_data.append({
                'id': attempt.id,
                'user': user_data,
                'score': attempt.score,
                'is_passed': attempt.is_passed,
                'started_at': attempt.started_at,
                'finished_at': attempt.finished_at,
                'answers': attempt.answers
            })
        
        return Response({
            'id': test.id,
            'title': test.title,
            'description': test.description,
            'is_survey': test.is_survey,
            'questions_count': test.test_questions.count(),
            'total_attempts': total_attempts,
            'passed_attempts': passed_attempts,
            'average_score': round(average_score, 1),
            'attempts': attempts_data
        })

class AttemptDetailsView(APIView):
    """Детали попытки с ответами на вопросы"""
    permission_classes = [IsAuthenticated]
    
    def get(self, request, attempt_id):
        try:
            attempt = TestAttempt.objects.get(id=attempt_id)
        except TestAttempt.DoesNotExist:
            return Response({'error': 'Попытка не найдена'}, status=404)
        
        # Только автор теста может смотреть детали
        if request.user != attempt.test.author:
            return Response({'error': 'Нет прав'}, status=403)
        
        answers_details = []
        test_questions = attempt.test.test_questions.select_related('question').all().order_by('order_index')
        
        for tq in test_questions:
            question = tq.question
            answer_data = attempt.answers.get(str(question.id), {})
            user_answer = answer_data.get('answer', '')
            is_correct = answer_data.get('is_correct', False)
            
            answers_details.append({
                'question_id': question.id,
                'question_text': question.text,
                'user_answer': user_answer or '(не указан)',
                'is_correct': is_correct
            })
        
        return Response({
            'attempt_id': attempt.id,
            'answers_details': answers_details
        })