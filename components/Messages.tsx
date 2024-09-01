'use client'

import Link from "next/link";
import { Earth, Menu } from "lucide-react";
import { useState, useEffect, useCallback, useRef, ChangeEvent } from "react";
import { useSession } from "next-auth/react";
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { useRouter, useSearchParams } from 'next/navigation';
import { Sheet, SheetContent, SheetHeader, SheetTitle, SheetTrigger } from "@/components/ui/sheet"
import Image from "next/image";
import { Textarea } from "@/components/ui/textarea"
import { Suspense } from "react";

interface Message {
    id: string;
    user1: string;
    user2: string;
    message: string;
    created_at: string;
}

interface GroupMessage {
    id: string;
    sender: string;
    group_name: string;
    message: string;
    description: string;
    created_at: string;
    avatar_url: string;
}

interface Conversation {
    otherUser: string;
    lastMessage: string;
    timestamp: string;
    avatarUrl: string;
    username: string;
    members: string[];
}

interface User {
    username: string;
    avatarUrl: string;
    firstName: string;
    lastName: string;
}

interface Group {
    id: string;
    name: string;
    members: string[];
    group_author: string;
    description: string;
    created_at: string;
    image_url: string;
}

function MessagesContent() {
    const { data: session } = useSession();
    const [messages, setMessages] = useState<Message[]>([]);
    const [groupMessages, setGroupMessages] = useState<GroupMessage[]>([]);
    const [conversations, setConversations] = useState<Conversation[]>([]);
    const router = useRouter();
    const searchParams = useSearchParams();
    const newMessageTo = searchParams.get('newMessageTo');
    const [message, setMessage] = useState('');
    const [groupMessage, setGroupMessage] = useState('');
    const [selectedUser, setSelectedUser] = useState<string | null>(null);
    const [selectedGroup, setSelectedGroup] = useState<Group | null>(null);
    const [selectedUserAvatar, setSelectedUserAvatar] = useState<string | null>(null);
    const [notificationCount, setNotificationCount] = useState(0);
    const [searchResults, setSearchResults] = useState<User[]>([]);
    const [isSearching, setIsSearching] = useState(false);
    const [isCreatingGroup, setIsCreatingGroup] = useState(false);
    const [groupName, setGroupName] = useState('');
    const [groupDescription, setGroupDescription] = useState('');
    const [searchQuery, setSearchQuery] = useState('');
    const [groups, setGroups] = useState<Group[]>([]);

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

    const fetchConversations = useCallback(async () => {
        if (!username) return;

        try {
            const [conversationsResponse, groupsResponse] = await Promise.all([
                fetch(`/api/messages?username=${encodeURIComponent(username)}`),
                fetch(`/api/create-group?username=${encodeURIComponent(username)}`)
            ]);

            if (conversationsResponse.ok && groupsResponse.ok) {
                const conversationsData = await conversationsResponse.json();
                const groupsData = await groupsResponse.json();
                setConversations(conversationsData);
                setGroups(groupsData);
            } else {
                console.error('Failed to fetch conversations or groups');
            }
        } catch (error) {
            console.error('Error fetching conversations or groups:', error);
        }
    }, [username]);

    const fetchMessages = useCallback(async (otherUser: string) => {
        if (!username) return;

        try {
            const response = await fetch(`/api/messages?username=${encodeURIComponent(username)}&otherUser=${encodeURIComponent(otherUser)}`);
            if (response.ok) {
                const data = await response.json();
                // Only set messages if there are any
                if (data.length > 0) {
                    setMessages(data);
                } else {
                    // Clear messages if there are none
                    setMessages([]);
                }
            } else {
                console.error('Failed to fetch messages');
            }
        } catch (error) {
            console.error('Error fetching messages:', error);
        }
    }, [username]);

    const fetchGroupMessages = useCallback(async (groupId: string) => {
        try {
            const response = await fetch(`/api/group_messages?id=${groupId}`);
            if (response.ok) {
                const data = await response.json();
                setGroupMessages(data.length > 0 ? data : []);
            } else {
                console.error('Failed to fetch group messages');
            }
        } catch (error) {
            console.error('Error fetching group messages:', error);
        }
    }, []);
    

    useEffect(() => {
        if (username) {
            fetchConversations();
        }
    }, [username, fetchConversations]);
    
    useEffect(() => {
        if (newMessageTo && username) {
            setSelectedUser(newMessageTo);
            fetchMessages(newMessageTo);
        }
    }, [newMessageTo, username, fetchMessages]);

    const createNewConversation = async (recipient: string) => {
        if (!username) return;
    
        try {
            // Remove the POST request to create an empty conversation
            setSelectedUser(recipient);
            setIsSearching(false);
            router.replace('/messages');
            // Clear existing messages when starting a new conversation
            setMessages([]);
        } catch (error) {
            console.error('Error creating new conversation:', error);
        }
    };

    const searchUsers = useCallback(async (query: string) => {
        if (!username || query.trim() === '') {
            setSearchResults([]);
            return;
        }
    
        setIsSearching(true);
        try {
            const response = await fetch(`/api/users/search?query=${encodeURIComponent(query)}`);
            if (response.ok) {
                const data = await response.json();
                setSearchResults(data);
            } else {
                console.error('Failed to search users');
                setSearchResults([]);
            }
        } catch (error) {
            console.error('Error searching users:', error);
            setSearchResults([]);
        }
    }, [username]);

    const handleSearchChange = (e: ChangeEvent<HTMLInputElement>) => {
        const query = e.target.value;
        setSearchQuery(query);
        searchUsers(query);
    };

    const handleGroupNameChange = (e: ChangeEvent<HTMLInputElement>) => {
        setGroupName(e.target.value);
    };

    const handleGroupDescriptionChange = (e: ChangeEvent<HTMLTextAreaElement>) => {
        setGroupDescription(e.target.value);
    };

    const createGroup = async () => {
        if (!username || !groupName) return;

        try {
            const response = await fetch('/api/create-group', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify({
                    name: groupName,
                    members: [username],
                    group_author: username,
                    description: groupDescription
                }),
            });

            if (response.ok) {
                const newGroup = await response.json();
                setGroups(prevGroups => [...prevGroups, {
                    id: newGroup.id,
                    name: newGroup.name,
                    members: newGroup.members,
                    group_author: newGroup.group_author,
                    description: groupDescription,
                    created_at: newGroup.created_at,
                    image_url: newGroup.image_url
                }]);
                setIsCreatingGroup(false);
                setGroupName('');
                fetchConversations(); // Refresh conversations to include the new group
            } else {
                console.error('Failed to create group');
            }
        } catch (error) {
            console.error('Error creating group:', error);
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
                fetchConversations();
            } else {
                console.error('Failed to send message');
            }
        } catch (error) {
            console.error('Error sending message:', error);
        }
    };

    const sendGroupMessage = async (e: React.FormEvent<HTMLFormElement>) => {
        e.preventDefault();
        if (!username || !selectedGroup || !groupMessage.trim()) return;

        try {
            const response = await fetch('/api/group_messages', {
                method: 'POST',
                headers: {  
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify({
                    sender: username,
                    message: groupMessage.trim(),
                    id: selectedGroup.id,
                }),
            });

            if (response.ok) {
                const newMessage = await response.json();
                setGroupMessages(prevMessages => [...prevMessages, newMessage]);
                setGroupMessage('');
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
        setSelectedGroup(null);
        fetchMessages(otherUser);
    };

    const handleSelectGroup = (group: Group) => {
        setSelectedGroup(group);
        setSelectedUser(null);
        fetchGroupMessages(group.id);
    };

    const messagesEndRef = useRef<HTMLDivElement>(null);

    const scrollToBottom = () => {
        messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
    };

    const fetchUserAvatar = async (username: string) => {
        const response = await fetch(`/api/users?username=${encodeURIComponent(username)}`);
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

            <main className="flex flex-col justify-center sm:p-4 grow gap-4">
                <h2 className="text-2xl font-bold mb-4 text-center">Private Messages</h2>

                <div className="flex items-start justify-center gap-4 h-[calc(100vh-200px)] max-md:flex-col">
                    <section className="flex flex-col w-1/4 bg-white sm:rounded-lg sm:border-gray-200 sm:border-2 md:h-full max-md:w-full">
                        <div className="flex flex-col gap-2">
                            <div className="flex">
                                <Button onClick={() => setIsSearching(true)} variant="outline" className="w-full md:border-t-0 border-x-0 border-2 max-md:rounded-none md:rounded-b-none md:rounded-r-none">New Conversation</Button>
                                <Button onClick={() => setIsCreatingGroup(true)} variant="outline" className="w-full md:border-t-0 border-x-0 border-2 max-md:rounded-none md:rounded-b-none md:rounded-l-none">New Group</Button>
                            </div>
                            
                            {isSearching && (
                                <div className="flex flex-col gap-2 p-4 fixed inset-0 bg-white/90 z-50 backdrop-blur-sm items-center justify-center">
                                    <div className="flex flex-col gap-2 w-full max-w-md">
                                        <Input 
                                            name="search" 
                                            type="text" 
                                            placeholder="Search for users" 
                                            value={searchQuery} 
                                            onChange={handleSearchChange} 
                                            className="flex-grow"
                                        />
                                        <Button onClick={() => setIsSearching(false)} variant="outline" className="w-full">Cancel</Button>
                                    </div>
                                    <div className="max-h-96 overflow-y-auto w-full max-w-md mt-2">
                                        {searchResults.length > 0 ? (
                                            searchResults.map(user => (
                                                <button
                                                    key={user.username}
                                                    onClick={() => createNewConversation(user.username)}
                                                    className="w-full text-left p-2 hover:bg-gray-100 flex items-center gap-2"
                                                >
                                                    <Image
                                                        src={user.avatarUrl || '/avatars/user.png'}
                                                        alt={user.username || 'User'}
                                                        width={40}
                                                        height={40}
                                                        className="rounded-full min-w-[40px] min-h-[40px] max-w-[40px] max-h-[40px]"
                                                    />
                                                    <span>{user.username}</span>
                                                </button>
                                            ))
                                        ) : (
                                            <p className="text-center text-gray-500 p-4">No users found</p>
                                        )}
                                    </div>
                                </div>
                            )}

                            {isCreatingGroup && (
                                <div className="flex flex-col gap-2 p-4 fixed inset-0 bg-white/90 z-50 backdrop-blur-sm items-center justify-center">
                                    <div className="flex flex-col gap-2 w-full max-w-md">
                                        <Input 
                                            name="groupName" 
                                            type="text" 
                                            placeholder="Group Name" 
                                            value={groupName} 
                                            onChange={handleGroupNameChange} 
                                            className="flex-grow"
                                        />
                                        <Textarea
                                            name="groupDescription"
                                            placeholder="Group Description"
                                            value={groupDescription}
                                            onChange={handleGroupDescriptionChange}
                                            className="flex-grow"
                                        />
                                        <Button onClick={createGroup} variant="outline" className="w-full">Create Group</Button>
                                    </div>
                                </div>
                            )}
                        </div>
                        

                        <div className="md:flex-grow md:overflow-y-auto w-full max-md:flex max-md:overflow-x-auto m-0">
                            <div className="flex md:flex-col max-md:w-max">
                                {groups.map(group => (
                                    <button
                                        key={group.id}
                                        onClick={() => handleSelectGroup(group)}
                                        className={`p-2 md:w-full text-left ${selectedUser === group.id ? 'bg-gray-200' : ''} hover:bg-gray-100 flex items-center gap-2 max-sm:flex-shrink-0`}
                                    >   
                                        <div>
                                            <div className="rounded-full border-2 border-gray-200 min-w-[50px] min-h-[50px] max-w-[50px] max-h-[50px]">
                                                <Image
                                                    src={group.image_url || '/avatars/group.png'}
                                                    alt={group.name}
                                                    width={50}
                                                    height={50}
                                                    className="rounded-full"
                                                />
                                            </div>
                                        </div>

                                        <div className="flex flex-col max-sm:hidden truncate">
                                            <div className="font-bold">{group.name}</div>
                                            <div className="text-sm text-gray-500">{group.description}</div>
                                            <div className="text-xs text-gray-400">{formatDate(new Date(group.created_at))}</div>
                                        </div>
                                    </button>
                                ))}
                                {conversations.map(conv => (
                                    <button
                                        key={conv.otherUser}
                                        onClick={() => handleSelectConversation(conv.otherUser)}
                                        className={`p-2 md:w-full text-left ${selectedUser === conv.otherUser ? 'bg-gray-200' : ''} hover:bg-gray-100 flex items-center gap-2 max-sm:flex-shrink-0`}
                                    >   
                                        <div>
                                            <Image
                                                src={conv.avatarUrl || '/avatars/user.png'}
                                                alt={conv.username || 'User'}
                                                width={50}
                                                height={50}
                                                className="rounded-full border-2 border-gray-200 min-w-[50px] min-h-[50px] max-w-[50px] max-h-[50px]"
                                            />
                                        </div>

                                        <div className="flex flex-col max-sm:hidden truncate">
                                            <div className="font-bold">{conv.otherUser}</div>
                                            <div className="text-sm text-gray-500">{conv.lastMessage}</div>
                                            <div className="text-xs text-gray-400">{formatDate(new Date(conv.timestamp))}</div>
                                        </div>
                                    </button>
                                ))}
                            </div>
                        </div>
                    </section>

                    <section className="flex flex-col w-1/2 bg-white sm:rounded-lg sm:border-gray-200 sm:border-2 max-md:h-[80%] md:h-full max-md:w-full">
                        {selectedUser || selectedGroup ? (
                            <>
                                {selectedUser && (
                                    <>
                                        <div className="flex items-center p-4 border-b gap-2">
                                            <Image
                                                src={selectedUserAvatar || '/avatars/user.png'}
                                                alt={selectedUser}
                                                width={50}
                                                height={50}
                                                className="rounded-full border-2 border-gray-200 hover:cursor-pointer min-w-[50px] min-h-[50px] max-w-[50px] max-h-[50px]"
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
                                                        {formatDate(new Date(message.created_at))}
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
                                )}

                                {selectedGroup && 
                                    <>
                                        <div className="flex items-center p-4 border-b gap-2">
                                            <div className="rounded-full border-2 border-gray-200 min-w-[50px] min-h-[50px] max-w-[50px] max-h-[50px]">
                                                <Image
                                                    src={selectedGroup.image_url || '/avatars/group.png'}
                                                    alt={selectedGroup.name}
                                                    width={50}
                                                    height={50}
                                                    className="rounded-full"
                                                />
                                            </div>
                                            
                                            <div className="flex flex-col">
                                                <h3 className="text-xl font-bold">{selectedGroup.name}</h3>
                                                <p className="text-sm text-gray-500">{selectedGroup.description}</p>
                                            </div>
                                        </div>

                                        <div className="flex-grow overflow-y-auto p-4">
                                            {groupMessages.length === 0 ? (
                                                <p className="text-center text-gray-500 p-4">No messages yet</p>
                                            ) : (
                                                <>
                                                    {groupMessages.map(groupMessage => (
                                                        <div key={groupMessage.id} className={`flex mb-4 ${groupMessage.sender === username ? 'justify-end' : 'justify-start'} items-center gap-2`}>
                                                            {groupMessage.sender !== username && (
                                                                <Image
                                                                    src={groupMessage.avatar_url || '/avatars/user.png'}
                                                                    alt={groupMessage.sender}
                                                                    width={50}
                                                                    height={50}
                                                                    className="rounded-full border-2 border-gray-200 hover:cursor-pointer min-w-[50px] min-h-[50px] max-w-[50px] max-h-[50px]"
                                                                    onClick={() => router.push(`/profile/${groupMessage.sender}`)}
                                                                />
                                                            )}
                                                            <div className={`flex flex-col ${groupMessage.sender === username ? 'items-end' : 'items-start'}`}>
                                                                <p className="text-sm text-gray-500">{groupMessage.sender}</p>
                                                                <p className={`p-2 rounded md:max-w-[40%] ${groupMessage.sender === username ? 'bg-blue-100' : 'bg-gray-100'} max-sm:w-[80%] max-md:w-[60%]`}>
                                                                    {groupMessage.message}
                                                                </p>
                                                                <span className="text-xs text-gray-500 mt-1">
                                                                    {formatDate(new Date(groupMessage.created_at))}
                                                                </span>
                                                            </div>
                                                            {groupMessage.sender === username && (
                                                                <Image
                                                                    src={groupMessage.avatar_url || '/avatars/user.png'}
                                                                    alt={groupMessage.sender}
                                                                    width={50}
                                                                    height={50}
                                                                    className="rounded-full border-2 border-gray-200 hover:cursor-pointer min-w-[50px] min-h-[50px] max-w-[50px] max-h-[50px]"
                                                                    onClick={() => router.push(`/profile/${groupMessage.sender}`)}
                                                                />
                                                            )}
                                                        </div>
                                                    ))}
                                                </>
                                            )}
                                            <div ref={messagesEndRef} />
                                        </div>

                                        <form onSubmit={sendGroupMessage} className="flex items-center p-4 border-t max-sm:flex-col max-sm:gap-2">
                                            <Input 
                                                name="message" 
                                                type="text" 
                                                placeholder="Write a message" 
                                                value={groupMessage} 
                                                onChange={(e) => setGroupMessage(e.target.value)} 
                                                className="flex-grow sm:mr-2 max-sm:w-full max-sm:hidden"
                                            />

                                            <Textarea
                                                name="message"
                                                placeholder="Write a message"
                                                value={groupMessage}
                                                onChange={(e) => setGroupMessage(e.target.value)}
                                                className="flex-grow sm:mr-2 max-sm:w-full sm:hidden"
                                            />
                                            <Button type="submit" variant="outline" className="max-sm:w-full">Send</Button>
                                        </form>
                                    </>
                                }
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

export default function Messages() {
    return (
        <Suspense fallback={<div>Loading...</div>}>
            <MessagesContent />
        </Suspense>
    );
}