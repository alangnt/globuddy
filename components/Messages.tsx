'use client'

import Link from "next/link";
import { Earth, Menu, User } from "lucide-react";
import { useState, useEffect, useCallback, useRef } from "react";
import { useSession } from "next-auth/react";
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { useRouter, useSearchParams } from 'next/navigation';
import { Sheet, SheetContent, SheetHeader, SheetTitle, SheetTrigger } from "@/components/ui/sheet"
import { format } from "date-fns";
import Image from "next/image";
import { Textarea } from "@/components/ui/textarea"

interface Message {
    id: string;
    user1: string;
    user2: string;
    message: string;
    created_at: string;
}

interface Conversation {
    otherUser: string;
    lastMessage: string;
    timestamp: string;
    avatarUrl: string;
}

export default function Messages() {
    const { data: session } = useSession();
    const [messages, setMessages] = useState<Message[]>([]);
    const [conversations, setConversations] = useState<Conversation[]>([]);
    const router = useRouter();
    const searchParams = useSearchParams();
    const newMessageTo = searchParams.get('newMessageTo');
    const [message, setMessage] = useState('');
    const [selectedUser, setSelectedUser] = useState<string | null>(null);
    const [selectedUserAvatar, setSelectedUserAvatar] = useState<string | null>(null);
    const [notificationCount, setNotificationCount] = useState(0);

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

    const username = session?.user?.username;

    useEffect(() => {
        if (username) {
            fetchConversations();
        }
    }, [username]);

    useEffect(() => {
        if (newMessageTo && username) {
            setSelectedUser(newMessageTo);
            fetchMessages(newMessageTo);
        }
    }, [newMessageTo, username]);

    const fetchConversations = useCallback(async () => {
        if (!username) return;

        try {
            const response = await fetch(`/api/messages?username=${username}`);
            if (response.ok) {
                const data = await response.json();
                setConversations(data);
            } else {
                console.error('Failed to fetch conversations');
            }
        } catch (error) {
            console.error('Error fetching conversations:', error);
        }
    }, [username]);

    useEffect(() => {
        fetchConversations();
    }, [fetchConversations]);

    const fetchMessages = async (otherUser: string) => {
        if (!username) return;

        try {
            const response = await fetch(`/api/messages?username=${username}&otherUser=${otherUser}`);
            if (response.ok) {
                const data = await response.json();
                setMessages(data);
            } else {
                console.error('Failed to fetch messages');
            }
        } catch (error) {
            console.error('Error fetching messages:', error);
        }
    };

    const createNewConversation = async (recipient: string) => {
        if (!username) return;

        try {
            const response = await fetch('/api/messages', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify({
                    user1: username,
                    user2: recipient,
                    message: '',
                }),
            });

            if (response.ok) {
                await fetchConversations();
                setSelectedUser(recipient);
                router.replace('/messages');
            } else {
                console.error('Failed to create new conversation');
            }
        } catch (error) {
            console.error('Error creating new conversation:', error);
        }
    };

    const sendMessage = async (e: React.FormEvent<HTMLFormElement>) => {
        e.preventDefault();
        if (!username || !selectedUser || !message.trim()) return;

        try {
            const response = await fetch('/api/messages', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify({
                    user1: username,
                    user2: selectedUser,
                    message: message.trim(),
                }),
            });

            if (response.ok) {
                const newMessage = await response.json();
                setMessages(prevMessages => [...prevMessages, newMessage]);
                setMessage('');
                // Refresh conversations to update the last message
                fetchConversations();
            } else {
                console.error('Failed to send message');
            }
        } catch (error) {
            console.error('Error sending message:', error);
        }
    };

    const handleSelectConversation = (otherUser: string) => {
        setSelectedUser(otherUser);
        fetchMessages(otherUser);
    };

    const messagesEndRef = useRef<HTMLDivElement>(null);

    const scrollToBottom = () => {
        messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
    };

    const fetchUserAvatar = async (username: string) => {
        const response = await fetch(`/api/users?username=${username}`);
        const data = await response.json();
        setSelectedUserAvatar(data.avatarUrl);
    };

    useEffect(() => {
        scrollToBottom();
    }, [messages]);

    useEffect(() => {
        if (selectedUser) {
            fetchUserAvatar(selectedUser);
        }
    }, [selectedUser]);

    const formatMessageTime = (dateString: string) => {
        const date = new Date(dateString);
        return format(date, 'HH:mm');
        // For 12-hour format, use: return format(date, 'h:mm a');
    };

    const fetchNotificationCount = useCallback(async () => {
        if (session?.user?.username) {
            try {
                const response = await fetch(`/api/notifications?username=${session.user.username}&countOnly=true`);
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
        <>
            <header className="flex justify-between items-center sm:pl-4 max-sm:px-4 max-sm:pt-2 md:mb-12 max-md:mb-4">
                <Link href="/" className="flex items-center gap-1">
                    <Earth />
                    <h1 className="text-2xl font-bold">Globuddy</h1>
                </Link>

                <nav className="hidden sm:block">
                    <ul className="flex py-0">
                        <li className="text-black px-4 py-2 hover:bg-gray-200 border-b-2 border-transparent hover:border-gray-400 transition-all duration-300 w-full flex justify-center"><Link href="/home">Home</Link></li>
                        <li className="text-black px-4 py-2 hover:bg-gray-200 border-b-2 border-transparent hover:border-gray-400 transition-all duration-300 w-full flex justify-center"><Link href="/profile">Profile</Link></li>
                        <li className="text-black px-4 bg-gray-200 border-b-2 border-gray-400 transition-all duration-300 w-full flex justify-center items-center"><Link href="/messages">Messages</Link></li>
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
                                <Link href="/notifications" className="flex items-center gap-2 hover:scale-105 transition-all duration-300">
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

            <main className="flex flex-col justify-center sm:p-4 grow gap-4">
                <h2 className="text-2xl font-bold mb-4 text-center">Private Messages</h2>

                <div className="flex items-start justify-center gap-4 h-[calc(100vh-200px)] max-md:flex-col">
                    <section className="flex md:flex-col w-1/4 bg-white sm:rounded-lg sm:border-gray-200 sm:border-2 md:h-full max-md:w-full">
                        <div className="md:flex-grow md:overflow-y-auto rounded-lg w-full max-md:flex max-md:overflow-x-auto m-0">
                            <div className="flex md:flex-col max-md:w-max">
                                {conversations.map(conv => (
                                    <button
                                        key={conv.otherUser}
                                        onClick={() => handleSelectConversation(conv.otherUser)}
                                        className={`p-2 md:w-full text-left ${selectedUser === conv.otherUser ? 'bg-gray-200' : ''} hover:bg-gray-100 flex items-center gap-2 max-sm:flex-shrink-0`}
                                    >   
                                        <div>
                                            <Image
                                                src={conv.avatarUrl || '/avatars/user.png'}
                                                alt={conv.otherUser}
                                                width={50}
                                                height={50}
                                                className="rounded-full border-2 border-gray-200"
                                            />
                                        </div>

                                        <div className="flex flex-col max-sm:hidden">
                                            <div className="font-bold">{conv.otherUser}</div>
                                            <div className="text-sm text-gray-500 truncate">{conv.lastMessage}</div>
                                            <div className="text-xs text-gray-400">{formatDate(new Date(conv.timestamp))}</div>
                                        </div>
                                    </button>
                                ))}
                            </div>
                        </div>
                    </section>

                    <section className="flex flex-col w-1/2 bg-white sm:rounded-lg sm:border-gray-200 sm:border-2 max-md:h-[80%] md:h-full max-md:w-full">
                        {selectedUser ? (
                            <>
                                <div className="flex items-center p-4 border-b gap-2">
                                    <Image
                                        src={selectedUserAvatar || '/avatars/user.png'}
                                        alt={selectedUser}
                                        width={50}
                                        height={50}
                                        className="rounded-full border-2 border-gray-200 hover:cursor-pointer"
                                        onClick={() => router.push(`/profile/${selectedUser}`)}
                                    />
                                    <h3 className="text-xl font-bold">{selectedUser}</h3>
                                </div>

                                <div className="flex-grow overflow-y-auto p-4">
                                    {messages.map(message => (
                                        <div key={message.id} className={`flex flex-col mb-4 ${message.user1 === username ? 'items-end' : 'items-start'}`}>
                                            <p className={`p-2 rounded md:max-w-[40%] ${message.user1 === username ? 'bg-blue-100' : 'bg-gray-100'} max-sm:w-[80%] max-md:w-[60%]`}>
                                                {message.message}
                                            </p>
                                            <span className="text-xs text-gray-500 mt-1">
                                                {formatMessageTime(message.created_at)}
                                            </span>
                                        </div>
                                    ))}
                                    <div ref={messagesEndRef} />
                                </div>

                                <form onSubmit={sendMessage} className="flex items-center p-4 border-t max-sm:flex-col max-sm:gap-2">
                                    <Input 
                                        name="message" 
                                        type="text" 
                                        placeholder="Write a message" 
                                        value={message} 
                                        onChange={(e) => setMessage(e.target.value)} 
                                        className="flex-grow sm:mr-2 max-sm:w-full max-sm:hidden"
                                    />

                                    <Textarea
                                        name="message"
                                        placeholder="Write a message"
                                        value={message}
                                        onChange={(e) => setMessage(e.target.value)}
                                        className="flex-grow sm:mr-2 max-sm:w-full sm:hidden"
                                    />
                                    <Button type="submit" variant="outline" className="max-sm:w-full">Send</Button>
                                </form>
                            </>
                        ) : (
                            <p className="text-center text-gray-500 p-4">Select a conversation to start messaging</p>
                        )}
                    </section>
                </div>
            </main>
        </>
    );
}