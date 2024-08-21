'use client'

import Link from "next/link";
import { Earth, Menu, Check, Trash2, Settings, MessageSquare, UserPlus, BookOpen, Bell } from "lucide-react";
import { Sheet, SheetContent, SheetHeader, SheetTitle, SheetTrigger } from "@/components/ui/sheet";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { ScrollArea } from "@/components/ui/scroll-area";
import { useState, useEffect, useCallback } from "react";
import { Avatar, AvatarImage, AvatarFallback } from "@/components/ui/avatar";
import { useRouter } from "next/navigation";
import { useSession } from "next-auth/react";

interface Notification {
    id: string;
    type: string;
    read: boolean;
    avatar_url: string;
    username: string;
    content: string;
    time: string;
    related_id: string;
}

export default function Notifications() {
    const [filter, setFilter] = useState('all')
    const [notifications, setNotifications] = useState<Notification[]>([])
    const router = useRouter();
    const { data: session } = useSession();
    const [notificationCount, setNotificationCount] = useState(0);

    useEffect(() => {
        if (session?.user?.username) {
            fetchNotifications(session.user.username);
        }
    }, [session?.user?.username]);

    const fetchNotifications = async (username: string) => {
        try {
            const response = await fetch(`/api/notifications?username=${username}`);
            if (response.ok) {
                const data = await response.json();
                setNotifications(data);
            }
        } catch (error) {
            console.error('Error fetching notifications:', error);
        }
    };

    const handleMarkAsRead = async (id: string) => {
        try {
            const response = await fetch(`/api/notifications?id=${id}`, {
                method: 'PATCH',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ read: true }),
            });
            if (response.ok) {
                setNotifications(notifications.map(notif => 
                    notif.id === id ? { ...notif, read: true } : notif
                ));
            }
        } catch (error) {
            console.error('Error marking notification as read:', error);
        }
    }

    const handleDelete = async (id: string) => {
        try {
            const response = await fetch(`/api/notifications?id=${id}`, {
                method: 'DELETE',
            });
            if (response.ok) {
                setNotifications(notifications.filter(notif => notif.id !== id));
            }
        } catch (error) {
            console.error('Error deleting notification:', error);
        }
    }

    const handleNotificationClick = async (notification: Notification) => {
        if (notification.type === 'message') {
          // Navigate to the message thread
          router.push(`/messages?username=${notification.username}`);
        }
        // Mark the notification as read
        await handleMarkAsRead(notification.id);
    };

    const getIcon = (type: string) => {
        switch(type) {
            case 'message': return <MessageSquare className="h-4 w-4" />;
            case 'friend_request': return <UserPlus className="h-4 w-4" />;
            case 'learning_reminder': return <BookOpen className="h-4 w-4" />;
            default: return <Bell className="h-4 w-4" />;
        }
    }

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
                        <li className="text-black px-4 bg-gray-200 border-b-2 border-gray-400 transition-all duration-300 w-full flex justify-center items-center">
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

            <main className="flex-1 py-6 container mx-auto px-4 md:px-6">
                <div className="flex justify-between items-center mb-6">
                    <h1 className="text-3xl font-bold text-gray-800">Notifications</h1>
                    <div className="flex items-center space-x-4">
                        <Select value={filter} onValueChange={setFilter}>
                            <SelectTrigger className="w-[180px]">
                                <SelectValue placeholder="Filter notifications" />
                            </SelectTrigger>
                            <SelectContent>
                                <SelectItem value="all">All Notifications</SelectItem>
                                <SelectItem value="message">Messages</SelectItem>
                                <SelectItem value="friend_request">Friend Requests</SelectItem>
                                <SelectItem value="learning_reminder">Learning Reminders</SelectItem>
                            </SelectContent>
                        </Select>
                        <Button variant="outline" size="sm">
                            <Settings className="h-4 w-4 mr-2" />
                            Settings
                        </Button>
                    </div>
                </div>
                <Card>
                    <CardContent className="p-0">
                        <ScrollArea className="h-[calc(100vh-16rem)]">
                            {notifications.length > 0 ? (
                                notifications.map((notification) => (
                                    <div key={notification.id} 
                                        className={`flex items-center justify-between p-4 border-b last:border-b-0 ${notification.read ? 'bg-white' : 'bg-blue-50'} max-sm:flex-col max-sm:items-center max-sm:justify-center max-sm:w-full max-sm:gap-2`}
                                    >
                                        <div className="flex items-center space-x-4 max-sm:flex-col max-sm:items-center max-sm:justify-center max-sm:w-full max-sm:gap-2">
                                            {notification.avatar_url ? (
                                                <Avatar>
                                                    <AvatarImage src={notification.avatar_url} alt={notification.username || ''} />
                                                    <AvatarFallback>{notification.username ? notification.username[0] : ''}</AvatarFallback>
                                                </Avatar>
                                            ) : (
                                                <div className="w-10 h-10 rounded-full bg-blue-500 flex items-center justify-center text-white">
                                                    {getIcon(notification.type)}
                                                </div>
                                            )}
                                            <div onClick={() => handleNotificationClick(notification)}>
                                                <p className="text-sm font-medium cursor-pointer">
                                                    {notification.username && <span className="font-bold">{notification.username} </span>}
                                                    {notification.content}
                                                </p>
                                                <p className="text-xs text-gray-500">{notification.time}</p>
                                            </div>
                                        </div>

                                        <div className="flex items-center space-x-2">
                                            {!notification.read && (
                                                <Button size="sm" variant="ghost" onClick={() => handleMarkAsRead(notification.id)}>
                                                    <Check className="h-4 w-4" />
                                                    <span className="sr-only">Mark as read</span>
                                                </Button>
                                            )}
                                            <Button size="sm" variant="ghost" onClick={() => handleDelete(notification.id)}>
                                                <Trash2 className="h-4 w-4" />
                                                <span className="sr-only">Delete</span>
                                            </Button>
                                        </div>
                                    </div>
                                ))
                            ) : (
                                <div className="p-4 text-center text-gray-500">No notifications to display.</div>
                            )}
                        </ScrollArea>
                    </CardContent>
                </Card>
            </main>
        </>
    );
}