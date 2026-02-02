from django.urls import path, include
from rest_framework.routers import DefaultRouter
from .views import FeedViewSet, LikeView, LeaderboardView, CommentCreateView, RegisterView

router = DefaultRouter()
router.register(r'feed', FeedViewSet, basename='feed')

urlpatterns = [
    path('', include(router.urls)),
    path('register/', RegisterView.as_view(), name='register'),
    path('auth/me/', LeaderboardView.as_view(), name='me'), # Actually let's just use any authenticated view or create a specific one
    path('like/', LikeView.as_view(), name='like'),
    path('leaderboard/', LeaderboardView.as_view(), name='leaderboard'),
    path('comments/', CommentCreateView.as_view(), name='comment-create'),
]
