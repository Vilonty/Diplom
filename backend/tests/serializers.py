from rest_framework import serializers
from .models import Pool, Question, Answer, PoolQuestion, Test, TestQuestion, TestAttempt, TestRating, TestComment, Report
from django.contrib.auth import get_user_model

User = get_user_model()


class UserSimpleSerializer(serializers.ModelSerializer):
    class Meta:
        model = User
        fields = ('id', 'login', 'full_name', 'avatar')


class AnswerSerializer(serializers.ModelSerializer):
    class Meta:
        model = Answer
        fields = ('id', 'text', 'is_correct', 'order_index')


class QuestionSerializer(serializers.ModelSerializer):
    answers = AnswerSerializer(many=True, read_only=True)
    author_info = UserSimpleSerializer(source='author', read_only=True)
    image_url = serializers.SerializerMethodField()
    
    class Meta:
        model = Question
        fields = ('id', 'text', 'image', 'image_url', 'author', 'author_info', 'difficulty', 
                  'explanation', 'usage_count', 'is_text_input', 'text_answer',
                  'answers', 'created_at', 'updated_at')
        read_only_fields = ('id', 'usage_count', 'created_at', 'updated_at')
        extra_kwargs = {'author': {'write_only': True}}
    
    def get_image_url(self, obj):
        if obj.image:
            if hasattr(obj.image, 'url'):
                return obj.image.url
            return obj.image
        return None


class QuestionCreateSerializer(serializers.ModelSerializer):
    answers = AnswerSerializer(many=True, required=False, write_only=True)
    image = serializers.CharField(required=False, allow_null=True, allow_blank=True)
    
    class Meta:
        model = Question
        fields = ('id', 'text', 'image', 'difficulty', 'explanation', 'is_text_input', 'text_answer', 'answers')
        read_only_fields = ('id',)
    
    def create(self, validated_data):
        answers_data = validated_data.pop('answers', [])
        validated_data['author'] = self.context['request'].user
        
        question = Question.objects.create(**validated_data)
        
        for answer_data in answers_data:
            Answer.objects.create(question=question, **answer_data)
        
        if question.is_text_input and question.text_answer and not answers_data:
            Answer.objects.create(
                question=question,
                text=question.text_answer,
                is_correct=True,
                order_index=0
            )
        
        return question


class PoolSerializer(serializers.ModelSerializer):
    user_info = UserSimpleSerializer(source='user', read_only=True)
    questions_count = serializers.IntegerField(source='pool_questions.count', read_only=True)
    questions = serializers.SerializerMethodField(read_only=True)
    
    class Meta:
        model = Pool
        fields = ('id', 'name', 'description', 'user', 'user_info', 'questions_count', 'questions', 'created_at', 'updated_at')
        read_only_fields = ('id', 'created_at', 'updated_at', 'user', 'user_info', 'questions_count')
    
    def get_questions(self, obj):
        pool_questions = obj.pool_questions.select_related('question').prefetch_related('question__answers').all()
        questions = []
        for pq in pool_questions:
            question = pq.question
            image_url = None
            if question.image:
                if hasattr(question.image, 'url'):
                    image_url = question.image.url
                else:
                    image_url = question.image
            
            questions.append({
                'id': question.id,
                'text': question.text,
                'image': image_url,
                'answers': [{'text': a.text, 'is_correct': a.is_correct} for a in question.answers.all()],
                'is_text_input': question.is_text_input,
                'text_answer': question.text_answer
            })
        return questions


class PoolDetailSerializer(PoolSerializer):
    questions = serializers.SerializerMethodField()
    
    class Meta(PoolSerializer.Meta):
        fields = PoolSerializer.Meta.fields + ('questions',)
    
    def get_questions(self, obj):
        pool_questions = obj.pool_questions.select_related('question').all()
        questions = [pq.question for pq in pool_questions]
        return QuestionSerializer(questions, many=True).data


class PoolQuestionSerializer(serializers.ModelSerializer):
    question = QuestionSerializer(read_only=True)
    question_id = serializers.IntegerField(write_only=True)
    
    class Meta:
        model = PoolQuestion
        fields = ('id', 'pool', 'question', 'question_id', 'added_at')
        read_only_fields = ('id', 'added_at')
        extra_kwargs = {'pool': {'write_only': True}}


class TestSerializer(serializers.ModelSerializer):
    author_info = UserSimpleSerializer(source='author', read_only=True)
    questions_count = serializers.IntegerField(source='test_questions.count', read_only=True)
    attempts_count = serializers.IntegerField(read_only=True)
    average_rating = serializers.FloatField(read_only=True)
    image_url = serializers.SerializerMethodField()
    
    class Meta:
        model = Test
        fields = ('id', 'title', 'description', 'author', 'author_info', 'is_open', 'is_survey',
                  'time_limit', 'passing_score', 'attempts_limit', 'image', 'image_url', 'topics',
                  'questions_count', 'attempts_count', 'average_rating', 'access_token', 'created_at', 'updated_at')
        read_only_fields = ('id', 'created_at', 'updated_at')
        extra_kwargs = {'author': {'write_only': True}}
    
    def get_image_url(self, obj):
        if obj.image:
            if hasattr(obj.image, 'url'):
                return obj.image.url
            return obj.image
        return None


