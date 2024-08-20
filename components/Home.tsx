"use client";

import Link from "next/link";
import { Earth, CircleUserRound, Ellipsis, ThumbsUp, MessageSquare, Menu } from "lucide-react";
import { useSession } from "next-auth/react";
import { useRouter } from "next/navigation";
import { useEffect, useState, useCallback, useMemo } from "react";
import {
    Sheet,
    SheetContent,
    SheetHeader,
    SheetTitle,
    SheetTrigger,
  } from "@/components/ui/sheet"

type Post = {
    id: number;
    content: string;
    username: string;
    created_at: string;
    likes: number;
    comments: Comment[];
    userLiked: boolean;
    timestamp?: number;
}

type Comment = {
    id: number;
    content: string;
    postId: number;
    username: string;
    created_at: string;
}

export default function Home() {
    const { data: session, status } = useSession();
    const router = useRouter();
    const [content, setContent] = useState('');
    const [posts, setPosts] = useState<Post[]>([]);
    const [editPost, setEditPost] = useState<Post | null>(null);
    const [activePostId, setActivePostId] = useState<number | null>(null);
    const [commentContent, setCommentContent] = useState('');
    const [activeCommentPostId, setActiveCommentPostId] = useState<number | null>(null);

    const formatDate = (date: Date): string => {
        const now = new Date();
        const diffInSeconds = Math.floor((now.getTime() - date.getTime()) / 1000);
    
        if (diffInSeconds < 60) return 'Just now';
        if (diffInSeconds < 3600) return `${Math.floor(diffInSeconds / 60)} minutes ago`;
        if (diffInSeconds < 86400) return `${Math.floor(diffInSeconds / 3600)} hours ago`;
        if (diffInSeconds < 604800) return `${Math.floor(diffInSeconds / 86400)} days ago`;
    
        return date.toLocaleDateString('en-US', { 
            year: 'numeric', 
            month: 'short', 
            day: 'numeric' 
        });
    }
    
    const sortPosts = (posts: Post[]): Post[] => {
        return [...posts].sort((a, b) => (b.timestamp || 0) - (a.timestamp || 0));
    }

    const fetchPostLikes = async (postId: number) => {
        const response = await fetch(`/api/likes?id=${postId}`);
        if (response.ok) {
            const data = await response.json();
            return { likes: data.likes, userLiked: data.userLiked };
        }
        return null;
    };

    const fetchComments = async (postId: number) => {
        const response = await fetch(`/api/comments?postId=${postId}`);
        if (response.ok) {
            const comments = await response.json();
            return comments.map((comment: Comment) => ({
                ...comment,
                created_at: formatDate(new Date(comment.created_at))
            }));
        }
        return [];
    };

    const fetchPosts = useCallback(async () => {
        const response = await fetch("/api/posts");
        const data = await response.json();
        const postsWithLikesAndComments = await Promise.all(data.map(async (post: Post) => {
            const likeData = await fetchPostLikes(post.id);
            const comments = await fetchComments(post.id);
            return {
                ...post,
                timestamp: new Date(post.created_at).getTime(),
                created_at: formatDate(new Date(post.created_at)),
                likes: likeData ? likeData.likes : post.likes,
                userLiked: likeData ? likeData.userLiked : false,
                comments: comments,
            };
        }));
        return postsWithLikesAndComments;
    }, []);

    useEffect(() => {
        if (status === "unauthenticated") {
            router.push('/');
        }
    }, [status, router]);

    useEffect(() => {
        const handleClickOutside = (event: MouseEvent) => {
            if (activePostId !== null && !(event.target as Element).closest('.post-options')) {
                setActivePostId(null);
            }
        };

        document.addEventListener('click', handleClickOutside);
        return () => document.removeEventListener('click', handleClickOutside);
    }, [activePostId]);

    useEffect(() => {
        const loadData = async () => {
            const fetchedPosts = await fetchPosts();
            setPosts(sortPosts(fetchedPosts));
        };
    
        loadData();
    
        const interval = setInterval(() => {
            setPosts(prevPosts => sortPosts(prevPosts.map(post => ({
                ...post,
                created_at: formatDate(new Date(post.created_at))
            }))));
        }, 30000);
    
        return () => clearInterval(interval);
    }, [fetchPosts]);
    
    const sortedPosts = useMemo(() => sortPosts(posts), [posts]);

    if (status === "loading") return <div>Loading...</div>;
    if (status === "unauthenticated") return null;

    const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
        e.preventDefault();
        const response = await fetch('/api/posts', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ username: session?.user?.username, content }),
        });
    
        if (response.ok) {
            setContent('');
            const newPost = await response.json();
            const newPostWithTimestamp = {
                ...newPost,
                timestamp: new Date(newPost.created_at).getTime(),
                created_at: formatDate(new Date(newPost.created_at))
            };
            setPosts(prevPosts => sortPosts([...prevPosts, newPostWithTimestamp]));
        } else {
            console.error('Failed to create post');
        }
    }

    const handleEllipsisClick = (postId: number) => {
        setActivePostId(activePostId === postId ? null : postId);
    }

    const handleEditClick = (post: Post) => {
        setEditPost(post);
    }

    const handleDeleteClick = async (postId: number) => {
        if (confirm('Are you sure you want to delete this post?')) {
            const response = await fetch(`/api/posts?id=${postId}`, {
                method: 'DELETE',
            });
            if (response.ok) {
                setPosts(posts.filter(p => p.id !== postId));
            }
        }
    }

    const handleDeleteCommentClick = async (commentId: number, commentUsername: string) => {
        if (commentUsername !== session?.user?.username) {
            console.error('You can only delete your own comments');
            return;
        }
    
        if (confirm('Are you sure you want to delete this comment?')) {
            const response = await fetch(`/api/comments?id=${commentId}`, {
                method: 'DELETE',
            });
            if (response.ok) {
                setPosts(posts.map(p => ({
                    ...p,
                    comments: p.comments.filter(c => c.id !== commentId)
                })));
            }
        }
    }

    const handleSaveEdit = async (post: Post) => {
        const response = await fetch(`/api/posts`, {
            method: 'PUT',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ id: post.id, content: post.content }),
        });
        if (response.ok) {
            setPosts(posts.map(p => p.id === post.id ? post : p));
            setEditPost(null);
        }
    }

    const handleChange = (e: React.ChangeEvent<HTMLTextAreaElement>) => {
        setContent(e.target.value);
    }

    const handleLikeClick = async (postId: number) => {
        const response = await fetch(`/api/likes`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ id: postId }),
        });
        if (response.ok) {
            const updatedLikeData = await response.json();
            setPosts(posts.map(p => p.id === postId ? {
                ...p,
                likes: updatedLikeData.likes,
                userLiked: updatedLikeData.action === 'liked'
            } : p));
        }
    }

    const handleCommentClick = (postId: number) => {
        setActiveCommentPostId(activeCommentPostId === postId ? null : postId);
    }

    const handleCommentSubmit = async (postId: number) => {
        if (!commentContent.trim()) return;
    
        const commentData = { 
            content: commentContent, 
            postId: postId, 
            username: session?.user?.username 
        };
    
        try {
            const response = await fetch('/api/comments', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(commentData),
            });
    
            if (response.ok) {
                const newComment = await response.json();
                setPosts(prevPosts => prevPosts.map(post => 
                    post.id === postId 
                        ? { ...post, comments: [...post.comments, {
                            ...newComment,
                            username: session?.user?.username,
                            created_at: formatDate(new Date(newComment.created_at))
                          }] }
                        : post
                ));
                setCommentContent('');
                setActiveCommentPostId(null);
            } else {
                const errorData = await response.json();
                console.error('Failed to create comment:', errorData);
                // Add more detailed error handling here
                if (!commentContent) console.error('Comment content is empty');
                if (!postId) console.error('PostId is missing');
                if (!session?.user?.username) console.error('Username is missing');
            }
        } catch (error) {
            console.error('Error creating comment:', error);
        }
    };

    const navigateToProfile = (username: string) => {
        router.push(`/profile/${username}`);
    }

    return (
        <>
            <header className="flex justify-between items-center px-2 mb-12">
                <Link href="/" className="flex items-center gap-1">
                    <Earth />
                    <h1 className="text-2xl font-bold">Globuddy</h1>
                </Link>

                <nav className="hidden sm:block">
                    <ul className="flex py-0">
                        <li className="text-black px-4 bg-gray-200 border-b-2 border-gray-400 transition-all duration-300 w-full flex justify-center items-center"><Link href="/home">Home</Link></li>
                        <li className="text-black px-4 py-2 hover:bg-gray-200 border-b-2 border-transparent hover:border-gray-400 transition-all duration-300 w-full flex justify-center"><Link href="/profile">Profile</Link></li>
                        <li className="text-black px-4 py-2 hover:bg-gray-200 border-b-2 border-transparent hover:border-gray-400 transition-all duration-300 w-full flex justify-center"><Link href="/messages">Messages</Link></li>
                        <li className="text-black px-4 py-2 hover:bg-gray-200 border-b-2 border-transparent hover:border-gray-400 transition-all duration-300 w-full flex justify-center"><Link href="/settings">Settings</Link></li>
                    </ul>
                </nav>

                <div className="flex items-center justify-center gap-2 sm:hidden">
                    <Sheet>
                        <SheetTrigger className="flex items-center justify-center">
                            <Menu />
                        </SheetTrigger>
                        <SheetContent className="flex flex-col items-center gap-12">
                            <SheetHeader>
                                <SheetTitle>Menu</SheetTitle>
                            </SheetHeader>
                            
                            <nav className="flex flex-col items-center gap-8 text-lg">
                                <Link href="/home" className="hover:scale-105 transition-all duration-300">Home</Link>
                                <Link href="/profile" className="hover:scale-105 transition-all duration-300">Profile</Link>
                                <Link href="/messages" className="hover:scale-105 transition-all duration-300">Messages</Link>
                                <Link href="/settings" className="hover:scale-105 transition-all duration-300">Settings</Link>
                            </nav>
                        </SheetContent>
                    </Sheet>
                </div>
            </header>

            <main className="flex flex-col items-center grow gap-8">
                <section className="flex flex-col gap-8 w-full max-w-2xl mx-auto bg-white p-4 sm:rounded-md border border-gray-300">
                    <div>
                        <h2 className="text-2xl font-bold">Create a New Post</h2>
                        <p className="text-gray-500 text-sm">Share your thoughts or find a language partner</p>
                    </div>

                    <form onSubmit={handleSubmit} className="flex flex-col gap-4">
                        <textarea 
                            name="content" 
                            placeholder="What's on your mind? Share your language learning goals or ask for a partner to practice with..."
                            className="w-full p-2 border border-gray-300 rounded-md placeholder:text-sm"
                            onChange={handleChange}
                            value={content}
                        />
                        <button type="submit" className="bg-black text-white p-2 px-4 rounded-md text-sm w-min">Post</button>
                    </form>
                </section>

                <section className="flex flex-col gap-8 w-full max-w-2xl mx-auto bg-white p-4 sm:rounded-md border border-gray-300">
                    <h2 className="text-2xl font-bold">Posts</h2>

                    <div className="flex flex-col gap-4">
                        {sortedPosts.map((post) => (
                            <article key={post.id} className="flex flex-col relative">
                                <div className="flex gap-2 items-center relative">
                                    <div className="flex items-center">
                                        <CircleUserRound className="w-10 h-10" onClick={() => navigateToProfile(post.username)} />
                                    </div>

                                    <div className="flex flex-col flex-grow">
                                        <div className="flex items-center gap-2 justify-between">
                                            <div className="flex items-center gap-2">
                                                <h3 className="text-lg font-bold" onClick={() => navigateToProfile(post.username)}>{post.username}</h3>
                                                <p className="text-gray-500 text-sm">{post.created_at}</p>
                                            </div>
                                            {post.username === session?.user?.username && (
                                                <button onClick={() => handleEllipsisClick(post.id)}><Ellipsis className="w-4 h-4" /></button>
                                            )}
                                        </div>

                                        {editPost?.id === post.id ? (
                                            <div className="flex gap-2">
                                                <input 
                                                    type="text" 
                                                    value={editPost.content} 
                                                    onChange={(e) => setEditPost({...editPost, content: e.target.value})}
                                                    className="flex-grow p-1 border rounded"
                                                />
                                                <button onClick={() => handleSaveEdit(editPost)} className="bg-gray-300 px-2 py-1 rounded">Save</button>
                                                <button onClick={() => setEditPost(null)} className="bg-gray-300 px-2 py-1 rounded">Cancel</button>
                                            </div>
                                        ) : (
                                            <p className="text-sm">{post.content}</p>
                                        )}

                                        <div className="flex items-center gap-4">
                                            <button 
                                                onClick={() => handleLikeClick(post.id)}
                                                className={`${post.userLiked ? 'text-blue-500' : 'text-gray-500'} text-sm flex gap-1`}
                                            >
                                                <ThumbsUp className="w-4 h-4" /> {post.likes}
                                            </button>

                                            <button 
                                                onClick={() => handleCommentClick(post.id)}
                                                className="text-gray-500 text-sm flex gap-1 items-center hover:text-gray-700"
                                            >
                                                <MessageSquare className="w-4 h-4" /> {post.comments.length}
                                            </button>
                                        </div>
                                    </div>

                                    {activePostId === post.id && (
                                        <div className="absolute -right-24 -top-4 mt-1 bg-white border rounded shadow-lg p-2">
                                            <button onClick={() => handleEditClick(post)} className="block w-full text-left py-1 px-2 hover:bg-gray-100">Edit</button>
                                            <button onClick={() => handleDeleteClick(post.id)} className="block w-full text-left py-1 px-2 hover:bg-gray-100">Delete</button>
                                        </div>
                                    )}
                                </div>

                                {activeCommentPostId === post.id && (
                                    <div className="mt-2">
                                    <textarea
                                        value={commentContent}
                                        onChange={(e) => setCommentContent(e.target.value)}
                                        placeholder="Write a comment..."
                                        className="w-full p-2 border border-gray-300 rounded-md"
                                    />
                                        <button 
                                            onClick={() => handleCommentSubmit(post.id)}
                                            className="mt-2 bg-black text-white p-1 px-3 rounded-md text-sm"
                                        >
                                            Comment
                                        </button>
                                        
                                        <div className="mt-4 flex flex-col gap-2">
                                            {post.comments.map((comment) => (
                                                <div key={comment.id} className="mb-2 ml-4 flex gap-2 w-full justify-between">
                                                    <div className="flex items-center gap-2">
                                                        <div className="flex items-center gap-2">
                                                            <CircleUserRound className="w-8 h-8" onClick={() => navigateToProfile(comment.username)} />                                                       
                                                        </div>

                                                        <div className="flex flex-col">
                                                            <p className="font-bold" onClick={() => navigateToProfile(comment.username)}>{comment.username}</p>
                                                            <p className="text-sm">{comment.content}</p>
                                                            <p className="text-xs text-gray-500">{comment.created_at}</p>
                                                        </div>
                                                    </div>

                                                    {comment.username === session?.user?.username && (
                                                        <div className="flex items-center gap-2 text-sm mr-4">
                                                            <button onClick={() => handleDeleteCommentClick(comment.id, comment.username)} className="hover:text-red-500">Delete</button>
                                                        </div>
                                                    )}
                                                </div>
                                            ))}
                                        </div>
                                    </div>
                                )}
                    
                                <span className="border-b border-gray-300 mt-4"></span>
                            </article>
                        ))}
                    </div>
                </section>
            </main>
                    
            <footer className="flex flex-col items-center justify-center py-2 text-sm mt-12">
                <p>© 2024 Globuddy. All rights reserved.</p>
            </footer>
        </>
    );
}
                