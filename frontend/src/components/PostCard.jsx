import React, { useState } from 'react';
import { formatDistanceToNow } from 'date-fns';
import { MessageSquare, Heart, Share2 } from 'lucide-react';
import api from '../api';
import Comment from './Comment';

const PostCard = ({ post }) => {
    const [likesCount, setLikesCount] = useState(post.likes_count);
    const [hasLiked, setHasLiked] = useState(post.user_has_liked);
    const [comments, setComments] = useState([]);
    const [loadingComments, setLoadingComments] = useState(false);
    const [expanded, setExpanded] = useState(false);

    const handleLike = async () => {
        try {
            if (hasLiked) return;
            await api.post('like/', { content_type: 'post', object_id: post.id });
            setHasLiked(true);
            setLikesCount(prev => prev + 1);
        } catch (error) {
            console.error(error);
        }
    };

    const toggleComments = async () => {
        if (!expanded && comments.length === 0) {
            setLoadingComments(true);
            try {
                const res = await api.get(`feed/${post.id}/comments/`);
                setComments(res.data);
            } catch (err) {
                console.error(err);
            } finally {
                setLoadingComments(false);
            }
        }
        setExpanded(!expanded);
    };

    return (
        <div className="bg-slate-800/50 backdrop-blur-md border border-slate-700 rounded-xl p-5 mb-6 shadow-xl transition-all hover:border-slate-600">
            <div className="flex items-center justify-between mb-3">
                <div className="flex items-center gap-3">
                    <div className="w-10 h-10 rounded-full bg-gradient-to-tr from-sky-500 to-indigo-600 flex items-center justify-center text-white font-bold">
                        {post.author.username.charAt(0).toUpperCase()}
                    </div>
                    <div>
                        <h3 className="font-semibold text-white">{post.author.username}</h3>
                        <p className="text-xs text-slate-400">{formatDistanceToNow(new Date(post.created_at))} ago</p>
                    </div>
                </div>
            </div>

            <p className="text-slate-200 mb-4 whitespace-pre-wrap text-lg leading-relaxed">
                {post.content}
            </p>

            <div className="flex items-center gap-6 pt-4 border-t border-slate-700/50">
                <button
                    onClick={handleLike}
                    disabled={hasLiked}
                    className={`flex items-center gap-2 text-sm font-medium transition-colors ${hasLiked ? 'text-pink-500' : 'text-slate-400 hover:text-pink-500'}`}
                >
                    <Heart size={18} className={hasLiked ? "fill-current" : ""} />
                    {likesCount} <span className="hidden sm:inline">Likes</span>
                </button>
                <button
                    onClick={toggleComments}
                    className="flex items-center gap-2 text-sm font-medium text-slate-400 hover:text-sky-400 transition-colors"
                >
                    <MessageSquare size={18} />
                    {post.comments_count} <span className="hidden sm:inline">Comments</span>
                </button>
                <button className="flex items-center gap-2 text-sm font-medium text-slate-400 hover:text-emerald-400 transition-colors ml-auto">
                    <Share2 size={18} />
                </button>
            </div>

            {expanded && (
                <div className="mt-6 pl-2 border-l-2 border-slate-700/50">
                    <div className="mb-4">
                        <textarea
                            className="w-full bg-slate-900/50 border border-slate-700 rounded-lg p-3 text-sm text-slate-200 focus:ring-2 focus:ring-sky-500 outline-none resize-none"
                            placeholder="Write a comment..."
                            rows={2}
                            onKeyDown={async (e) => {
                                if (e.key === 'Enter' && !e.shiftKey) {
                                    e.preventDefault();
                                    const content = e.target.value.trim();
                                    if (!content) return;

                                    try {
                                        await api.post('comments/', {
                                            post: post.id,
                                            content: content
                                        });
                                        e.target.value = '';
                                        // Refresh comments
                                        const res = await api.get(`feed/${post.id}/comments/`);
                                        setComments(res.data);
                                    } catch (err) {
                                        console.error(err);
                                        alert('Failed to post comment');
                                    }
                                }
                            }}
                        />
                        <p className="text-[10px] text-slate-500 mt-1 text-right">Press Enter to post</p>
                    </div>

                    {loadingComments ? (
                        <p className="text-sm text-slate-500 animate-pulse">Loading discussion...</p>
                    ) : (
                        comments.map(comment => (
                            <Comment key={comment.id} comment={comment} />
                        ))
                    )}
                </div>
            )}
        </div>
    );
};

export default PostCard;
