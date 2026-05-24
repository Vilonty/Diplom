from django.urls import path, include
from rest_framework.routers import DefaultRouter
from django.conf import settings
from django.conf.urls.static import static
from .views import (
    QuestionViewSet, PoolViewSet, TestViewSet, 
    TestAttemptView, UserTestsView, AvailablePoolsView,
    StartTestView, GetQuestionView, SubmitAnswerView, FinishTestView, 
    RateTestView, TestCommentsView, GetAttemptView, UploadImageView,
    QuestionBatchCreateView, TestSearchView,
    ReportView, ReportListView, ReportDetailView, MyTestsView,
    CreatedTestsView, CompletedTestsView, ReportUserView, DeleteCommentView,
    TestStatsView, AttemptDetailsView
)

router = DefaultRouter()
router.register('questions', QuestionViewSet, basename='question')
router.register('pools', PoolViewSet, basename='pool')
router.register('tests', TestViewSet, basename='test')

urlpatterns = [
    path('questions/batch/', QuestionBatchCreateView.as_view(), name='questions-batch'),
    path('upload/', UploadImageView.as_view(), name='upload-image'),
    path('', include(router.urls)),
    path('tests/<int:test_id>/attempt/', TestAttemptView.as_view(), name='test-attempt'),
    path('tests/<int:test_id>/start/', StartTestView.as_view(), name='test-start'),
    path('tests/<int:test_id>/question/<int:question_index>/', GetQuestionView.as_view(), name='test-question'),
    path('tests/<int:test_id>/comments/', TestCommentsView.as_view(), name='test-comments'),
    path('tests/<int:test_id>/rate/', RateTestView.as_view(), name='test-rate'),
    path('tests/search/', TestSearchView.as_view(), name='test-search'),
    path('attempts/<int:attempt_id>/', GetAttemptView.as_view(), name='get-attempt'),
    path('attempts/<int:attempt_id>/answer/<int:question_id>/', SubmitAnswerView.as_view(), name='submit-answer'),
    path('attempts/<int:attempt_id>/finish/', FinishTestView.as_view(), name='test-finish'),
    path('my-tests/', UserTestsView.as_view(), name='my-tests'),
    path('available-pools/', AvailablePoolsView.as_view(), name='available-pools'),
    path('reports/', ReportView.as_view(), name='create-report'),
    path('reports/list/', ReportListView.as_view(), name='report-list'),
    path('reports/<int:report_id>/', ReportDetailView.as_view(), name='report-detail'),
    path('reports/user/', ReportUserView.as_view(), name='report-user'),
    path('profile/<int:user_id>/my-tests/', MyTestsView.as_view(), name='my-tests'),
    path('profile/<int:user_id>/created-tests/', CreatedTestsView.as_view(), name='created-tests'),
    path('profile/<int:user_id>/completed-tests/', CompletedTestsView.as_view(), name='completed-tests'),
    path('comments/<int:comment_id>/', DeleteCommentView.as_view(), name='delete-comment'),
    path('tests/<int:test_id>/stats/', TestStatsView.as_view(), name='test-stats'),
    path('attempts/<int:attempt_id>/details/', AttemptDetailsView.as_view(), name='attempt-details'),
]

if settings.DEBUG:
    urlpatterns += static(settings.MEDIA_URL, document_root=settings.MEDIA_ROOT)