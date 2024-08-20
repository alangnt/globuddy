"use client";

import Link from "next/link";
import { Earth, Globe2, Save } from "lucide-react";
import { useSession } from "next-auth/react";
import { useEffect, useState } from "react";
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

interface LearningLanguage {
    language: string;
    level: string;
}

interface FormData {
    firstname: string;
    lastname: string;
    username: string;
    email: string;
    location: string;
    bio: string;
    native_language: string;
    learning_languages: LearningLanguage[];
    interests: string[];
}

export default function Profile() {
    const { data: session, status } = useSession()
    const router = useRouter()
    const [newLanguage, setNewLanguage] = useState({ language: '', level: '' });
    const [isAddLanguageOpen, setIsAddLanguageOpen] = useState(false);
    const [formData, setFormData] = useState<FormData>({
        firstname: '',
        lastname: '',
        username: '',
        email: '',
        location: '',
        bio: '',
        native_language: '',
        learning_languages: [],
        interests: []
    })

    const ALL_INTERESTS = [
        "Travel",
        "Food",
        "Sports",
        "Music",
        "Movies",
        "Books",
        "Art",
        "Fashion",
        "Technology",
        "Science",
        "History",
        "Philosophy",
        "Politics",
        "Religion",
        "Other"
    ]

    useEffect(() => {
        const fetchProfile = async () => {
            if (status === "authenticated" && session?.user?.username) {
                try {
                    const response = await fetch(`/api/profile?username=${session.user.username}`);
                    if (!response.ok) {
                        throw new Error('Failed to fetch profile');
                    }
                    const profileData = await response.json();
                    
                    console.log('Fetched profile data:', profileData); // Add this line for debugging
    
                    setFormData({
                        ...profileData,
                        interests: Array.isArray(profileData.interests) ? profileData.interests : [],
                        learning_languages: Array.isArray(profileData.learning_languages) 
                            ? profileData.learning_languages.map((lang: any) => ({
                                language: lang.language || '',
                                level: lang.level || ''
                              }))
                            : [],
                    });
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
    
        try {
            const response = await fetch('/api/profile', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify({
                    ...formData,
                    interests: formData.interests // Make sure this line is included
                })
            })
    
            if (!response.ok) {
                throw new Error('Failed to update profile')
            }
    
            const updatedProfile = await response.json()
            console.log('Profile updated successfully:', updatedProfile)
            // Optionally, update the form data with the response
            setFormData(updatedProfile)
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

    // Traduct the level to a number of progress
    const progressLevels = {
        Beginner: 0,
        Intermediate: 50,
        Advanced: 75,
        Fluent: 100
    }

    const handleAddLanguage = () => {
        if (newLanguage.language && newLanguage.level) {
            setFormData(prev => ({
                ...prev,
                learning_languages: [...prev.learning_languages, newLanguage]
            }));
            setNewLanguage({ language: '', level: '' });
            setIsAddLanguageOpen(false);
        }
    };

    const deleteLanguage = async (username: string, languageToDelete: string) => {
        try {
            const response = await fetch('/api/profile', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify({
                    username: username,
                    delete_language: languageToDelete
                }),
            });
            if (!response.ok) {
                throw new Error('Failed to delete language');
            }
            const updatedUser = await response.json();
            console.log('Language deleted, updated user:', updatedUser);
            
            // Update the formData state to reflect the deletion
            setFormData(prev => ({
                ...prev,
                learning_languages: prev.learning_languages.filter(lang => lang.language !== languageToDelete)
            }));
        } catch (error) {
            console.error('Error deleting language:', error);
        }
    };

    return (
        <>
            <header className="flex justify-between items-center px-2 mb-4">
                <Link href="/" className="flex items-center gap-1">
                    <Earth />
                    <h1 className="text-2xl font-bold">Globuddy</h1>
                </Link>
    
                <nav>
                    <ul className="flex py-0">
                        <li className="text-black px-4 py-2 hover:bg-gray-200 border-b-2 border-transparent hover:border-gray-400 transition-all duration-300 w-full flex justify-center items-center"><Link href="/home">Home</Link></li>
                        <li className="text-black px-4 bg-gray-200 border-b-2 border-gray-400 transition-all duration-300 w-full flex justify-center items-center"><Link href="/profile">Profile</Link></li>
                        <li className="text-black px-4 py-2 hover:bg-gray-200 border-b-2 border-transparent hover:border-gray-400 transition-all duration-300 w-full flex justify-center"><Link href="/messages">Messages</Link></li>
                        <li className="text-black px-4 py-2 hover:bg-gray-200 border-b-2 border-transparent hover:border-gray-400 transition-all duration-300 w-full flex justify-center"><Link href="/settings">Settings</Link></li>
                    </ul>
                </nav>
            </header>
    
            <main className="flex-1 py-12 container mx-auto px-4 md:px-6">
                <h1 className="text-3xl font-bold text-gray-800 mb-6">Edit Your Profile</h1>
                <form onSubmit={handleSubmit}>
                    <div className="grid gap-6 md:grid-cols-2">
                        <Card>
                            <CardHeader>
                                <CardTitle>Personal Information</CardTitle>
                                <CardDescription>Update your personal details and public profile.</CardDescription>
                            </CardHeader>
    
                            <CardContent className="space-y-4">
                                <div className="space-y-2">
                                    <Label htmlFor="avatar">Profile Picture</Label>
                                    <div className="flex items-center space-x-4">
                                        <Avatar className="w-20 h-20">
                                        <AvatarImage src="/placeholder-user.jpg" alt={formData.firstname || ''} />
                                        <AvatarFallback>{formData.firstname?.charAt(0)}</AvatarFallback>
                                        </Avatar>
                                        <Button variant="outline">Change Avatar</Button>
                                    </div>
                                </div>
    
                                <div className="flex gap-4">
                                    <div className="flex items-center gap-2 w-1/2">
                                        <Label htmlFor="firstname">First Name</Label>
                                        <Input id="firstname" name="firstname" value={formData.firstname || ''} onChange={handleInputChange} />
                                    </div>
    
                                    <div className="flex items-center gap-2 w-1/2">
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
                                    <Label htmlFor="location">Location</Label>
                                    <Input id="location" name="location" value={formData.location || ''} onChange={handleInputChange} />
                                </div>
                            </CardContent>
                        </Card>
    
                        <Card>
                            <CardHeader>
                                <CardTitle>Language Profile</CardTitle>
                                <CardDescription>Manage your language skills and learning goals.</CardDescription>
                            </CardHeader>
    
                            <CardContent className="space-y-4">
                                <div className="space-y-2">
                                    <Label htmlFor="nativeLanguage">Native Language</Label>
                                    <Select name="native_language" value={formData.native_language || ''} onValueChange={(value: string) => setFormData(prev => ({ ...prev, native_language: value }))}>
                                        <SelectTrigger>
                                            <SelectValue placeholder={formData.native_language || "Select your native language"} />
                                        </SelectTrigger>
                                        
                                        <SelectContent>
                                            <SelectItem value="English">English</SelectItem>
                                            <SelectItem value="Spanish">Spanish</SelectItem>
                                            <SelectItem value="French">French</SelectItem>
                                            <SelectItem value="German">German</SelectItem>
                                            <SelectItem value="Japanese">Japanese</SelectItem>
                                        </SelectContent>
                                    </Select>
                                </div>
    
                                <div className="space-y-2 flex flex-col gap-2">
                                    <Label>Learning Languages</Label>
                                    {formData.learning_languages && formData.learning_languages.length > 0 ? (
                                        formData.learning_languages.map((lang, index) => (
                                            <div key={index} className="flex flex-col space-y-2">
                                                <div className="flex justify-between items-center">
                                                    <span className="font-medium">{lang.language}</span>
                                                    <span className="text-sm text-gray-500">{lang.level}</span>
                                                    <Button variant="outline" onClick={() => deleteLanguage(formData.username, lang.language)}>Delete</Button>
                                                </div>
                                                <Progress 
                                                    value={progressLevels[lang.level as keyof typeof progressLevels] || 0} 
                                                    className="h-2" 
                                                />
                                            </div>
                                        ))
                                    ) : (
                                        <p className="text-sm text-gray-500">No learning languages added yet.</p>
                                    )}
                                    <Dialog open={isAddLanguageOpen} onOpenChange={setIsAddLanguageOpen}>
                                        <DialogTrigger asChild>
                                            <Button variant="outline">Add Language</Button>
                                        </DialogTrigger>
                                        <DialogContent>
                                            <DialogHeader>
                                                <DialogTitle>Add New Language</DialogTitle>
                                            </DialogHeader>
                                            <div className="grid gap-4 py-4">
                                                <Select
                                                    value={newLanguage.language}
                                                    onValueChange={(value) => setNewLanguage(prev => ({ ...prev, language: value }))}
                                                >
                                                    <SelectTrigger>
                                                        <SelectValue placeholder="Select language" />
                                                    </SelectTrigger>
                                                    <SelectContent>
                                                        <SelectItem value="English">English</SelectItem>
                                                        <SelectItem value="Spanish">Spanish</SelectItem>
                                                        <SelectItem value="French">French</SelectItem>
                                                        <SelectItem value="German">German</SelectItem>
                                                        <SelectItem value="Chinese">Chinese</SelectItem>
                                                    </SelectContent>
                                                </Select>
                                                <Select
                                                    value={newLanguage.level}
                                                    onValueChange={(value) => setNewLanguage(prev => ({ ...prev, level: value }))}
                                                >
                                                    <SelectTrigger>
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
                                </div>
                            </CardContent>
                        </Card>
    
                        <Card>
                            <CardHeader>
                                <CardTitle>Interests</CardTitle>
                                <CardDescription>Select your interests to connect with like-minded language learners.</CardDescription>
                            </CardHeader>
                            
                            <CardContent>
                                <div className="flex flex-wrap gap-2">
                                {ALL_INTERESTS.map((interest) => (
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
                            </CardContent>
                        </Card>
    
                        <Card>
                            <CardHeader>
                                <CardTitle>Bio</CardTitle>
                                <CardDescription>Tell others about yourself and your language learning journey.</CardDescription>
                            </CardHeader>
                            <CardContent>
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
                    <div className="mt-6">
                        <Button type="submit" className="w-full sm:w-auto">
                            <Save className="w-4 h-4 mr-2" />
                            Save Changes
                        </Button>
                    </div>
                </form>
            </main>
        </>
    );
}