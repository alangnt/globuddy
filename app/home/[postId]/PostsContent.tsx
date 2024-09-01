"use client";

import Link from "next/link";
import { Earth, Menu, ThumbsUp, MessageSquare } from "lucide-react";
import { useSession } from "next-auth/react";
import { useRouter } from "next/navigation";
import { useEffect, useState, useCallback } from "react";
import Image from "next/image";
import { Button } from "@/components/ui/button";
import {
    Sheet,
    SheetContent,
    SheetHeader,
    SheetTitle,
    SheetTrigger,
} from "@/components/ui/sheet"
import { formatDistanceToNow, parseISO } from "date-fns";
import { Session } from "next-auth";

type Post = {
    id: number;
    username: string;
    avatar_url: string | null;
    content: string;
    created_at: string;
    likes: number;
    comments: number;
    userLiked: boolean;
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

type Like = {
    id: number;
    username: string;
    postId: number;
}

type User = {
    id: number;
    username: string;
    avatar_url: string | null;
    native_language: string;
    languages: string[];
    bio: string | null;
    posts?: Post[];
}

export default function PostsContent({ post: initialPost }: { post: Post }) {
    const { data: session, status } = useSession();
    const router = useRouter();
    const [post, setPost] = useState<Post>(initialPost);
    const [userPosts, setUserPosts] = useState<Post[]>([]);
    const [notificationCount, setNotificationCount] = useState(0);
    const [commentContent, setCommentContent] = useState('');
    const [isLoading, setIsLoading] = useState(false);
    const [likes, setLikes] = useState<Like[]>([]);
    const [comments, setComments] = useState<Comment[]>([]);
    const [following, setFollowing] = useState(false);
    const [user, setUser] = useState<User>(post.user);

    const navigateToProfile = useCallback((username: string) => {
        router.push(`/profile/${encodeURIComponent(username)}`);
    }, [router]);

    const formatDate = useCallback((dateString: string) => {
        try {
            const date = parseISO(dateString);
            return formatDistanceToNow(date, { addSuffix: true });
        } catch (error) {
            console.error('Error parsing date:', error);
            return 'Date unknown';
        }
    }, []);

    const getAvatarUrl = useCallback((avatarUrl: string | null) => {
        return avatarUrl || "/avatars/user.png";
    }, []);

    const fetchPost = useCallback(async () => {
        try {
            const response = await fetch(`/api/post?postId=${post.id}`);
            if (!response.ok) throw new Error('Failed to fetch post');
            const data = await response.json();
            setPost(data);
        } catch (error) {
            console.error('Error fetching post:', error);
        }
    }, [post.id]);

    const fetchUserPosts = useCallback(async () => {
        if (!user.username) return;
        try {
          const response = await fetch(`/api/users?username=${encodeURIComponent(user.username)}`);
          if (!response.ok) throw new Error('Failed to fetch user posts');
          const data = await response.json();
          setUserPosts(data.posts);
        } catch (error) {
          console.error('Error fetching user posts:', error);
        }
    }, [user.username]);
    
    const fetchComments = useCallback(async () => {
        try {
            const response = await fetch(`/api/comments?postId=${post.id}`);
            if (!response.ok) throw new Error('Failed to fetch comments');
            const data = await response.json();
            setComments(data);
        } catch (error) {
            console.error('Error fetching comments:', error);
        }
    }, [post.id]);

    const handleLikeClick = useCallback(async (postId: number) => {
        try {
            const response = await fetch(`/api/likes`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ id: postId }),
            });
            if (!response.ok) throw new Error('Failed to like post');
            fetchPost();
        } catch (error) {
            console.error('Error liking post:', error);
        }
    }, [fetchPost]);

    const fetchNotificationCount = useCallback(async () => {
        if (!session?.user?.username) return;
        try {
            const response = await fetch(`/api/notifications?username=${session.user.username}&countOnly=true`);
            if (!response.ok) throw new Error('Failed to fetch notifications');
            const { count } = await response.json();
            setNotificationCount(count);
        } catch (error) {
            console.error('Error fetching notifications:', error);
        }
    }, [session?.user?.username]);

    useEffect(() => {
        if (status === "authenticated") {
          fetchPost();
          fetchNotificationCount();
          fetchComments();
          fetchUserPosts();
          const intervalId = setInterval(fetchNotificationCount, 60000);
          return () => clearInterval(intervalId);
        } else if (status === "unauthenticated") {
          router.push('/');
        }
      }, [status, fetchPost, fetchNotificationCount, router, fetchComments, fetchUserPosts]);

    const handleCommentSubmit = async () => {
        if (!commentContent.trim() || !session?.user?.username) return;
        setIsLoading(true);
        try {
            const response = await fetch('/api/comments', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ content: commentContent, postId: post.id, username: session.user.username }),
            });
            if (!response.ok) throw new Error('Failed to create comment');
            setCommentContent('');
            fetchPost();
        } catch (error) {
            console.error('Error creating comment:', error);
        } finally {
            setIsLoading(false);
        }
    };

    const fetchUserData = useCallback(async () => {
        try {
            const response = await fetch(`/api/users?username=${user.username}`);
            if (!response.ok) throw new Error('Failed to fetch user data');
            const data = await response.json();
            setUser(data);
        } catch (error) {
            console.error('Error fetching user data:', error);
        }
    }, [user.username]);

    const handleFollowClick = async () => {
        if (!session?.user?.username) {
            console.error("User not logged in");
            return;
        }
    
        try {
            const method = following ? 'DELETE' : 'POST';
            const encodedSessionUsername = encodeURIComponent(session.user.username);
            const encodedProfileUsername = encodeURIComponent(user.username);
            const response = await fetch(`/api/connect?user.username=${encodedSessionUsername}&username=${encodedProfileUsername}`, {
                method: method,
            });
            if (!response.ok) {
                const errorData = await response.json();
                throw new Error(errorData.error || `Failed to ${following ? 'unfollow' : 'follow'}`);
            }
    
            const data = await response.json();
    
            setUser(prevUser => ({
                ...prevUser,
                followers: data.followers,
                following: data.following
            }));
    
            setFollowing(!following);
    
            await fetchUserData();
        } catch (error) {
            console.error(`Failed to ${following ? 'unfollow' : 'follow'}:`, error);
        }
    }
    
    useEffect(() => {
        const checkFollowingStatus = async () => {
            if (session?.user?.username) {
                try {
                    const encodedSessionUsername = encodeURIComponent(session.user.username);
                    const encodedProfileUsername = encodeURIComponent(user.username);
                    const response = await fetch(`/api/connect?user.username=${encodedSessionUsername}&username=${encodedProfileUsername}`, {
                        method: 'GET',
                    });
                    if (!response.ok) {
                        const errorData = await response.json();
                        throw new Error(errorData.error || 'Failed to fetch follow status');
                    }
                    const data = await response.json();
                    setFollowing(data.isFollowing);
                } catch (error) {
                    console.error('Error checking follow status:', error);
                }
            }
        };
        checkFollowingStatus();
    }, [session, user.username]);
    
    const navigateToPost = (postId: number) => {
        router.push(`/home/${postId}`);
    };

    const userMentioned = post.content.includes(`@${user.username}`);

    const handleMentionClick = () => {
        router.push(`/profile/${encodeURIComponent(user.username)}`);
    }

    if (status === "loading" || isLoading) return <div>Loading...</div>;
    if (status === "unauthenticated") return null;

    return (
        <>
            <Header notificationCount={notificationCount} />
            <main className="sm:container mb-12">
                <div className="flex max-sm:flex-col justify-center gap-6 grow">
                    <section className="flex flex-col gap-6 sm:w-[70%]">
                        <PostDisplay 
                            post={post} 
                            getAvatarUrl={getAvatarUrl} 
                            navigateToProfile={navigateToProfile} 
                            formatDate={formatDate} 
                            handleLikeClick={handleLikeClick} 
                            likes={likes.length}
                        />
                        <CommentSection 
                            comments={comments} 
                            getAvatarUrl={getAvatarUrl} 
                            navigateToProfile={navigateToProfile} 
                            formatDate={formatDate} 
                            handleCommentSubmit={handleCommentSubmit} 
                            setCommentContent={setCommentContent} 
                        />
                    </section>

                    <section className="flex flex-col gap-6 sm:w-[30%]">
                        <ProfileInformation 
                            post={post} 
                            getAvatarUrl={getAvatarUrl} 
                            navigateToProfile={navigateToProfile} 
                            handleFollowClick={handleFollowClick}
                            following={following}
                            session={session as Session}
                        />
                        <RelatedPosts 
                            userPosts={userPosts}
                            formatDate={formatDate} 
                            navigateToPost={navigateToPost}
                            currentPost={post}
                        />
                    </section>
                </div>
            </main>
        </>
    );
}

