"use client";

import { getLanguageAcronym } from "./languageAcronyms";
import Link from "next/link";
import { Earth, Ellipsis, ThumbsUp, MessageSquare, Menu, Trash2, Pencil } from "lucide-react";
import { useSession } from "next-auth/react";
import { useRouter } from "next/navigation";
import { useEffect, useState, useCallback, useMemo } from "react";
import Image from "next/image";
import {
    Sheet,
    SheetContent,
    SheetHeader,
    SheetTitle,
    SheetTrigger,
} from "@/components/ui/sheet"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog"
import { Button } from "@/components/ui/button"
import { Avatar, AvatarImage, AvatarFallback } from "@/components/ui/avatar"

type Post = {
    id: number;
    content: string;
    username: string;
    created_at: string;
    likes: number;
    comments: Comment[];
    userLiked: boolean;
    timestamp?: number;
    user: User;
}

type Comment = {
    id: number;
    content: string;
    postId: number;
    username: string;
    created_at: string;
    user: User;
}

type User = {
    id: number;
    username: string;
    avatar_url: string | null;
    native_language: string;
    languages: string[];
}

function shuffleArray<T>(array: T[]): T[] {
    const shuffled = [...array];
    for (let i = shuffled.length - 1; i > 0; i--) {
        const j = Math.floor(Math.random() * (i + 1));
        [shuffled[i], shuffled[j]] = [shuffled[j], shuffled[i]];
    }
    return shuffled;
}

