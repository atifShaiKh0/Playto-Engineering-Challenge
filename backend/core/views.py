from django.db.models import Count, Sum, Q, Exists, OuterRef, Prefetch
from django.db import transaction, IntegrityError
from django.utils import timezone
from datetime import timedelta
from rest_framework import viewsets, status, generics
from rest_framework.decorators import action
from rest_framework.response import Response
from rest_framework.views import APIView
from rest_framework.permissions import IsAuthenticatedOrReadOnly, IsAuthenticated, AllowAny
from django.contrib.contenttypes.models import ContentType
from .models import Post, Comment, Like, User
from .serializers import PostSerializer, CommentSerializer, LikeSerializer, UserSerializer, RegisterSerializer

class RegisterView(generics.CreateAPIView):
    queryset = User.objects.all()
    serializer_class = RegisterSerializer
    permission_classes = [AllowAny]

class FeedViewSet(viewsets.ModelViewSet):
    queryset = Post.objects.all()
    serializer_class = PostSerializer
    permission_classes = [IsAuthenticatedOrReadOnly]

    def get_queryset(self):
        user = self.request.user
        qs = Post.objects.all().select_related('author').order_by('-created_at')
        
        # Annotate with counts
        qs = qs.annotate(
            likes_count=Count('likes', distinct=True),
            comments_count=Count('comments', distinct=True)
        )
        
        # Annotate with user_has_liked
        if user.is_authenticated:
            # We can use Exists subquery
            has_liked_subquery = Like.objects.filter(
                content_type=ContentType.objects.get_for_model(Post),
                object_id=OuterRef('pk'),
                user=user
            )
            qs = qs.annotate(user_has_liked=Exists(has_liked_subquery))
            
        return qs

    def perform_create(self, serializer):
        serializer.save(author=self.request.user)

    @action(detail=True, methods=['get'])
    def comments(self, request, pk=None):
        """
        Fetch comments for a post efficiently (N+1 safe).
        """
        post = self.get_object()
        
        # 1. Fetch all comments for this post in ONE query
        #    Select related author for serialization
        #    Annotate likes_count
        qs = Comment.objects.filter(post=post).select_related('author').order_by('created_at')
        qs = qs.annotate(likes_count=Count('likes'))
        
        if request.user.is_authenticated:
             has_liked_subquery = Like.objects.filter(
                content_type=ContentType.objects.get_for_model(Comment),
                object_id=OuterRef('pk'),
                user=request.user
            )
             qs = qs.annotate(user_has_liked=Exists(has_liked_subquery))

        comments = list(qs) # Execute query
        
        # 2. Build the tree in Python (O(N))
        comment_map = {c.id: c for c in comments}
        roots = []
        
        for comment in comments:
            comment._prefetched_replies = [] # Initialize bucket
        
        for comment in comments:
            if comment.parent_id:
                parent = comment_map.get(comment.parent_id)
                if parent:
                    parent._prefetched_replies.append(comment)
            else:
                roots.append(comment)
        
        # 3. Serialize only the roots (recursively handled by serializer)
        serializer = CommentSerializer(roots, many=True, context={'request': request})
        return Response(serializer.data)

class LikeView(APIView):
    permission_classes = [IsAuthenticated]

    def post(self, request):
        user = request.user
        content_type_str = request.data.get('content_type') # 'post' or 'comment'
        object_id = request.data.get('object_id')
        
        if not content_type_str or not object_id:
            return Response({'error': 'Missing content_type or object_id'}, status=400)
            
        if content_type_str == 'post':
            model = Post
            value = 5 # 1 Like on Post = 5 Karma
        elif content_type_str == 'comment':
            model = Comment
            value = 1 # 1 Like on Comment = 1 Karma
        else:
             return Response({'error': 'Invalid content_type'}, status=400)
             
        try:
            obj = model.objects.get(pk=object_id)
        except model.DoesNotExist:
            return Response({'error': 'Object not found'}, status=404)
            
        ct = ContentType.objects.get_for_model(model)
        
        # Concurrency: Unique Constraint on DB is the ultimate guard.
        # We try to create. If it exists, we return an error or toggle (if toggle logic desired).
        # Requirement says "cannot double like".
        
        try:
            Like.objects.create(
                user=user,
                content_type=ct,
                object_id=object_id,
                receiver=obj.author,
                value=value
            )
        except IntegrityError:
             return Response({'error': 'You already liked this.'}, status=400)
             
        return Response({'status': 'liked', 'karma_awarded': value})

class LeaderboardView(APIView):
    permission_classes = [IsAuthenticatedOrReadOnly]
    def get(self, request):
        # "Top 5 Users based on Karma earned in the last 24 hours only"
        
        last_24h = timezone.now() - timedelta(hours=24)
        
        # Aggregation
        # We verify 'created_at' of the LIKE, not the post (Assuming they earn karma when the like happens)
        # Yes: "Karma earned in the last 24 hours".
        
        top_users = Like.objects.filter(
            created_at__gte=last_24h
        ).values('receiver').annotate(
            total_karma=Sum('value')
        ).order_by('-total_karma')[:5]
        
        # Fetch user details
        # We have receiver IDs. Efficiently fetch user objects.
        
        # We can construct the response manually or fetch Users.
        # Let's fetch the User objects to get usernames.
        
        leaderboard_data = []
        user_ids = [item['receiver'] for item in top_users]
        users = {u.id: u for u in User.objects.filter(id__in=user_ids)}
        
        for item in top_users:
            user = users.get(item['receiver'])
            if user:
                leaderboard_data.append({
                    'username': user.username,
                    'karma': item['total_karma']
                })
                
        return Response(leaderboard_data)

class CommentCreateView(generics.CreateAPIView):
    queryset = Comment.objects.all()
    serializer_class = CommentSerializer
    permission_classes = [IsAuthenticated]
    
    def perform_create(self, serializer):
        serializer.save(author=self.request.user)