function Header({ notificationCount }: { notificationCount: number }) {
    return (
        <header className="flex justify-between items-center sm:pl-4 max-sm:px-4 max-sm:pt-2 mb-12">
            <Link href="/" className="flex items-center gap-1">
                <Earth />
                <h1 className="text-2xl font-bold">Globuddy</h1>
            </Link>
            <nav className="hidden sm:block">
                <ul className="flex py-0">
                    <li className="text-black px-4 py-2 hover:bg-gray-200 border-b-2 border-transparent hover:border-gray-400 transition-all duration-300 w-full flex justify-center"><Link href="/home">Home</Link></li>
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
                    <li className="text-black px-4 py-2 hover:bg-gray-200 border-b-2 border-transparent hover:border-gray-400 transition-all duration-300 w-full flex justify-center"><Link href="/groups">Groups</Link></li>
                </ul>
            </nav>
            <MobileMenu notificationCount={notificationCount} />
        </header>
    );
}

function MobileMenu({ notificationCount }: { notificationCount: number }) {
    return (
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
                        <Link href="/groups" className="hover:scale-105 transition-all duration-300">Groups</Link>
                    </nav>
                </SheetContent>
            </Sheet>
        </div>
    );
}

function PostDisplay({ post, getAvatarUrl, navigateToProfile, formatDate, handleLikeClick, likes }: { post: Post, getAvatarUrl: (avatarUrl: string | null) => string, navigateToProfile: (username: string) => void, formatDate: (dateString: string) => string, handleLikeClick: (postId: number) => void, likes: number }) {
    return (
        <section className="flex flex-col gap-4 w-full mx-auto bg-white p-6 sm:rounded-md border border-gray-300 shadow-sm">
            <div className="flex items-center gap-4">
                <Image
                    src={getAvatarUrl(post.user.avatar_url)}
                    alt={post.username[0].toUpperCase()}
                    width={50}
                    height={50}
                    className="rounded-full border-2 border-gray-200 hover:cursor-pointer"
                    onClick={() => navigateToProfile(post.username)}
                />
                <div>
                    <h2 className="text-xl font-bold">{post.username || 'Anonymous'}</h2>
                    <p className="text-sm text-gray-500">
                        {post.created_at ? formatDate(post.created_at) : 'Date unknown'}
                    </p>
                </div>
            </div>
            <p className="text-lg">{post.content}</p>
            <div className="flex items-center gap-4 text-sm text-gray-500">
                <span className="hover:cursor-pointer flex gap-1">
                    <ThumbsUp className={`w-4 h-4 ${post.userLiked ? 'text-blue-500' : 'text-gray-500'}`} onClick={() => handleLikeClick(post.id)} />
                    {post.likes ?? 0}
                </span>

                <span className="flex gap-1 items-center">
                    <MessageSquare className="w-4 h-4" />
                    {post.comments ?? 0}
                </span>
            </div>
        </section>
    );
}

