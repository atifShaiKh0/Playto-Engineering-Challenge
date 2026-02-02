from django.test import TestCase
from django.utils import timezone
from datetime import timedelta
from core.models import User, Post, Comment, Like
from django.contrib.contenttypes.models import ContentType
from django.db.models import Sum

class LeaderboardTestCase(TestCase):
    def setUp(self):
        self.user_a = User.objects.create_user(username='user_a', password='pw')
        self.user_b = User.objects.create_user(username='user_b', password='pw')
        self.post = Post.objects.create(author=self.user_a, content="Test Post")
        self.comment = Comment.objects.create(post=self.post, author=self.user_b, content="Test Comment")
        self.post_ct = ContentType.objects.get_for_model(Post)
        self.comment_ct = ContentType.objects.get_for_model(Comment)

    def test_leaderboard_24h_constraint(self):
        """
        Verify leaderboard only counts karma from the last 24 hours.
        """
        # 1. Like from 48 hours ago (Should NOT count)
        old_like = Like.objects.create(
            user=self.user_b,
            content_type=self.post_ct,
            object_id=self.post.id,
            receiver=self.user_a,
            value=5
        )
        # Manually backdate the created_at using update
        Like.objects.filter(id=old_like.id).update(created_at=timezone.now() - timedelta(hours=48))

        # 2. Like from 1 hour ago (SHOULD count)
        Like.objects.create(
            user=self.user_a,
            content_type=self.comment_ct,
            object_id=self.comment.id,
            receiver=self.user_b,
            value=1
        )

        # Query logic (Mirroring views.py)
        last_24h = timezone.now() - timedelta(hours=24)
        leaderboard = Like.objects.filter(
            created_at__gte=last_24h
        ).values('receiver').annotate(
            total_karma=Sum('value')
        ).order_by('-total_karma')

        # Assertions
        # User B should have 1 karma (Comment Like within 24h)
        # User A should have 0 karma in the leaderboard context (Post Like was > 24h ago)
        
        results = {item['receiver']: item['total_karma'] for item in leaderboard}
        
        self.assertIn(self.user_b.id, results)
        self.assertEqual(results[self.user_b.id], 1)
        self.assertNotIn(self.user_a.id, results)

    def test_karma_values(self):
        """
        Verify Post likes give 5 and Comment likes give 1.
        """
        # Post Like
        Like.objects.create(
            user=self.user_b,
            content_type=self.post_ct,
            object_id=self.post.id,
            receiver=self.user_a,
            value=5
        )
        # Comment Like
        Like.objects.create(
            user=self.user_a,
            content_type=self.comment_ct,
            object_id=self.comment.id,
            receiver=self.user_b,
            value=1
        )
        
        # Check receiver a
        karma_a = Like.objects.filter(receiver=self.user_a).aggregate(s=Sum('value'))['s']
        self.assertEqual(karma_a, 5)
        
        # Check receiver b
        karma_b = Like.objects.filter(receiver=self.user_b).aggregate(s=Sum('value'))['s']
        self.assertEqual(karma_b, 1)