class TestDetailSerializer(TestSerializer):
    questions = serializers.SerializerMethodField()
    
    class Meta(TestSerializer.Meta):
        fields = TestSerializer.Meta.fields + ('questions',)
    
    def get_questions(self, obj):
        test_questions = obj.test_questions.select_related('question').all().order_by('order_index')
        questions = [tq.question for tq in test_questions]
        return QuestionSerializer(questions, many=True).data


class TestCreateSerializer(serializers.ModelSerializer):
    question_ids = serializers.ListField(child=serializers.IntegerField(), write_only=True)
    time_limit = serializers.IntegerField(required=False, default=0)
    passing_score = serializers.IntegerField(required=False, default=70)
    
    class Meta:
        model = Test
        fields = ('title', 'description', 'is_open', 'is_survey', 'time_limit', 
                  'passing_score', 'attempts_limit', 'image', 'topics', 'question_ids')
    
    def validate(self, data):
        if len(data.get('question_ids', [])) < 4:
            raise serializers.ValidationError({
                'question_ids': 'Для создания необходимо минимум 4 вопроса'
            })
        
        if not data.get('is_survey'):
            if data.get('time_limit', 0) < 0:
                raise serializers.ValidationError({
                    'time_limit': 'Время не может быть отрицательным'
                })
            if not data.get('passing_score'):
                raise serializers.ValidationError({
                    'passing_score': 'Укажите проходной балл'
                })
        
        return data
    
    def create(self, validated_data):
        question_ids = validated_data.pop('question_ids')
        validated_data['author'] = self.context['request'].user
        
        if validated_data.get('is_survey'):
            validated_data['time_limit'] = 0
            validated_data['passing_score'] = 0
        
        test = Test.objects.create(**validated_data)
        
        for idx, question_id in enumerate(question_ids):
            TestQuestion.objects.create(
                test=test,
                question_id=question_id,
                order_index=idx
            )
        
        return test


class TestAttemptSerializer(serializers.ModelSerializer):
    test = TestSerializer(read_only=True)
    user_login = serializers.CharField(source='user.login', read_only=True)
    author_avatar = serializers.SerializerMethodField()
    is_open = serializers.BooleanField(source='test.is_open', read_only=True)
    name = serializers.CharField(source='test.title', read_only=True)
    type = serializers.SerializerMethodField()
    author = serializers.CharField(source='test.author.login', read_only=True)
    author_id = serializers.IntegerField(source='test.author.id', read_only=True)
    questions = serializers.IntegerField(source='test.test_questions.count', read_only=True)
    result = serializers.SerializerMethodField()
    date = serializers.SerializerMethodField()
    
    class Meta:
        model = TestAttempt
        fields = ('id', 'name', 'type', 'author', 'author_id', 'questions', 
                  'result', 'date', 'score', 'is_passed', 'is_open', 
                  'started_at', 'finished_at')  # Добавь started_at и finished_at
    
    def get_type(self, obj):
        return 'опрос' if obj.test.is_survey else 'тест'
    
    def get_result(self, obj):
        return 'Пройден' if obj.test.is_survey else f'{obj.score}%'
    
    def get_date(self, obj):
        return obj.finished_at.strftime('%d.%m.%Y') if obj.finished_at else ''

class TestCommentSerializer(serializers.ModelSerializer):
    user_info = UserSimpleSerializer(source='user', read_only=True)
    user_id = serializers.IntegerField(source='user.id', read_only=True)
    
    class Meta:
        model = TestComment
        fields = ('id', 'test', 'user', 'user_id', 'user_info', 'text', 'created_at', 'updated_at')
        read_only_fields = ('id', 'created_at', 'updated_at')
        extra_kwargs = {'test': {'write_only': True}, 'user': {'write_only': True}}


class TestRatingSerializer(serializers.ModelSerializer):
    class Meta:
        model = TestRating
        fields = ('id', 'test', 'user', 'rating', 'created_at')
        read_only_fields = ('id', 'created_at')
        extra_kwargs = {'test': {'write_only': True}, 'user': {'write_only': True}}


class ReportSerializer(serializers.ModelSerializer):
    user_info = UserSimpleSerializer(source='user', read_only=True)
    
    class Meta:
        model = Report
        fields = ('id', 'target_type', 'target_id', 'user', 'user_info', 'reason', 'status', 'created_at', 'updated_at')
        read_only_fields = ('id', 'status', 'created_at', 'updated_at')
        extra_kwargs = {'user': {'read_only': True}}

class UserSerializer(serializers.ModelSerializer):
    class Meta:
        model = User
        fields = ('id', 'login', 'full_name', 'avatar', 'status')