function CommentSection({ comments, getAvatarUrl, navigateToProfile, formatDate, handleCommentSubmit, setCommentContent }: { comments: Comment[], getAvatarUrl: (avatarUrl: string | null) => string, navigateToProfile: (username: string) => void, formatDate: (dateString: string) => string, handleCommentSubmit: () => void, setCommentContent: (content: string) => void }) {
    return (
        <section className="w-full mx-auto bg-white p-6 sm:rounded-md border border-gray-300 shadow-sm flex flex-col gap-4">
            <h3 className="text-xl font-bold mb-4">Comments</h3>

            <div className="flex flex-col">
                <textarea placeholder="Write a comment..." className="w-full p-2 border rounded" onChange={(e) => setCommentContent(e.target.value)} />
                <Button onClick={handleCommentSubmit} type="submit" className="mt-2 px-4 py-2 text-white rounded sm:w-min">Submit</Button>
            </div>

            <div className="flex flex-col gap-4">
                {comments && comments.length > 0 ? (
                    comments.map((comment) => (
                        <div key={comment.id} className="mb-4 p-2 border-b flex items-center gap-2">
                            <Image
                                src={getAvatarUrl(comment.user.avatar_url)}
                                alt={comment.username[0].toUpperCase()}
                                width={40}
                                height={40}
                                className="rounded-full border-2 border-gray-200 hover:cursor-pointer"
                                onClick={() => navigateToProfile(comment.username)}
                            />

                            <div>
                                <p className="font-bold">{comment.username}</p>
                                <p className="text-sm">{comment.content}</p>
                            </div>
                        </div>
                    ))
                ) : (
                    <p>No comments yet.</p>
                )}
            </div>
        </section>
    );
}

