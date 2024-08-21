"use client";

import Link from "next/link";
import { Earth, Menu, Save } from "lucide-react";
import { useSession } from "next-auth/react";
import { useEffect, useState, useCallback } from "react";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Textarea } from "@/components/ui/textarea"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card"
import { Label } from "@/components/ui/label"
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import { Badge } from "@/components/ui/badge"
import { Progress } from "@/components/ui/progress"
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog"
import { Sheet, SheetContent, SheetHeader, SheetTitle, SheetTrigger } from "@/components/ui/sheet"
import Countries from "./Countries"
import Languages from "./Languages"

interface FormData {
    firstname: string;
    lastname: string;
    username: string;
    email: string;
    country: string;
    avatarUrl: string;
    bio: string;
    native_language: string;
    languages: string[];
    levels: string[];
    interests: string[];
}

export default function Profile() {
    const { data: session, status } = useSession()
    const router = useRouter()
    const [newLanguage, setNewLanguage] = useState({ language: '', level: '' });
    const [isAddLanguageOpen, setIsAddLanguageOpen] = useState(false);
    const [avatarUrl, setAvatarUrl] = useState<string | null>(null);
    const [notificationCount, setNotificationCount] = useState(0);
    const [formData, setFormData] = useState<FormData>({
        firstname: '',
        lastname: '',
        username: '',
        email: '',
        country: '',
        bio: '',
        avatarUrl: '',
        native_language: '',
        languages: [],
        levels: [],
        interests: []
    })

    const progressLevels = {
        Beginner: 25,
        Intermediate: 50,
        Advanced: 75,
        Fluent: 100
    }

    const [newInterest, setNewInterest] = useState('');
    const [allInterests, setAllInterests] = useState([
        "Travel", "Food", "Sports", "Music", "Movies", "Books", "Art", "Fashion",
        "Technology", "Science", "History", "Philosophy", "Politics", "Religion"
    ]);

    const handleAddInterest = () => {
        if (newInterest && !allInterests.includes(newInterest)) {
            setAllInterests(prev => [...prev, newInterest]);
            setFormData(prev => ({
                ...prev,
                interests: [...prev.interests, newInterest]
            }));
            setNewInterest('');
        }
    };

    useEffect(() => {
        const fetchProfile = async () => {
            if (status === "authenticated" && session?.user?.username) {
                try {
                    const response = await fetch(`/api/profile?username=${session.user.username}`);
                    if (!response.ok) {
                        throw new Error('Failed to fetch profile');
                    }
                    const profileData = await response.json();
                    console.log('Fetched profile data:', profileData);
                    
                    setFormData({
                        ...profileData,
                        interests: Array.isArray(profileData.interests) ? profileData.interests : [],
                        languages: Array.isArray(profileData.languages) ? profileData.languages : [],
                        levels: Array.isArray(profileData.levels) ? profileData.levels : [],
                    });
                    setAvatarUrl(profileData.avatar_url || null);
                } catch (error) {
                    console.error('Error fetching profile:', error);
                }
            }
        };
    
        fetchProfile();
    }, [status, session]);
    
    const handleInputChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
        const { name, value } = e.target
        setFormData(prev => ({ ...prev, [name]: value }))
    }
    
    const handleInterestChange = (interest: string) => {
        setFormData(prev => ({
            ...prev,
            interests: prev.interests.includes(interest)
                ? prev.interests.filter(i => i !== interest)
                : [...prev.interests, interest]
        }));
    };
    
    const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
        e.preventDefault()

        const dataToSend = {
            ...formData,
            languages: formData.languages,
            levels: formData.levels
        };
    
        try {
            const response = await fetch('/api/profile', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify(dataToSend)
            })

            if (!response.ok) {
                throw new Error('Failed to update profile')
            }

            const updatedProfile = await response.json()
            console.log('Profile updated successfully:', updatedProfile)

            setFormData(prev => ({
                ...updatedProfile,
                languages: updatedProfile.languages || [],
                levels: updatedProfile.levels || [],
            }))
        } catch (error) {
            console.error('Error updating profile:', error)
        }
    }

    if (status === "loading") {
        return <div>Loading...</div>
    }

    if (status === "unauthenticated") {
        router.push('/login')
        return null
    }

    const handleAddLanguage = () => {
        if (newLanguage.language && newLanguage.level) {
            setFormData(prev => ({
                ...prev,
                languages: [...prev.languages, newLanguage.language],
                levels: [...prev.levels, newLanguage.level]
            }));
            setNewLanguage({ language: '', level: '' });
            setIsAddLanguageOpen(false);
        }
    };

    const deleteLanguage = async (languageToDelete: string) => {
        try {
            // Optimistically update the UI
            setFormData(prev => ({
                ...prev,
                languages: prev.languages.filter(lang => lang !== languageToDelete),
                levels: prev.levels.filter((_, index) => prev.languages[index] !== languageToDelete)
            }));
    
            const response = await fetch('/api/profile', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify({
                    username: formData.username,
                    delete_language: languageToDelete
                }),
            });
    
            if (!response.ok) {
                throw new Error('Failed to delete language');
            }
    
            const updatedUser = await response.json();
            console.log('Language deleted, updated user:', updatedUser);
            
            // Update the formData state with the server response
            setFormData(prev => ({
                ...prev,
                languages: updatedUser.languages || [],
                levels: updatedUser.levels || []
            }));
        } catch (error) {
            console.error('Error deleting language:', error);
            // Revert the optimistic update if there's an error
            fetchProfile();
        }
    };

    const fetchProfile = async () => {
        if (session?.user?.username) {
            try {
                const response = await fetch(`/api/profile?username=${session.user.username}`);
                if (!response.ok) {
                    throw new Error('Failed to fetch profile');
                }
                const profileData = await response.json();
                setFormData({
                    ...profileData,
                    interests: Array.isArray(profileData.interests) ? profileData.interests : [],
                    languages: Array.isArray(profileData.languages) ? profileData.languages : [],
                    levels: Array.isArray(profileData.levels) ? profileData.levels : [],
                });
            } catch (error) {
                console.error('Error fetching profile:', error);
            }
        }
    };

    const twoLanguages = formData.languages.length === 1 && formData.levels.length === 1;

    const handleImageUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
        const file = e.target.files?.[0];
        if (file) {
            const formData = new FormData();
            formData.append('file', file);
            formData.append('username', session?.user?.username || '');
    
            try {
                const response = await fetch('/api/upload-avatar', {
                    method: 'POST',
                    body: formData,
                });
                const data = await response.json();
                setAvatarUrl(data.url);
                setFormData(prev => ({ ...prev, avatar_url: data.url }));
            } catch (error) {
                console.error('Error uploading image:', error);
            }
        }
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
            <header className="flex justify-between items-center sm:pl-4 max-sm:px-4 max-sm:pt-2 mb-12">
                <Link href="/" className="flex items-center gap-1">
                    <Earth />
                    <h1 className="text-2xl font-bold">Globuddy</h1>
                </Link>
    
                <nav className="hidden sm:block">
                    <ul className="flex py-0">
                        <li className="text-black px-4 py-2 hover:bg-gray-200 border-b-2 border-transparent hover:border-gray-400 transition-all duration-300 w-full flex justify-center"><Link href="/home">Home</Link></li>
                        <li className="text-black px-4 bg-gray-200 border-b-2 border-gray-400 transition-all duration-300 w-full flex justify-center items-center"><Link href="/profile">Profile</Link></li>
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
    
            <main className="flex-1 py-12 sm:container mx-auto p-0 md:px-6 max-sm:max-w-screen">
                <h1 className="text-3xl font-bold text-gray-800 mb-6 max-sm:text-center">Edit Your Profile</h1>
                <form onSubmit={handleSubmit}>
                    <div className="grid gap-6 md:grid-cols-2 max-sm:grid-cols-1">
                        <Card className="max-sm:rounded-none">
                            <CardHeader>
                                <CardTitle>Personal Information</CardTitle>
                                <CardDescription>Update your personal details and public profile.</CardDescription>
                            </CardHeader>
    
                            <CardContent className="space-y-4">
                                <div className="space-y-2 max-sm:w-full max-sm:text-center">
                                    <Label htmlFor="avatar">Profile Picture</Label>
                                    <div className="flex items-center sm:space-x-4 max-sm:flex-col max-sm:w-full max-sm:justify-center max-sm:items-center max-sm:gap-2">
                                        <Avatar className="w-20 h-20">
                                            <AvatarImage src={avatarUrl || "/placeholder-user.jpg"} alt={formData.firstname || ''} />
                                            <AvatarFallback>{formData.firstname?.charAt(0)}</AvatarFallback>
                                        </Avatar>
                                        <Input id="avatar" type="file" accept="image/*" onChange={handleImageUpload} className="max-sm:w-full max-sm:text-center" />
                                    </div>
                                </div>
    
                                <div className="flex gap-4 max-sm:flex-col">
                                    <div className="flex sm:items-center gap-2 w-1/2 max-sm:w-full max-sm:flex-col">
                                        <Label htmlFor="firstname">First Name</Label>
                                        <Input id="firstname" name="firstname" value={formData.firstname || ''} onChange={handleInputChange} />
                                    </div>
    
                                    <div className="flex sm:items-center gap-2 w-1/2 max-sm:w-full max-sm:flex-col">
                                        <Label htmlFor="lastname">Last Name</Label>
                                        <Input id="lastname" name="lastname" value={formData.lastname || ''} onChange={handleInputChange} />
                                    </div>
                                </div>
    
                                <div className="space-y-2">
                                    <Label htmlFor="username">Username</Label>
                                    <Input id="username" name="username" value={formData.username || ''} onChange={handleInputChange} />
                                </div>
    
                                <div className="space-y-2">
                                    <Label htmlFor="email">Email</Label>
                                    <Input id="email" name="email" type="email" value={formData.email || ''} onChange={handleInputChange} />
                                </div>
    
                                <div className="space-y-2">
                                    <Label htmlFor="country">Country</Label>
                                    <Select name="country" value={formData.country || ''} onValueChange={(value: string) => setFormData(prev => ({ ...prev, country: value }))}>
                                        <SelectTrigger>
                                            <SelectValue placeholder={formData.country || "Select your country"} />
                                        </SelectTrigger>
                                        
                                        <SelectContent>
                                            <Countries />
                                        </SelectContent>
                                    </Select>
                                </div>
                            </CardContent>
                        </Card>
    
                            <Card className="max-sm:rounded-none max-sm:max-w-screen">
                                <CardHeader className="max-sm:w-full">
                                    <CardTitle className="max-sm:text-center max-sm:w-full">Language Profile</CardTitle>
                                    <CardDescription className="max-sm:text-center max-sm:w-full">Manage your language skills and learning goals.</CardDescription>
                                </CardHeader>
        
                                <CardContent className="flex flex-col gap-12 max-sm:p-1">
                                    <div className="space-y-2">
                                        <Label htmlFor="native_language" className="max-sm:text-center max-sm:w-full">Native Language</Label>
                                        <Select name="native_language" value={formData.native_language || ''} onValueChange={(value: string) => setFormData(prev => ({ ...prev, native_language: value }))}>
                                            <SelectTrigger>
                                                <SelectValue placeholder={formData.native_language || "Select your native language"} />
                                            </SelectTrigger>
                                            
                                            <SelectContent>
                                                <Languages />
                                            </SelectContent>
                                        </Select>
                                    </div>
        
                                    <div className="space-y-2 flex flex-col gap-2">
                                        <Label className="max-sm:text-center max-sm:w-full">Learning Languages</Label>
                                        {formData.languages.length > 0 ? (
                                            formData.languages.map((lang, index) => (
                                                <div key={index} className="flex flex-col space-y-2 max-sm:w-full">
                                                    <div className="flex justify-between items-center max-sm:w-full max-sm:px-1">
                                                        <div className="flex flex-col max-sm:w-full">
                                                            <span className="font-medium">{lang}</span>
                                                            <span className="text-sm text-gray-500">{formData.levels[index]}</span>
                                                        </div>
                                                        <Button variant="outline" onClick={() => deleteLanguage(lang)}>Delete</Button>
                                                    </div>
                                                    <Progress 
                                                        value={progressLevels[formData.levels[index] as keyof typeof progressLevels] || 0} 
                                                        className="h-2" 
                                                    />
                                                </div>
                                            ))
                                        ) : (
                                            <p className="text-sm text-gray-500 max-sm:text-center max-sm:w-full">No learning languages added yet.</p>
                                        )}
                                        {twoLanguages ? (
                                            <p className="text-sm text-gray-500 max-sm:text-center max-sm:w-full">
                                                You have reached the maximum number of languages.
                                                Delete one to add another or update your current subscription.
                                                (Coming soon)
                                            </p>
                                        ) : (
                                        <Dialog open={isAddLanguageOpen} onOpenChange={setIsAddLanguageOpen}>
                                            <DialogTrigger asChild>
                                                <Button variant="outline" className="max-sm:w-full max-sm:text-center">Add Language</Button>
                                            </DialogTrigger>
                                            <DialogContent>
                                                <DialogHeader>
                                                    <DialogTitle className="max-sm:text-center max-sm:w-full">Add New Language</DialogTitle>
                                                </DialogHeader>
                                                <div className="grid gap-4 py-4 max-sm:w-full">
                                                    <Select
                                                        value={newLanguage.language}
                                                        onValueChange={(value) => setNewLanguage(prev => ({ ...prev, language: value }))}
                                                    >
                                                        <SelectTrigger className="max-sm:w-full max-sm:text-center">
                                                            <SelectValue placeholder="Select language" />
                                                        </SelectTrigger>
                                                        <SelectContent>
                                                            <Languages />
                                                        </SelectContent>
                                                    </Select>
                                                    <Select
                                                        value={newLanguage.level}
                                                        onValueChange={(value) => setNewLanguage(prev => ({ ...prev, level: value }))}
                                                    >
                                                        <SelectTrigger className="max-sm:w-full max-sm:text-center">
                                                            <SelectValue placeholder="Select level" />
                                                        </SelectTrigger>
                                                        <SelectContent>
                                                            <SelectItem value="Beginner">Beginner</SelectItem>
                                                            <SelectItem value="Intermediate">Intermediate</SelectItem>
                                                            <SelectItem value="Advanced">Advanced</SelectItem>
                                                            <SelectItem value="Fluent">Fluent</SelectItem>
                                                        </SelectContent>
                                                        </Select>
                                                        <Button onClick={handleAddLanguage}>Add</Button>
                                                    </div>
                                                </DialogContent>
                                            </Dialog>
                                        )}
                                    </div>
                                </CardContent>
                            </Card>
    
                            <Card className="max-sm:rounded-none max-sm:max-w-screen max-sm:flex max-sm:justify-center max-sm:flex-col max-sm:items-center">
                                <CardHeader className="max-sm:px-1 max-sm:w-full">
                                    <CardTitle className="max-sm:text-center max-sm:w-full">Interests</CardTitle>
                                    <CardDescription className="max-sm:text-center max-sm:w-full">Select your interests or add new ones to connect with like-minded language learners.</CardDescription>
                                </CardHeader>
                                
                                <CardContent className="max-sm:p-1">
                                    <div className="flex flex-wrap gap-2 mb-4 max-sm:justify-center max-sm:items-center max-sm:w-full">
                                        {allInterests.map((interest) => (
                                            <Badge
                                                key={interest}
                                                variant={formData.interests.includes(interest) ? "default" : "outline"}
                                                className={`cursor-pointer ${formData.interests.includes(interest) ? 'bg-primary text-primary-foreground' : ''}`}
                                                onClick={() => handleInterestChange(interest)}
                                            >
                                                {interest}
                                            </Badge>
                                        ))}
                                    </div>
                                    <div className="flex gap-2 max-sm:flex-col max-sm:w-full max-sm:justify-center max-sm:items-center">
                                        <Input
                                            placeholder="Add new interest"
                                            value={newInterest}
                                            onChange={(e) => setNewInterest(e.target.value)}
                                        />
                                        <Button onClick={handleAddInterest} className="max-sm:w-[80%] max-sm:text-center">Add</Button>
                                    </div>
                                </CardContent>
                            </Card>
        
                            <Card className="max-sm:rounded-none max-sm:max-w-screen max-sm:flex max-sm:justify-center max-sm:flex-col max-sm:items-center">
                                <CardHeader className="max-sm:w-full">
                                    <CardTitle className="max-sm:text-center max-sm:w-full">Bio</CardTitle>
                                    <CardDescription className="max-sm:text-center max-sm:w-full">Tell others about yourself and your language learning journey.</CardDescription>
                                </CardHeader>
                                <CardContent className="max-sm:p-4">
                                    <Textarea
                                        name="bio"
                                        value={formData.bio}
                                        onChange={handleInputChange}
                                        rows={5}
                                        placeholder="Write a brief bio..."
                                    />
                                </CardContent>
                            </Card>
                        </div>
                        <div className="mt-6 max-sm:flex max-sm:justify-center">
                            <Button type="submit" className="w-full sm:w-auto max-sm:w-[80%] max-sm:text-center">
                                <Save className="w-4 h-4 mr-2 max-sm:hidden" />
                                Save Changes
                            </Button>
                        </div>
                    </form>
                </main>
            </>
        );
    }