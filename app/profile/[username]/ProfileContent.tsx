'use client'

import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Progress } from "@/components/ui/progress"
import { MessageSquare, MapPin, Calendar, UserPlus, UserMinus, Earth, Menu } from "lucide-react"
import { useRouter } from 'next/navigation';
import Link from 'next/link'
import { Sheet, SheetContent, SheetHeader, SheetTitle, SheetTrigger } from "@/components/ui/sheet"
import { useSession } from 'next-auth/react';
import { useCallback, useState, useEffect } from 'react';
import Image from "next/image"

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
}

interface User {
  username: string;
  avatarUrl: string | null;
  country: string;
  joinDate: string;
  bio: string;
  nativeLanguage: string;
  languages: string[];
  levels: string[];
  interests: string[];
  posts: Post[];
  followers: number;
  following: number;
}

export default function ProfileContent({ user: initialUser }: { user: User }) {
  const router = useRouter();
  const { data: session } = useSession();
  const [posts, setPosts] = useState<Post[]>([]);
  const [following, setFollowing] = useState<boolean>(false);
  const [user, setUser] = useState<User>(initialUser);
  const [notificationCount, setNotificationCount] = useState(0);
  
  const formatDate = (dateString: string): string => {
    const date = new Date(dateString);
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

  const getAvatarUrl = useCallback((avatarUrl: string | null) => {
    if (avatarUrl) {
      // If the avatarUrl starts with 'http' or 'https', it's already a full URL
      if (avatarUrl.startsWith('http')) {
        return avatarUrl;
      }
      // Otherwise, it's a relative path, so prepend with '/avatars/'
      return `/avatars/${avatarUrl.replace(/^\/avatars\//, '')}`;
    }
    return '/avatars/user.png'; // Default avatar
  }, []);

  const handleMessageClick = async () => {
    if (!session?.user?.username) {
      console.error("User not logged in");
      return;
    }

    try {
      router.push(`/messages?newMessageTo=${user.username}`);
    } catch (error) {
      console.error('Error navigating to messages:', error);
    }
  };

  const fetchUserData = useCallback(async () => {
    const encodedUsername = encodeURIComponent(initialUser.username);
    try {
      const response = await fetch(`/api/users?username=${encodedUsername}`);
      if (!response.ok) {
        throw new Error('Failed to fetch user data');
      }
      const userData = await response.json();
      setUser(prevUser => ({
        ...prevUser,
        ...userData,
        nativeLanguage: userData.native_language,
        learningLanguages: userData.languages.map((lang: any) => ({
          languages: lang.language,
          levels: lang.level
        })) || [],
      }));
    } catch (error) {
      console.error('Error fetching user data:', error);
    }
  }, [initialUser.username]);

  useEffect(() => {
    fetchUserData();
  }, [fetchUserData]);

  const fetchPosts = useCallback(async () => {
    try {
      const response = await fetch(`/api/posts?username=${user.username}`);
      
      if (!response.ok) {
        throw new Error(`Failed to fetch posts: ${response.statusText}`);
      }

      const data = await response.json();
      
      if (!Array.isArray(data)) {
        throw new Error("Fetched data is not an array");
      }

      const fetchPostLikes = async (postId: number) => {
        try {
          const response = await fetch(`/api/likes?id=${postId}`);
          if (!response.ok) {
            throw new Error(`Failed to fetch likes: ${response.statusText}`);
          }
          return await response.json();
        } catch (error) {
          console.error("Error fetching post likes:", error);
          return null;
        }
      };

      const fetchComments = async (postId: number) => {
        try {
          const response = await fetch(`/api/comments?postId=${postId}`);
          if (!response.ok) {
            throw new Error(`Failed to fetch comments: ${response.statusText}`);
          }
          const comments = await response.json();
          return comments.map((comment: Comment) => ({
            ...comment,
            created_at: formatDate(comment.created_at)
          }));
        } catch (error) {
          console.error("Error fetching comments:", error);
          return [];
        }
      };

      const postsWithLikesAndComments = await Promise.all(data.map(async (post: Post) => {
        const likeData = await fetchPostLikes(post.id);
        const comments = await fetchComments(post.id);
        return {
          ...post,
          timestamp: new Date(post.created_at).getTime(),
          created_at: formatDate(post.created_at),
          likes: likeData ? likeData.likes : 0,
          userLiked: likeData ? likeData.userLiked : false,
          comments: comments,
        };
      }));

      return postsWithLikesAndComments;
    } catch (error) {
      console.error("Error fetching posts:", error);
      return [];
    }
  }, [user.username]);

  useEffect(() => {
    const loadData = async () => {
      const fetchedPosts = await fetchPosts();
      setPosts(fetchedPosts);
    };

    loadData();

    const interval = setInterval(() => {
      setPosts(prevPosts => sortPosts(prevPosts.map(post => ({
        ...post,
        created_at: formatDate(post.created_at)
      }))));
    }, 30000);

    return () => clearInterval(interval);
  }, [fetchPosts]);

  const sortPosts = (posts: Post[]): Post[] => {
    return [...posts].sort((a, b) => (b.timestamp || 0) - (a.timestamp || 0));
  }

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

  const getProgressValue = (levels: string) => {
    switch (levels) {
      case 'Beginner':
        return 25;
      case 'Intermediate':
        return 50;
      case 'Advanced':
        return 75;
      case 'Fluent':
        return 100;
      default:
        return 0;
    }
  }

  const fetchNotificationCount = useCallback(async () => {
    if (session?.user?.username) {
        try {
            const response = await fetch(`/api/notifications?username=${encodeURIComponent(session.user.username)}&countOnly=true`);
            if (response.ok) {
                const { count } = await response.json();
                setNotificationCount(count);
            } else {
                console.error('Failed to fetch notification count');
            }
        } catch (error) {
            console.error('Error fetching notification count:', error);
        }
    }
  }, [session?.user?.username]);

  useEffect(() => {
      fetchNotificationCount();
      // Set up an interval to fetch the notification count every minute
      const intervalId = setInterval(fetchNotificationCount, 60000);
      
      // Clean up the interval on component unmount
      return () => clearInterval(intervalId);
  }, [fetchNotificationCount]);

  return (
    <div className="flex flex-col min-h-screen bg-gray-100">
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
                                <Link href="/notifications" className="flex items-center gap-2 hover:scale-105 transition-all duration-300">
                                    Notifications
                                    {notificationCount > 0 && (
                                        <span className="bg-red-500 text-white rounded-full text-xs w-5 h-5 flex justify-center items-center">
                                            {notificationCount}
                                        </span>
                                    )}
                                </Link>
                                <Link href="/groups" className="hover:scale-105 transition-all duration-300">Groups</Link>
                                <Link href="/settings" className="hover:scale-105 transition-all duration-300 hidden">Settings</Link>
                            </nav>
                        </SheetContent>
                    </Sheet>
                </div>
            </header>

      <main className="flex-1 py-12 container mx-auto p-0 md:px-6">
        <div className="grid gap-6 md:grid-cols-[1fr_2fr]">
          <div className="space-y-6">
            <Card className="max-sm:rounded-none">
              <CardContent className="p-6">
                <div className="flex flex-col items-center space-y-4">
                  <div className="text-center flex flex-col items-center gap-2">
                    <Image 
                        src={getAvatarUrl(user.avatarUrl)}
                        alt={user.username[0].toUpperCase()} 
                        width={75} 
                        height={75} 
                        className="rounded-full border-2 border-gray-200" 
                      />
                    <h1 className="text-2xl font-bold">{user.username}</h1>
                  </div>

                  <div className="flex space-x-2">
                    <span className="text-sm font-medium">Followers: {user.followers || 0}</span>
                    <span className="text-sm font-medium">Following: {user.following || 0}</span>
                  </div>

                  <div className="flex items-center text-gray-500 text-sm">
                    <MapPin className="w-4 h-4 mr-1" />
                    {user.country || 'Not specified'}
                  </div>

                  <div className="flex items-center text-gray-500 text-sm">
                    <Calendar className="w-4 h-4 mr-1" />
                    {user.joinDate}
                  </div>
                  
                  {session?.user?.username !== user.username && (
                    <div className="flex sm:space-x-2 max-sm:w-full max-sm:flex-col max-md:gap-2">
                      <Button 
                        variant="outline"
                        onClick={handleMessageClick}
                      >
                        <MessageSquare className="w-4 h-4 mr-2" />
                        Message
                      </Button>

                      <Button 
                        variant="outline"
                        onClick={handleFollowClick}
                      >
                        {following ? <UserMinus className="w-4 h-4 mr-2" /> : <UserPlus className="w-4 h-4 mr-2" />}
                        {following ? 'Unfollow' : 'Follow'}
                      </Button>
                    </div>
                  )}
                </div>
              </CardContent>
            </Card>

            <Card className="max-sm:rounded-none" >
              <CardHeader>
                <CardTitle>About Me</CardTitle>
              </CardHeader>
              <CardContent>
                <p className="text-gray-600">{user.bio || 'No bio provided'}</p>
              </CardContent>
            </Card>

            <Card className="max-sm:rounded-none">
              <CardHeader>
                <CardTitle>Interests</CardTitle>
              </CardHeader>
              <CardContent>
                {user.interests && user.interests.length > 0 ? (
                  <ul className="list-disc pl-5">
                    {user.interests.map((interest, index) => (
                      <li key={index}>{interest}</li>
                    ))}
                  </ul>
                ) : (
                  <p>No interests specified</p>
                )}
              </CardContent>
            </Card>
          </div>

          <div className="space-y-6">
            <Card className="max-sm:rounded-none">
              <CardHeader>
                <CardTitle>Language Proficiency</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  <div>
                    <div className="flex justify-between mb-1">
                      <span className="text-sm font-medium">Native Language: {user.nativeLanguage || 'Not specified'}</span>
                    </div>
                  </div>
                  {user.languages && user.languages.length > 0 ? (
                    user.languages.map((lang: string, index: number) => (
                      <div key={index}>
                        <div className="flex justify-between mb-1">
                          <span className="text-sm font-medium">{lang}</span>
                          <span className="text-sm font-medium text-gray-500">{user.levels[index]}</span>
                        </div>
                        <Progress value={getProgressValue(user.levels[index])} className="h-2" />
                      </div>
                    ))
                  ) : (
                    <p>No learning languages specified</p>
                  )}
                </div>
              </CardContent>
            </Card>

            <Card className="max-sm:rounded-none">
              <CardHeader>
                <CardTitle>Recent Posts</CardTitle>
              </CardHeader>
              <CardContent>
                {user.posts && user.posts.length > 0 ? (
                  <ul className="space-y-4">
                    {user.posts.map((post) => (
                      <li key={post.id} className="border-b pb-4 last:border-b-0">
                        <p className="text-sm text-gray-600 mb-1">
                          {formatDate(post.created_at)}
                        </p>
                        <p>{post.content}</p>
                      </li>
                    ))}
                  </ul>
                ) : (
                  <p className="text-gray-500">No posts yet.</p>
                )}
              </CardContent>
            </Card>
          </div>
        </div>
      </main>
    </div>
  )
}