function ProfileInformation({ post, getAvatarUrl, navigateToProfile, handleFollowClick, following, session }: { post: Post, getAvatarUrl: (avatarUrl: string | null) => string, navigateToProfile: (username: string) => void, handleFollowClick: () => void, following: boolean, session: Session }) {
    return (
        <section className="w-full mx-auto bg-white p-6 sm:rounded-md border border-gray-300 shadow-sm flex flex-col gap-4">
            <h3 className="text-xl font-bold">About the Author</h3>

            <div className="flex items-center gap-2">
                <Image
                    src={getAvatarUrl(post.user.avatar_url)}
                    alt={post.username[0].toUpperCase()}
                    width={50}
                    height={50}
                    className="rounded-full border-2 border-gray-200 hover:cursor-pointer"
                    onClick={() => navigateToProfile(post.username)}
                />

                <div>
                    <h2 className="text-xl font-bold">{post.username || 'Anonymous'}</h2>
                    <p className="text-sm text-gray-500">
                        Native {post.user.native_language} speaker learning {post.user.languages.join(', ')}
                    </p>
                    <p className="text-sm text-gray-500">{post.user.bio || 'No bio yet'}</p>
                </div>
            </div>

            {session?.user?.username !== post.username && (
                <Button className="w-full" onClick={handleFollowClick}>{following ? 'Unfollow' : 'Follow'}</Button>
            )}
        </section>
    );
}

function RelatedPosts({ userPosts, formatDate, navigateToPost, currentPost }: { userPosts: Post[], formatDate: (dateString: string) => string, navigateToPost: (postId: number) => void, currentPost: Post }) {
    return (
        <section className="w-full mx-auto bg-white p-6 sm:rounded-md border border-gray-300 shadow-sm flex flex-col gap-4">
            <h3 className="text-xl font-bold">Other Posts by {userPosts[0]?.username}</h3>

            <div>
                {userPosts && userPosts.length > 0 && userPosts[0].id !== currentPost.id ? (
                  <ul className="space-y-4">
                    {userPosts.map((post) => (
                      <li key={post.id} className="border-b pb-4 last:border-b-0 cursor-pointer" onClick={() => navigateToPost(post.id)}>
                        <p className="text-sm text-gray-600 mb-1">
                          {formatDate(post.created_at)}
                        </p>
                        <p>{post.content.slice(0, 100)}{post.content.length > 100 ? '...' : ''}</p>
                      </li>
                    ))}
                  </ul>
                ) : (
                  <p className="text-gray-500">No other posts yet.</p>
                )}
            </div>
        </section>
    );
}