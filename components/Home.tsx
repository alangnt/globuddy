"use client";

import Link from "next/link";
import { Earth, CircleUserRound, Ellipsis } from "lucide-react";
import { useSession } from "next-auth/react";
import { useRouter } from "next/navigation";
import { useEffect, useState } from "react";

type Post = {
    id: number;
    content: string;
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
    
    useEffect(() => {
        if (status === "unauthenticated") {
            router.push('/');
        }
    }, [status, router]);

    if (status === "unauthenticated") {
        return null;
    }

    useEffect(() => {
        const handleClickOutside = (event: MouseEvent) => {
            if (activePostId !== null && !(event.target as Element).closest('.post-options')) {
                setActivePostId(null);
            }
        };

        document.addEventListener('click', handleClickOutside);

        return () => {
            document.removeEventListener('click', handleClickOutside);
        };
    }, [activePostId]);

    useEffect(() => {
        fetchPosts().then(fetchedPosts => {
            setPosts(sortPosts(fetchedPosts));
        });
    
        const interval = setInterval(() => {
            setPosts(prevPosts => {
                const updatedPosts = prevPosts.map(post => ({
                    ...post,
                    created_at: formatDate(new Date(post.created_at))
                }));
                return sortPosts(updatedPosts);
            });
        }, 30000); // Update every 30 seconds
    
        return () => clearInterval(interval);
    }, []);

    const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
        e.preventDefault();
        const form = e.currentTarget;
        const content = (form.elements.namedItem('content') as HTMLTextAreaElement).value;
    
        const response = await fetch('/api/posts', {
            method: 'POST',
            body: JSON.stringify({ username: session?.user?.username, content }),
        });
    
        if (response.ok) {
            // Reload the page after successful post creation
            window.location.reload();
        } else {
            // Handle error case if needed
            console.error('Failed to create post');
        }
    }

    const handleEllipsisClick = (post: Post) => {
        setActivePostId(activePostId === post.id ? null : post.id);
    }

    const handleEditClick = (post: Post) => {
        setEditPost(post);
    }

    const handleDeleteClick = async (post: Post) => {
        if (confirm('Are you sure you want to delete this post?')) {
            const response = await fetch(`/api/posts?id=${post.id}`, {
                method: 'DELETE',
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify({ id: post.id }),
            });
            if (response.ok) {
                setPosts(posts.filter(p => p.id !== post.id));
            }
        }
    }

    const handleSaveEdit = async (post: Post) => {
        const response = await fetch(`/api/posts`, {
            method: 'PUT',
            headers: {
                'Content-Type': 'application/json',
            },
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

    const fetchPosts = async () => {
        const response = await fetch("/api/posts");
        const data = await response.json();

        const sortedPosts = data.sort((a: Post, b: Post) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime());
        return sortedPosts.map((post: Post) => ({
            ...post,
            created_at: formatDate(new Date(post.created_at)),
        }));
    }
    
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
        return posts.sort((a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime());
    }

    return (
        <>
            <header className="flex justify-between items-center px-2 mb-4">
                <Link href="/" className="flex items-center gap-1">
                    <Earth />
                    <h1 className="text-2xl font-bold">Globuddy</h1>
                </Link>

                <nav>
                    <ul className="flex gap-4 py-0">
                        <li className="text-black px-4 bg-gray-200 border-b-2 border-gray-400 transition-all duration-300 w-full flex justify-center items-center"><Link href="/home">Home</Link></li>
                        <li className="text-black px-4 py-2 hover:bg-gray-200 border-b-2 border-transparent hover:border-gray-400 transition-all duration-300 w-full flex justify-center"><Link href="/profile">Profile</Link></li>
                        <li className="text-black px-4 py-2 hover:bg-gray-200 border-b-2 border-transparent hover:border-gray-400 transition-all duration-300 w-full flex justify-center"><Link href="/messages">Messages</Link></li>
                        <li className="text-black px-4 py-2 hover:bg-gray-200 border-b-2 border-transparent hover:border-gray-400 transition-all duration-300 w-full flex justify-center"><Link href="/settings">Settings</Link></li>
                    </ul>
                </nav>
            </header>

            <main className="flex flex-col items-center grow gap-8">
                <section className="flex flex-col gap-8 w-full max-w-2xl mx-auto bg-white p-4 rounded-md border border-gray-300">
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

                <section className="flex flex-col gap-8 w-full max-w-2xl mx-auto bg-white p-4 rounded-md border border-gray-300">
                    <h2 className="text-2xl font-bold">Posts</h2>

                    <div className="flex flex-col gap-8">
                        {posts.map((post) => (
                            <article key={post.id} className="flex gap-2 items-center relative">
                                <div className="flex items-center">
                                    <CircleUserRound className="w-10 h-10" />
                                </div>

                                <div className="flex flex-col gap-1 flex-grow">
                                    <div className="flex items-center gap-2 justify-between">
                                        <div className="flex items-center gap-2">
                                            <h3 className="text-lg font-bold">{post.username}</h3>
                                            <p className="text-gray-500 text-sm">{post.created_at}</p>
                                        </div>
                                        {post.username === session?.user?.username && (
                                            <button onClick={() => handleEllipsisClick(post)}><Ellipsis className="w-4 h-4" /></button>
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
                                </div>

                                {activePostId === post.id && (
                                    <div className="absolute -right-24 -top-4 mt-1 bg-white border rounded shadow-lg p-2">
                                        <button onClick={() => handleEditClick(post)} className="block w-full text-left py-1 px-2 hover:bg-gray-100">Edit</button>
                                        <button onClick={() => handleDeleteClick(post)} className="block w-full text-left py-1 px-2 hover:bg-gray-100">Delete</button>
                                    </div>
                                )}
                            </article>
                        ))}
                    </div>
                </section>
            </main>

            <footer className="flex flex-col items-center justify-center py-2 text-sm">
                <p>© 2024 Globuddy. All rights reserved.</p>
            </footer>
        </>
    );
}