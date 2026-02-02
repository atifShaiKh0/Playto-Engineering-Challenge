import os
import django
import random

os.environ.setdefault('DJANGO_SETTINGS_MODULE', 'config.settings')
django.setup()

from core.models import User, Post, Comment, Like
from django.contrib.contenttypes.models import ContentType

def run():
    print("Creating users...")
    users = []
    for i in range(1, 6):
        username = f'user{i}'
        email = f'user{i}@example.com'
        password = 'password123'
        if not User.objects.filter(username=username).exists():
            u = User.objects.create_user(username=username, email=email, password=password)
            print(f"Created {username} / {password}")
            users.append(u)
        else:
            users.append(User.objects.get(username=username))

    print("Creating posts...")
    admin = User.objects.get(username='admin')
    users.insert(0, admin)
    
    posts = []
    for i in range(5):
        p = Post.objects.create(
            author=random.choice(users),
            content=f"This is auto-generated post #{i+1}. #PlaytoChallenge"
        )
        posts.append(p)

    print("Creating comments...")
    for p in posts:
        # Top level
        c1 = Comment.objects.create(post=p, author=random.choice(users), content="Nice post!")
        # Nested
        c2 = Comment.objects.create(post=p, parent=c1, author=random.choice(users), content="Agreed!")
        
    print("Generating Likes (Karma)...")
    post_ct = ContentType.objects.get_for_model(Post)
    
    # Random likes
    for _ in range(20):
        actor = random.choice(users)
        post = random.choice(posts)
        if actor != post.author: # Don't like own post usually
            try:
                Like.objects.create(
                    user=actor, 
                    content_type=post_ct, 
                    object_id=post.id, 
                    receiver=post.author,
                    value=5
                )
            except:
                pass

    print("Done! You can now log in as user1, user2, ... with password 'password123'")

if __name__ == '__main__':
    run()
