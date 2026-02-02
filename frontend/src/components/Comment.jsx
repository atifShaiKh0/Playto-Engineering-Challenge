import React, { useState } from 'react';
import { formatDistanceToNow } from 'date-fns';
import { MessageSquare, Heart, CornerDownRight, ChevronDown, ChevronUp } from 'lucide-react';
import api from '../api';

const Comment = ({ comment, depth = 0 }) => {
    const [collapsed, setCollapsed] = useState(false);
    const [hasLiked, setHasLiked] = useState(comment.user_has_liked);
    const [likesCount, setLikesCount] = useState(comment.likes_count);
    const [showReply, setShowReply] = useState(false);

    const handleLike = async () => {
        try {
            if (hasLiked) return; // Prevent double like in UI immediately

            await api.post('like/', {
                content_type: 'comment',
                object_id: comment.id
            });

            setHasLiked(true);
            setLikesCount(prev => prev + 1);
        } catch (error) {
            if (error.response?.data?.error === 'You already liked this.') {
                setHasLiked(true);
            }
            console.error("Like failed", error);
        }
    };

    const hasChildren = comment.replies && comment.replies.length > 0;

    return (
        <div className={`mt-4 ${depth > 0 ? 'ml-4 border-l-2 border-slate-700 pl-4' : ''}`}>
            <div className="flex items-start gap-3">
                <div className="flex-1">
                    <div className="flex items-center gap-2 text-sm text-slate-400">
                        <span className="font-semibold text-sky-400">{comment.author.username}</span>
                        <span>•</span>
                        <span>{formatDistanceToNow(new Date(comment.created_at))} ago</span>
                        {hasChildren && (
                            <button onClick={() => setCollapsed(!collapsed)} className="hover:text-white">
                                {collapsed ? <ChevronDown size={14} /> : <ChevronUp size={14} />}
                            </button>
                        )}
                    </div>

                    {!collapsed && (
                        <>
                            <p className="mt-1 text-slate-200 text-sm whitespace-pre-wrap">{comment.content}</p>

                            <div className="mt-2 flex items-center gap-4 text-xs font-medium text-slate-500">
                                <button
                                    onClick={handleLike}
                                    disabled={hasLiked}
                                    className={`flex items-center gap-1 hover:text-pink-500 transition-colors ${hasLiked ? 'text-pink-500' : ''}`}
                                >
                                    <Heart size={14} className={hasLiked ? "fill-current" : ""} />
                                    {likesCount}
                                </button>
                                <button
                                    onClick={() => setShowReply(!showReply)}
                                    className={`flex items-center gap-1 hover:text-white transition-colors ${showReply ? 'text-white' : ''}`}
                                >
                                    <MessageSquare size={14} />
                                    Reply
                                </button>
                            </div>

                            {showReply && (
                                <div className="mt-2 mb-2">
                                    <textarea
                                        autoFocus
                                        className="w-full bg-slate-900/50 border border-slate-700 rounded-lg p-2 text-sm text-slate-200 focus:ring-1 focus:ring-sky-500 outline-none resize-none"
                                        placeholder={`Reply to ${comment.author.username}...`}
                                        rows={2}
                                        onKeyDown={async (e) => {
                                            if (e.key === 'Enter' && !e.shiftKey) {
                                                e.preventDefault();
                                                const content = e.target.value.trim();
                                                if (!content) return;

                                                try {
                                                    await api.post('comments/', {
                                                        post: comment.post,
                                                        parent: comment.id,
                                                        content: content
                                                    });
                                                    // Simple UX: close reply and basic alert or reload
                                                    setShowReply(false);
                                                    // Ideally we lift state up, but for speed:
                                                    window.location.reload();
                                                } catch (err) {
                                                    console.error(err);
                                                    alert('Failed to reply');
                                                }
                                            }
                                        }}
                                    />
                                    <p className="text-[10px] text-slate-500 text-right">Press Enter to reply</p>
                                </div>
                            )}
                        </>
                    )}
                </div>
            </div>

            {!collapsed && hasChildren && (
                <div className="mt-2">
                    {comment.replies.map(reply => (
                        <Comment key={reply.id} comment={reply} depth={depth + 1} />
                    ))}
                </div>
            )}
        </div>
    );
};

export default Comment;
