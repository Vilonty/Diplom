from django.urls import path
from rest_framework_simplejwt.views import TokenRefreshView
from .views import (
    RegisterView, LoginView, LogoutView, ProfileView, UserProfileView, 
    UpdateLastSeenView, TopUsersView, SendFriendRequestView, 
    AcceptFriendRequestView, RejectFriendRequestView, GetFriendsView,
    GetFriendRequestsView, CheckFriendStatusView,
    RemoveFriendView, CancelFriendRequestView, GetUserFriendsView,
    UserCompletedTestsView, UserCreatedTestsView, UploadAvatarView,
    UserSearchView
)

urlpatterns = [
    path('auth/register/', RegisterView.as_view(), name='register'),
    path('auth/login/', LoginView.as_view(), name='login'),
    path('auth/logout/', LogoutView.as_view(), name='logout'),
    path('auth/profile/', ProfileView.as_view(), name='profile'),
    path('auth/profile/<int:user_id>/', UserProfileView.as_view(), name='user-profile'),
    path('auth/update-last-seen/', UpdateLastSeenView.as_view(), name='update-last-seen'),
    path('auth/refresh/', TokenRefreshView.as_view(), name='token_refresh'),
    path('users/top/', TopUsersView.as_view(), name='top-users'),
    path('friends/', GetFriendsView.as_view(), name='friends'),
    path('friends/requests/', GetFriendRequestsView.as_view(), name='friend-requests'),
    path('friends/send/<int:user_id>/', SendFriendRequestView.as_view(), name='send-friend-request'),
    path('friends/accept/<int:request_id>/', AcceptFriendRequestView.as_view(), name='accept-friend-request'),
    path('friends/reject/<int:request_id>/', RejectFriendRequestView.as_view(), name='reject-friend-request'),
    path('friends/check/<int:user_id>/', CheckFriendStatusView.as_view(), name='check-friend-status'),
    path('friends/remove/<int:user_id>/', RemoveFriendView.as_view(), name='remove-friend'),
    path('friends/cancel-request/<int:user_id>/', CancelFriendRequestView.as_view(), name='cancel-request'),
    path('friends/<int:user_id>/', GetUserFriendsView.as_view(), name='user-friends'),
    path('profile/<int:user_id>/completed-tests/', UserCompletedTestsView.as_view(), name='user-completed-tests'),
    path('profile/<int:user_id>/created-tests/', UserCreatedTestsView.as_view(), name='user-created-tests'),
    path('auth/upload-avatar/', UploadAvatarView.as_view(), name='upload-avatar'),
    path('users/search/', UserSearchView.as_view(), name='user-search'),

    
]