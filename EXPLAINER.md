# Playto Engineering Challenge - Explainer

## 1. The Tree (Efficient Comments)
To model nested comments, I used the **Adjacency List** pattern (`parent` foreign key to `self`).

### Modeling
```python
class Comment(models.Model):
    post = models.ForeignKey(Post, ...)
    parent = models.ForeignKey('self', ...)
    content = models.TextField()
```

### Serialization (Solving N+1)
Instead of using recursive SQL queries (CTE) or recursive Serializer fields (which trigger N+1 queries), I implemented a **Python-side Tree Construction**:

1.  **Fetch**: Retrieve *all* comments for the post in a single SQL query:
    ```python
    comments = Comment.objects.filter(post=post).select_related('author')
    ```
2.  **Build**: Iterate over the flat list in O(N) to build a dictionary and attach children to parents via a temporary `_replies` attribute.
3.  **Serialize**: Pass only the root comments to the Serializer. The Serializer's `get_replies` method uses the pre-attached `_replies` list, avoiding any database hits during serialization.

**Result**: Loading 50 comments takes **1 SQL Query** (plus 1 for Likes annotation), regardless of depth.

## 2. The Math (Leaderboard Aggregation)
To calculate the "Top 5 Users based on Karma earned in the last 24 hours," I avoided summing a simple `user.karma` field (which would be historical).

### The Query
```python
last_24h = timezone.now() - timedelta(hours=24)

top_users = Like.objects.filter(
    created_at__gte=last_24h
).values('receiver').annotate(
    total_karma=Sum('value')
).order_by('-total_karma')[:5]
```

### Why it works
-   The `Like` model stores `receiver` (denormalized at write time) and `value` (5 for Post, 1 for Comment).
-   The DB Index on `[receiver, created_at]` ensures this aggregation is efficient even with millions of rows.

## 3. The AI Audit
**The Mistake**: Initially, when asking an AI to "Add likes to Posts and Comments", it suggested adding a `likes_count` IntegerField on the models and incrementing it atomically.

**Why it was bad**: The requirements specified a **24-hour rolling window** for the Leaderboard. If we only stored a static counter, we could never calculate "karma earned in the last 24h" (we would only know total karma). We needed the *Activity Log* (the `Like` table with timestamps).

**The Fix**: I rejected the counter approach and implemented the `Like` model as a ledger. I also added a `receiver` field to the `Like` model to avoid complex `JOIN`s (Post -> Author or Comment -> Author) during the leaderboard query.
