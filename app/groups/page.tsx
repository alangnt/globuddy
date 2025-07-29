'use client'

import Link from "next/link";
import Image from "next/image";
import { Earth } from "lucide-react";
import { Sheet, SheetContent, SheetHeader, SheetTitle, SheetTrigger } from "@/components/ui/sheet";
import { Menu } from "lucide-react";
import { useCallback, useEffect, useState } from "react";
import { useSession } from "next-auth/react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";

interface Group {
    id: number;
    name: string;
    members: string;
    group_author: string;
    created_at: string;
    image_url: string;
    description: string;
}

interface AllGroup {
    id: number;
    name: string;
    members: string;
    group_author: string;
    created_at: string;
    image_url: string;
    description: string;
}

export default function GroupsPage() {
    return (
        <>
            <Header />
            <Main />
            <Footer />
        </>
    )
}

function Header() {
    const { data: session } = useSession();
    const [notificationCount, setNotificationCount] = useState(0);

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
        <header className="flex justify-between items-center sm:pl-4 max-sm:px-4 max-sm:pt-2 md:mb-12 max-md:mb-4">
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
                    <li className="text-black px-4 bg-gray-200 border-b-2 border-gray-400 transition-all duration-300 w-full flex justify-center items-center"><Link href="/groups">Groups</Link></li>
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
    )
}

