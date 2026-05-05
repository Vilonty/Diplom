from django.contrib import admin
from .models import Pool, Question, Answer, PoolQuestion, Test, TestQuestion, TestAttempt

class PoolQuestionInline(admin.TabularInline):
    model = PoolQuestion
    extra = 0
    fields = ('question', 'added_at')
    readonly_fields = ('added_at',)
    autocomplete_fields = ('question',)

@admin.register(Pool)
class PoolAdmin(admin.ModelAdmin):
    list_display = ('id', 'name', 'user', 'get_questions_count', 'created_at')
    list_filter = ('created_at',)
    search_fields = ('name', 'user__login')
    inlines = [PoolQuestionInline]
    
    def get_questions_count(self, obj):
        return obj.pool_questions.count()
    get_questions_count.short_description = 'Количество вопросов'

@admin.register(Question)
class QuestionAdmin(admin.ModelAdmin):
    list_display = ('id', 'text', 'author', 'difficulty', 'usage_count', 'created_at')
    list_filter = ('difficulty', 'created_at')
    search_fields = ('text', 'author__login')

@admin.register(Answer)
class AnswerAdmin(admin.ModelAdmin):
    list_display = ('id', 'question', 'text', 'is_correct', 'order_index')
    list_filter = ('is_correct',)

@admin.register(PoolQuestion)
class PoolQuestionAdmin(admin.ModelAdmin):
    list_display = ('id', 'pool', 'question', 'added_at')
    list_filter = ('added_at',)
    search_fields = ('pool__name', 'question__text')

@admin.register(Test)
class TestAdmin(admin.ModelAdmin):
    list_display = ('id', 'title', 'author', 'is_open', 'is_survey', 'created_at')
    list_filter = ('is_open', 'is_survey', 'created_at')
    search_fields = ('title', 'author__login')

@admin.register(TestQuestion)
class TestQuestionAdmin(admin.ModelAdmin):
    list_display = ('id', 'test', 'question', 'order_index')

@admin.register(TestAttempt)
class TestAttemptAdmin(admin.ModelAdmin):
    list_display = ('id', 'user', 'test', 'score', 'is_passed', 'started_at')
    list_filter = ('is_passed', 'started_at')