export default function Home() {
    const { data: session, status } = useSession();
    const router = useRouter();
    const [content, setContent] = useState('');
    const [allPosts, setAllPosts] = useState<Post[]>([]);
    const [userLanguages, setUserLanguages] = useState<{ native_language: string, languages: string[] }>({ native_language: '', languages: [] });
    const [activeTab, setActiveTab] = useState('foryou');
    const [notificationCount, setNotificationCount] = useState(0);
    const [editPost, setEditPost] = useState<Post | null>(null);
    const [activePostId, setActivePostId] = useState<number | null>(null);
    const [commentContent, setCommentContent] = useState('');
    const [activeCommentPostId, setActiveCommentPostId] = useState<number | null>(null);
    const [isDeleteDialogOpen, setIsDeleteDialogOpen] = useState(false);
    const [postToDelete, setPostToDelete] = useState<Post | null>(null);
    const [allUsers, setAllUsers] = useState<User[]>([]);

    const formatDate = (date: Date): string => {
        const now = new Date();
        const diffInSeconds = Math.floor((now.getTime() - date.getTime()) / 1000);
        if (diffInSeconds < 60) return 'Just now';
        if (diffInSeconds < 3600) return `${Math.floor(diffInSeconds / 60)} minutes ago`;
        if (diffInSeconds < 86400) return `${Math.floor(diffInSeconds / 3600)} hours ago`;
        if (diffInSeconds < 604800) return `${Math.floor(diffInSeconds / 86400)} days ago`;
        return date.toLocaleDateString('en-US', { year: 'numeric', month: 'short', day: 'numeric' });
    }

    const getAvatarUrl = useCallback((user: User | undefined) => {
        if (user?.avatar_url) {
            return user.avatar_url;
        } else {
            return "/avatars/user.png";
        }
    }, []);

    const fetchPosts = useCallback(async () => {
        const response = await fetch("/api/posts");
        const data = await response.json();
        console.log(data);
        const postsWithDetails = await Promise.all(data.map(async (post: Post) => {
            const likeData = await fetch(`/api/likes?id=${post.id}`).then(res => res.json());
            const comments = await fetch(`/api/comments?postId=${post.id}`).then(res => res.json());
            const userData = await fetch(`/api/users?username=${post.user.username}`).then(res => res.json());
            return {
                ...post,
                timestamp: new Date(post.created_at).getTime(),
                created_at: formatDate(new Date(post.created_at)),
                likes: likeData ? likeData.likes : post.likes,
                userLiked: likeData ? likeData.userLiked : false,
                comments: comments,
                user: {
                    ...post.user,
                    languages: userData.languages,
                    avatar_url: userData.avatar_url || post.user.avatar_url
                }
            };
        }));
        setAllPosts(postsWithDetails.sort((a, b) => b.timestamp - a.timestamp));
    }, []);

    const fetchUserLanguages = useCallback(async (username: string) => {
        const [userResponse, allUsersResponse] = await Promise.all([
            fetch(`/api/users?username=${username}`),
            fetch('/api/users')
        ]);
    
        if (userResponse.ok && allUsersResponse.ok) {
            const userData = await userResponse.json();
            const allUsers = await allUsersResponse.json();
    
            setUserLanguages({
                native_language: userData.native_language,
                languages: userData.languages
            });
    
            // Store all users in state
            setAllUsers(allUsers);
        }
    }, []);

    const fetchNotificationCount = useCallback(async () => {
        if (session?.user?.username) {
            const response = await fetch(`/api/notifications?username=${session.user.username}&countOnly=true`);
            if (response.ok) {
                const { count } = await response.json();
                setNotificationCount(count);
            }
        }
    }, [session?.user?.username]);

    const matchingUsers = useMemo(() => {
        if (userLanguages.native_language && userLanguages.languages.length > 0) {
            return allUsers.filter(user => 
                user.native_language !== userLanguages.native_language &&
                user.languages.includes(userLanguages.native_language) &&
                userLanguages.languages.includes(user.native_language)
            );
        }
        return [];
    }, [allUsers, userLanguages]);

    const fourRandomMatchingUsers = useMemo(() => {
        return shuffleArray(matchingUsers).slice(0, 4);
    }, [matchingUsers]);

    useEffect(() => {
        if (status === "authenticated" && session?.user?.username) {
            fetchUserLanguages(session.user.username);
            fetchPosts();
            fetchNotificationCount();
            const intervalId = setInterval(fetchNotificationCount, 60000);
            return () => clearInterval(intervalId);
        } else if (status === "unauthenticated") {
            router.push('/');
        }
    }, [status, session?.user?.username, router, fetchUserLanguages, fetchPosts, fetchNotificationCount]);

    const filteredPosts = useMemo(() => {
        return allPosts.filter(post => 
            userLanguages.languages.includes(post.user.native_language) ||
            post.user.languages.some(lang => userLanguages.native_language === lang)
        );
    }, [allPosts, userLanguages]);

    const displayPosts = useMemo(() => {
        return activeTab === 'foryou' ? filteredPosts : allPosts;
    }, [activeTab, filteredPosts, allPosts]);

    const handleTabChange = (value: string) => {
        setActiveTab(value);
    };

    const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
        e.preventDefault();
        const response = await fetch('/api/posts', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ username: session?.user?.username, content }),
        });
        if (response.ok) {
            setContent('');
            fetchPosts(); // Refetch all posts after creating a new one
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

    const handleDeleteClick = (post: Post) => {
        setPostToDelete(post);
        setIsDeleteDialogOpen(true);
    }

    const confirmDelete = async () => {
        if (postToDelete) {
            try {
                const response = await fetch(`/api/posts?id=${postToDelete.id}&username=${session?.user?.username}`, {
                    method: 'DELETE',
                });
                if (response.ok) {
                    fetchPosts(); // Refetch all posts after deleting
                    setIsDeleteDialogOpen(false);
                } else {
                    console.error('Failed to delete post:', await response.json());
                }
            } catch (error) {
                console.error('Error deleting post:', error);
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
                fetchPosts(); // Refetch all posts after deleting a comment
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
            fetchPosts(); // Refetch all posts after editing
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
            fetchPosts(); // Refetch all posts after liking
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
                fetchPosts(); // Refetch all posts after adding a comment
                setCommentContent('');
                setActiveCommentPostId(null);
            } else {
                const errorData = await response.json();
                console.error('Failed to create comment:', errorData);
            }
        } catch (error) {
            console.error('Error creating comment:', error);
        }
    };

    const navigateToProfile = (username: string) => {
        router.push(`/profile/${username}`);
    }

    if (status === "loading") return <div>Loading...</div>;
    if (status === "unauthenticated") return null;

    return (
        <>
            <header className="flex justify-between items-center sm:pl-4 max-sm:px-4 max-sm:pt-2 mb-12">
                <Link href="/" className="flex items-center gap-1">
                    <Earth />
                    <h1 className="text-2xl font-bold">Globuddy</h1>
                </Link>
                <nav className="hidden sm:block">
                    <ul className="flex py-0">
                        <li className="text-black px-4 bg-gray-200 border-b-2 border-gray-400 transition-all duration-300 w-full flex justify-center items-center"><Link href="/home">Home</Link></li>
                        <li className="text-black px-4 py-2 hover:bg-gray-200 border-b-2 border-transparent hover:border-gray-400 transition-all duration-300 w-full flex justify-center"><Link href="/profile">Profile</Link></li>
                        <li className="text-black px-4 py-2 hover:bg-gray-200 border-b-2 border-transparent hover:border-gray-400 transition-all duration-300 w-full flex justify-center"><Link href="/messages">Messages</Link></li>
                        <li className="text-black px-4 py-2 hover:bg-gray-200 border-b-2 border-transparent hover:border-gray-400 transition-all duration-300 w-full flex justify-center">
                            <Link href="/notifications" className="flex items-center gap-2">
                                Notifications
                                {notificationCount > 0 && (
                                    <span className="bg-red-500 text-white rounded-full text-xs w-5 h-5 flex justify-center items-center">
                                        {notificationCount}
                                    </span>
                                )}
                            </Link>
                        </li>
                        <li className="text-black px-4 py-2 hover:bg-gray-200 border-b-2 border-transparent hover:border-gray-400 transition-all duration-300 w-full hidden"><Link href="/settings">Settings</Link></li>
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
                                <Link href="/notifications" className="hover:scale-105 transition-all duration-300 flex items-center gap-2">
                                    Notifications
                                    {notificationCount > 0 && (
                                        <span className="bg-red-500 text-white rounded-full text-xs w-5 h-5 flex justify-center items-center">
                                            {notificationCount}
                                        </span>
                                    )}
                                </Link>
                                <Link href="/settings" className="hover:scale-105 transition-all duration-300 hidden">Settings</Link>
                            </nav>
                        </SheetContent>
                    </Sheet>
                </div>
            </header>

            <main className="flex flex-col items-center grow gap-8">
                <section className="flex flex-col gap-8 w-full max-w-2xl mx-auto bg-white p-4 sm:rounded-md border border-gray-300">
                    <h2 className="text-2xl font-bold max-sm:text-center">Language Exchange Partners</h2>
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 max-sm:justify-center max-sm:items-center max-sm:flex max-sm:flex-col">
                        {fourRandomMatchingUsers.map((user) => (
                            <div key={user.id} 
                                className="flex items-center sm:gap-4 p-4 border rounded-md hover:cursor-pointer max-sm:flex-col max-sm:items-center max-sm:justify-center max-sm:text-center max-sm:w-[80%]" 
                                onClick={() => navigateToProfile(user.username)}
                            >
                                <Avatar className="w-12 h-12">
                                    <AvatarImage src={getAvatarUrl(user)} alt={user.username} />
                                    <AvatarFallback>{user.username[0].toUpperCase()}</AvatarFallback>
                                </Avatar>

                                <div>
                                    <h3 className="font-bold">{user.username}</h3>
                                    <p className="text-sm text-gray-600">
                                        {getLanguageAcronym(user.native_language)} → {user.languages.map(getLanguageAcronym).join(', ')}
                                    </p>
                                </div>
                            </div>
                        ))}
                    </div>
                    {matchingUsers.length === 0 && (
                        <p className="text-center text-gray-500">No matching users found. Keep checking back!</p>
                    )}
                </section>

                <section className="flex flex-col gap-8 w-full max-w-2xl mx-auto bg-white p-4 sm:rounded-md border border-gray-300">
                    <div className="max-sm:text-center">
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
                        <button type="submit" className="bg-black text-white p-2 px-4 rounded-md text-sm w-min max-sm:w-full">Post</button>
                    </form>
                </section>

                <Tabs defaultValue="foryou" className="flex flex-col w-full max-w-2xl mx-auto bg-white p-4 sm:rounded-md border border-gray-300" onValueChange={handleTabChange}>
                    <h2 className="text-2xl font-bold mb-4 max-sm:text-center">Posts</h2>
                    <TabsList>
                        <TabsTrigger value="foryou" className="w-full">For You</TabsTrigger>
                        <TabsTrigger value="allposts" className="w-full">All Posts</TabsTrigger>
                    </TabsList>

                    <TabsContent value="foryou" className="flex flex-col gap-8 w-full max-w-2xl">
                        <div className="flex flex-col gap-4">
                            {displayPosts.length > 0 ? (
                                displayPosts.map((post) => (
                                    <article key={post.id} className="flex flex-col relative">
                                        <div className="flex gap-2 items-center relative">
                                            <div className="flex items-center">
                                                <Image
                                                    src={getAvatarUrl(post.user)}
                                                    alt={post.username[0].toUpperCase()}
                                                    width={50}
                                                    height={50}
                                                    className="rounded-full border-2 border-gray-200 hover:cursor-pointer"
                                                    onClick={() => navigateToProfile(post.username)}
                                                />
                                            </div>

                                            <div className="flex flex-col flex-grow">
                                                <div className="flex items-center gap-2 justify-between">
                                                    <div className="flex items-center gap-2">
                                                        <div className="flex items-center gap-2">
                                                            <h3 className="text-lg font-bold hover:cursor-pointer" onClick={() => navigateToProfile(post.username)}>{post.username}</h3>
                                                            <p className="text-gray-500 text-xs sm:block hidden">
                                                                {getLanguageAcronym(post.user?.native_language || 'Native Language')} -&nbsp;
                                                                {post.user?.languages ? post.user.languages.map(getLanguageAcronym).join(', ') : 'Languages'}
                                                            </p>
                                                        </div>
                                                        <p className="text-gray-500 text-sm sm:block hidden">{post.created_at}</p>
                                                    </div>
                                                    {post.username === session?.user?.username && (
                                                        <>
                                                            <button onClick={() => handleEllipsisClick(post.id)} className="max-sm:hidden"><Ellipsis className="w-4 h-4" /></button>

                                                            <div className="flex gap-2 sm:hidden">
                                                                <Dialog open={editPost?.id === post.id} onOpenChange={(open) => !open && setEditPost(null)}>
                                                                    <DialogTrigger asChild>
                                                                        <button onClick={() => handleEditClick(post)}><Pencil className="w-4 h-4" /></button>
                                                                    </DialogTrigger>

                                                                    <DialogContent>
                                                                        <DialogHeader>
                                                                            <DialogTitle>Edit Post</DialogTitle>
                                                                        </DialogHeader>
                                                                        <textarea
                                                                            value={editPost?.content || ''}
                                                                            onChange={(e) => setEditPost(prev => prev ? {...prev, content: e.target.value} : null)}
                                                                            className="w-full p-2 border rounded resize-none"
                                                                            rows={4}
                                                                        />
                                                                        <DialogFooter className="flex flex-col gap-2">
                                                                            <Button onClick={() => setEditPost(null)}>Cancel</Button>
                                                                            <Button onClick={() => editPost && handleSaveEdit(editPost)}>Save</Button>
                                                                        </DialogFooter>
                                                                    </DialogContent>
                                                                </Dialog>

                                                                <Dialog open={isDeleteDialogOpen && postToDelete?.id === post.id} onOpenChange={setIsDeleteDialogOpen}>
                                                                    <DialogTrigger asChild>
                                                                        <button onClick={() => handleDeleteClick(post)}><Trash2 className="w-4 h-4" /></button>
                                                                    </DialogTrigger>

                                                                    <DialogContent>
                                                                        <DialogHeader>
                                                                            <DialogTitle>Delete Post</DialogTitle>
                                                                            <DialogDescription>Are you sure you want to delete this post? This action cannot be undone.</DialogDescription>
                                                                        </DialogHeader>
                                                                        <DialogFooter className="flex flex-col gap-2">
                                                                            <Button onClick={() => setIsDeleteDialogOpen(false)}>Cancel</Button>
                                                                            <Button onClick={confirmDelete} variant="destructive">Delete</Button>
                                                                        </DialogFooter>
                                                                    </DialogContent>
                                                                </Dialog>
                                                            </div>
                                                        </>
                                                    )}
                                                </div>
                                                {editPost?.id === post.id ? (
                                                    <div className="flex gap-2">
                                                        <input
                                                            type="text"
                                                            value={editPost.content}
                                                            onChange={(e) => setEditPost({ ...editPost, content: e.target.value })}
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
                                                <div className="flex gap-2">
                                                    <button onClick={() => handleEditClick(post)}><Pencil className="w-4 h-4" /></button>
                                                    <button onClick={() => handleDeleteClick(post)}><Trash2 className="w-4 h-4" /></button>
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
                                                                    <Image
                                                                        src={getAvatarUrl(comment.user)}
                                                                        alt={comment.username[0].toUpperCase()}
                                                                        width={50}
                                                                        height={50}
                                                                        className="rounded-full border-2 border-gray-200 hover:cursor-pointer sm:block hidden"
                                                                        onClick={() => navigateToProfile(comment.username)}
                                                                    />
                                                                </div>
                                                                <div className="flex flex-col">
                                                                    <p className="font-bold hover:cursor-pointer" onClick={() => navigateToProfile(comment.username)}>{comment.username}</p>
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
                                ))
                            ) : (
                                <p className="max-sm:text-center">{activeTab === 'foryou' ? "There are no users learning your language yet. Be the first!" : "No posts yet. Be the first to post!"}</p>
                            )}
                        </div>
                    </TabsContent>

                    <TabsContent value="allposts" className="flex flex-col gap-8 w-full max-w-2xl">
                        <div className="flex flex-col gap-4">
                            {displayPosts.length > 0 ? (
                                displayPosts.map((post) => (
                                    <article key={post.id} className="flex flex-col relative">
                                        <div className="flex gap-2 items-center relative">
                                            <div className="flex items-center">
                                                <Image
                                                    src={getAvatarUrl(post.user)}
                                                    alt={post.username[0].toUpperCase()}
                                                    width={50}
                                                    height={50}
                                                    className="rounded-full border-2 border-gray-200 hover:cursor-pointer"
                                                    onClick={() => navigateToProfile(post.username)}
                                                />
                                            </div>

                                            <div className="flex flex-col flex-grow">
                                                <div className="flex items-center gap-2 justify-between">
                                                    <div className="flex items-center gap-2">
                                                        <div className="flex items-center gap-2">
                                                            <h3 className="text-lg font-bold hover:cursor-pointer" onClick={() => navigateToProfile(post.username)}>{post.username}</h3>
                                                            <p className="text-gray-500 text-xs sm:block hidden">
                                                                {getLanguageAcronym(post.user?.native_language || 'Native Language')} -&nbsp;
                                                                {post.user?.languages ? post.user.languages.map(getLanguageAcronym).join(', ') : 'Languages'}
                                                            </p>
                                                        </div>
                                                        <p className="text-gray-500 text-sm sm:block hidden">{post.created_at}</p>
                                                    </div>
                                                    {post.username === session?.user?.username && (
                                                        <>
                                                            <button onClick={() => handleEllipsisClick(post.id)} className="max-sm:hidden"><Ellipsis className="w-4 h-4" /></button>

                                                            <div className="flex gap-2 sm:hidden">
                                                                <Dialog open={editPost?.id === post.id} onOpenChange={(open) => !open && setEditPost(null)}>
                                                                    <DialogTrigger asChild>
                                                                        <button onClick={() => handleEditClick(post)}><Pencil className="w-4 h-4" /></button>
                                                                    </DialogTrigger>

                                                                    <DialogContent>
                                                                        <DialogHeader>
                                                                            <DialogTitle>Edit Post</DialogTitle>
                                                                        </DialogHeader>
                                                                        <textarea
                                                                            value={editPost?.content || ''}
                                                                            onChange={(e) => setEditPost(prev => prev ? {...prev, content: e.target.value} : null)}
                                                                            className="w-full p-2 border rounded resize-none"
                                                                            rows={4}
                                                                        />
                                                                        <DialogFooter className="flex flex-col gap-2">
                                                                            <Button onClick={() => setEditPost(null)}>Cancel</Button>
                                                                            <Button onClick={() => editPost && handleSaveEdit(editPost)}>Save</Button>
                                                                        </DialogFooter>
                                                                    </DialogContent>
                                                                </Dialog>

                                                                <Dialog open={isDeleteDialogOpen && postToDelete?.id === post.id} onOpenChange={setIsDeleteDialogOpen}>
                                                                    <DialogTrigger asChild>
                                                                        <button onClick={() => handleDeleteClick(post)}><Trash2 className="w-4 h-4" /></button>
                                                                    </DialogTrigger>

                                                                    <DialogContent>
                                                                        <DialogHeader>
                                                                            <DialogTitle>Delete Post</DialogTitle>
                                                                            <DialogDescription>Are you sure you want to delete this post? This action cannot be undone.</DialogDescription>
                                                                        </DialogHeader>
                                                                        <DialogFooter className="flex flex-col gap-2">
                                                                            <Button onClick={() => setIsDeleteDialogOpen(false)}>Cancel</Button>
                                                                            <Button onClick={confirmDelete} variant="destructive">Delete</Button>
                                                                        </DialogFooter>
                                                                    </DialogContent>
                                                                </Dialog>
                                                            </div>
                                                        </>
                                                    )}
                                                </div>
                                                {editPost?.id === post.id ? (
                                                    <div className="flex gap-2">
                                                        <input
                                                            type="text"
                                                            value={editPost.content}
                                                            onChange={(e) => setEditPost({ ...editPost, content: e.target.value })}
                                                            className="flex-grow p-1 border rounded"
                                                        />

                                                        <div className="flex gap-2">
                                                            <button onClick={() => handleSaveEdit(editPost)} className="bg-gray-300 px-2 py-1 rounded">Save</button>
                                                            <button onClick={() => setEditPost(null)} className="bg-gray-300 px-2 py-1 rounded">Cancel</button>
                                                        </div>
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
                                                <div className="flex gap-2 absolute top-8 right-0">
                                                    <button onClick={() => handleEditClick(post)}><Pencil className="w-4 h-4" /></button>
                                                    <button onClick={() => handleDeleteClick(post)}><Trash2 className="w-4 h-4" /></button>
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
                                                                    <Image
                                                                        src={getAvatarUrl(comment.user)}
                                                                        alt={comment.username[0].toUpperCase()}
                                                                        width={50}
                                                                        height={50}
                                                                        className="rounded-full border-2 border-gray-200 hover:cursor-pointer sm:block hidden"
                                                                        onClick={() => navigateToProfile(comment.username)}
                                                                    />
                                                                </div>
                                                                <div className="flex flex-col">
                                                                    <p className="font-bold hover:cursor-pointer" onClick={() => navigateToProfile(comment.username)}>{comment.username}</p>
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
                                ))
                            ) : (
                                <p className="max-sm:text-center">No posts yet. Be the first to post!</p>
                            )}
                        </div>
                    </TabsContent>
                </Tabs>
            </main>
            <footer className="flex flex-col items-center justify-center py-2 text-sm mt-12 text-center">
                <p>© 2024 Globuddy. All rights reserved.</p>
            </footer>
        </>
    );
}