function Main() {
    const { data: session } = useSession();
    const [groups, setGroups] = useState<Group[]>([]);
    const [allGroups, setAllGroups] = useState<AllGroup[]>([]);
    const [editGroup, setEditGroup] = useState<Group | null>(null);
    const [deleteGroup, setDeleteGroup] = useState<Group | null>(null);
    
    const fetchAllGroups = useCallback(async () => {
        try {
            const response = await fetch('/api/create-group?all=true')
            if (response.ok) {
                const data = await response.json();
                setAllGroups(data);
            } else {
                console.error('Failed to fetch all groups');
            }
        } catch (error) {
            console.error('Error fetching all groups:', error);
        }
    }, []);

    useEffect(() => {
        fetchAllGroups();
    }, [fetchAllGroups]);

    useEffect(() => {
        if (session?.user?.username) {
            fetch(`/api/create-group?username=${encodeURIComponent(session.user.username)}`)
                .then(response => response.json())
                .then(data => setGroups(data));
        }
    }, [session?.user?.username]);

    const joinGroup = useCallback(async (groupId: number) => {
        if (session?.user?.username) {
          const response = await fetch(`/api/join-group?group_id=${groupId}&username=${encodeURIComponent(session.user.username)}`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
          });
          
          if (response.ok) {
            const data = await response.json();
            setGroups(data);
            setAllGroups(data);
            // Refresh the page
            window.location.reload();
          } else {
            console.error('Failed to join group');
          }
        }
    }, [session?.user?.username]);

    const leaveGroup = useCallback(async (groupId: number) => {
        if (session?.user?.username) {
          const response = await fetch(`/api/join-group?group_id=${groupId}&username=${encodeURIComponent(session.user.username)}`, {
            method: 'DELETE',
            headers: { 'Content-Type': 'application/json' },
          });

          if (response.ok) {
            const data = await response.json();
            setGroups(data);
            setAllGroups(data);
            // Refresh the page
            window.location.reload();
          } else {
            console.error('Failed to leave group');
          }
        }
    }, [session?.user?.username]);

    const handleSaveEdit = useCallback(async (groupId: number) => {
        if (editGroup) {
            const response = await fetch(`/api/create-group?group_id=${groupId}&username=${encodeURIComponent(session?.user?.username ?? '')}`, {
                method: 'PUT',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ group_id: groupId, username: session?.user?.username, name: editGroup.name, description: editGroup.description }),
            });

            if (response.ok) {
                const data = await response.json();
                setGroups(data);
                setAllGroups(data);
                setEditGroup(null);

                window.location.reload();
            } else {
                console.error('Failed to save group');
            }
        }
    }, [editGroup, session?.user?.username]);

    const handleDeleteGroup = useCallback(async (groupId: number) => {
        if (session?.user?.username) {
            const response = await fetch(`/api/create-group?group_id=${groupId}&username=${encodeURIComponent(session.user.username)}`, {
                method: 'DELETE',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ group_id: groupId, username: session?.user?.username }),
            });

            if (response.ok) {
                const data = await response.json();
                setGroups(data);
                setAllGroups(data);
                setEditGroup(null);

                window.location.reload();
            } else {
                console.error('Failed to delete group');
            }
        }
    }, [session?.user?.username]);

    const handleImageUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
        const file = e.target.files?.[0];
        if (file) {
            const formData = new FormData();
            formData.append('file', file);
            formData.append('group_id', editGroup?.id.toString() || '');
    
            try {
                const response = await fetch('/api/upload-group-avatar', {
                    method: 'POST',
                    body: formData,
                });
                const data = await response.json();
                setEditGroup(prev => ({ ...prev, image_url: data.url } as Group));
            } catch (error) {
                console.error('Error uploading image:', error);
            }
        }
    };

    const howManyMembers = (members: string) => {
        const membersArray = members.split(',');
        return membersArray.length;
    }

    return (
        <main className="flex flex-col flex-1 py-6 container mx-auto px-4 md:px-6 gap-8">
            <h1 className="text-3xl font-bold text-gray-800">Groups</h1>

            <div className="flex max-sm:flex-col gap-8 w-full items-start justify-center">
                <section className="flex flex-col gap-4 bg-white p-4 rounded-md w-full">
                    <h2 className="text-2xl font-bold text-gray-800 max-sm:text-center">Your Groups</h2>
                    <div className="flex flex-col gap-6">
                        {groups.map(group => (
                            <article key={group.id} className="flex max-sm:flex-col max-sm:w-full items-center justify-between gap-4">
                                <div className="flex items-center gap-2 max-sm:flex-col max-sm:text-center">
                                    <div className="rounded-full border-2 border-gray-200 min-w-[50px] min-h-[50px] max-w-[50px] max-h-[50px]">
                                        <Image
                                            src={group.image_url || '/avatars/group.png'}
                                            alt={group.name}
                                            width={50}
                                            height={50}
                                            className="rounded-full"
                                        />
                                    </div>
                                    <div className="text-sm">
                                        <h3>{group.name}</h3>
                                        <p className="text-gray-500">{group.description}</p>
                                        <p>{howManyMembers(group.members)} member{howManyMembers(group.members) > 1 ? 's' : ''}</p>
                                    </div>
                                </div>

                                {group.group_author === session?.user?.username ? (
                                    <Button onClick={() => setEditGroup(group)} className="max-sm:w-full">Edit</Button>
                                ) : (
                                    <>
                                        {group.members.includes(session?.user?.username ?? '') ? (
                                            <Button onClick={() => leaveGroup(group.id)} className="max-sm:w-full">Leave</Button>
                                        ) : (
                                            <Button onClick={() => joinGroup(group.id)} className="max-sm:w-full">Join</Button>
                                        )}
                                    </>
                                )}                                                         
                            </article>                           
                        ))} 
                    </div>
                </section>

                <section className="flex flex-col gap-4 bg-white p-4 rounded-md w-full">
                    <h2 className="text-2xl font-bold text-gray-800 max-sm:text-center">All Groups</h2>
                    <div className="flex flex-col gap-6">
                        {allGroups.map(group => (
                            <article key={group.id} className="flex items-center justify-between gap-4 max-sm:flex-col">
                                <div className="flex items-center gap-2 max-sm:flex-col max-sm:text-center">
                                    <div className="rounded-full border-2 border-gray-200 min-w-[50px] min-h-[50px] max-w-[50px] max-h-[50px]">
                                        <Image
                                            src={group.image_url || '/avatars/group.png'}
                                            alt={group.name}
                                            width={50}
                                            height={50}
                                            className="rounded-full"
                                        />
                                    </div>
                                    <div className="text-sm">
                                        <h3>{group.name}</h3>
                                        <p className="text-gray-500">{group.description}</p>
                                        <p>{howManyMembers(group.members)} member{howManyMembers(group.members) > 1 ? 's' : ''}</p>
                                    </div>
                                </div>
                                
                                {group.group_author === session?.user?.username ? (
                                    <Button onClick={() => setEditGroup(group)} className="max-sm:w-full">Edit</Button>
                                ) : (
                                    <>
                                        {group.members.includes(session?.user?.username ?? '') ? (
                                            <Button onClick={() => leaveGroup(group.id)} className="max-sm:w-full">Leave</Button>
                                        ) : (
                                            <Button onClick={() => joinGroup(group.id)} className="max-sm:w-full">Join</Button>
                                        )}
                                    </>
                                )}                         
                            </article>
                        ))}
                    </div>
                </section>

                {editGroup && (
                    <div className="flex flex-col absolute top-0 left-0 bg-white/70 backdrop-blur-xs z-10 w-full h-full justify-center items-center">
                        <div className="flex flex-col gap-12 w-[30%] bg-white p-4 rounded-md shadow-lg">
                            <div className="flex flex-col gap-8">
                                <div className="flex flex-col items-center gap-2">
                                    <div className="rounded-full border-2 border-gray-200 min-w-[75px] min-h-[75px] max-w-[75px] max-h-[75px]">
                                        <Image
                                            src={editGroup.image_url || '/avatars/group.png'}
                                            alt={editGroup.name}
                                            width={75}
                                            height={75}
                                            className="rounded-full"
                                        />
                                    </div>

                                    <Input id="avatar" type="file" accept="image/*" onChange={handleImageUpload} className="max-sm:w-full max-sm:text-center cursor-pointer" />
                                </div>

                                <div className="flex flex-col gap-2">
                                    <Input type="text" value={editGroup.name} onChange={(e) => setEditGroup({ ...editGroup, name: e.target.value })} />
                                    <Textarea value={editGroup.description} onChange={(e) => setEditGroup({ ...editGroup, description: e.target.value })} />
                                    <Button onClick={() => handleSaveEdit(editGroup.id)}>Save</Button>
                                    <Button onClick={() => setEditGroup(null)} variant="outline">Cancel</Button>
                                </div>
                            </div>

                            <p 
                                onClick={() => setDeleteGroup(editGroup)} 
                                className="flex justify-center items-center text-center text-red-500 cursor-pointer text-sm hover:underline"
                            >
                                Delete Group
                            </p>
                        </div>
                    </div>
                )}

                {deleteGroup && (
                    <div className="flex flex-col absolute top-0 left-0 bg-white/70 backdrop-blur-xs z-10 w-full h-full justify-center items-center">
                        <div className="flex flex-col justify-center gap-12 w-[30%] bg-white p-4 rounded-md shadow-lg">
                            <p className="text-center text-lg">Are you sure you want to delete this group?</p>

                            <div className="flex gap-4 justify-center">
                                <Button onClick={() => handleDeleteGroup(deleteGroup.id)}>Delete</Button>
                                <Button onClick={() => setDeleteGroup(null)} variant="outline">Cancel</Button>
                            </div>
                        </div>
                    </div>
                )}
            </div>
        </main>
    )
}

function Footer() {
    return (
        <footer className="flex flex-col items-center justify-center py-2 text-sm mt-12 text-center">
            <p>© 2024 Globuddy. All rights reserved.</p>
        </footer>
    )
}
