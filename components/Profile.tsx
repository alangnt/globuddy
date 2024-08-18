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

interface LearningLanguage {
    language: string
    level: string
}

interface FormData {
    firstname: string
    lastname: string
    username: string
    email: string
    location: string
    bio: string
    native_language: string
    learning_languages: string[]
    levels: string[]
    interests: { interest: string }[];
}

export default function Profile() {
    const { data: session, status } = useSession()
    const router = useRouter()
    const [formData, setFormData] = useState<FormData>({
        firstname: '',
        lastname: '',
        username: '',
        email: '',
        location: '',
        bio: '',
        native_language: '',
        learning_languages: [],
        interests: [],
        levels: []
    })

    useEffect(() => {
        const fetchProfile = async () => {
            if (status === "authenticated" && session?.user?.username) {
                try {
                    const response = await fetch(`/api/profile?username=${session.user.username}`)
                    if (!response.ok) {
                        throw new Error('Failed to fetch profile')
                    }
                    const profileData = await response.json()
                    
                    // Ensure interests is always an array of objects
                    const formattedInterests = Array.isArray(profileData.interests)
                        ? profileData.interests.map((interest: any) => 
                            typeof interest === 'string' ? { interest } : interest)
                        : [];

                    const formattedLearningLanguages = Array.isArray(profileData.learning_languages)
                        ? profileData.learning_languages
                        : [];

                    const formattedLearningLevels = Array.isArray(profileData.learning_levels)
                        ? profileData.learning_levels
                        : [];

                    setFormData({
                        firstname: profileData.firstname || '',
                        lastname: profileData.lastname || '',
                        username: profileData.username || '',
                        email: profileData.email || '',
                        location: profileData.location || '',
                        bio: profileData.bio || '',
                        native_language: profileData.native_language || '',
                        learning_languages: formattedLearningLanguages,
                        interests: formattedInterests,
                        levels: formattedLearningLevels
                    })
                } catch (error) {
                    console.error('Error fetching profile:', error)
                }
            }
        }

        fetchProfile()
    }, [status, session])
    
    const handleInputChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
        const { name, value } = e.target
        setFormData(prev => ({ ...prev, [name]: value }))
    }
    
    const handleLanguageChange = (index: number, value: string) => {
        setFormData(prev => ({
            ...prev,
            learning_languages: prev.learning_languages.map((lang, i) =>
                i === index ? value : lang
            )
        }))
    }

    const handleLevelChange = (index: number, value: string) => {
        setFormData(prev => ({
            ...prev,
            levels: prev.levels.map((level, i) =>
                i === index ? value : level
            )
        }))
    }
    
    const handleInterestChange = (interest: string) => {
        setFormData(prev => ({
            ...prev,
            interests: prev.interests.some(i => i.interest === interest)
                ? prev.interests.filter(i => i.interest !== interest)
                : [...prev.interests, { interest }]
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
                body: JSON.stringify(formData)
            })

            if (!response.ok) {
                throw new Error('Failed to update profile')
            }

            const updatedProfile = await response.json()
            // Update the session or show a success message
            console.log('Profile updated successfully:', updatedProfile)
        } catch (error) {
            console.error('Error updating profile:', error)
            // Show an error message to the user
        }
    }

    if (status === "loading") {
        return <div>Loading...</div>
    }

    if (status === "unauthenticated") {
        router.push('/login')
        return null
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
                        <li className="text-black px-4 py-2 hover:bg-gray-200 border-b-2 border-transparent hover:border-gray-400 transition-all duration-300 w-full flex justify-center"><Link href="/home">Home</Link></li>
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
    
                                <div className="space-y-2 space-x-2">
                                    <Label>Learning Languages</Label>
                                    {formData.learning_languages.map((lang, index) => (
                                        <div key={index} className="flex space-x-2">
                                            <Select value={lang} onValueChange={(value: string) => handleLanguageChange(index, value)}>
                                                <SelectTrigger className="w-[180px]">
                                                    <SelectValue placeholder="Select a language" />
                                                </SelectTrigger>
                                                
                                                <SelectContent>
                                                    <SelectItem value="English">English</SelectItem>
                                                    <SelectItem value="Spanish">Spanish</SelectItem>
                                                    <SelectItem value="French">French</SelectItem>
                                                    <SelectItem value="German">German</SelectItem>
                                                    <SelectItem value="Japanese">Japanese</SelectItem>
                                                </SelectContent>
                                            </Select>
                                            <Select value={formData.levels[index]} onValueChange={(value: string) => handleLevelChange(index, value)}>
                                                <SelectTrigger className="w-[180px]">
                                                    <SelectValue placeholder="Select level" />
                                                </SelectTrigger>
                                                
                                                <SelectContent>
                                                    <SelectItem value="Beginner">Beginner</SelectItem>
                                                    <SelectItem value="Intermediate">Intermediate</SelectItem>
                                                    <SelectItem value="Advanced">Advanced</SelectItem>
                                                    <SelectItem value="Fluent">Fluent</SelectItem>
                                                </SelectContent>
                                            </Select>
                                        </div>
                                    ))}
                                    <Button variant="outline" onClick={() => setFormData(prev => ({
                                        ...prev,
                                        learning_languages: [...prev.learning_languages, ''],
                                        levels: [...prev.levels, '']
                                    }))}>
                                        Add Language
                                    </Button>
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
                                {["Literature", "Cinema", "Cooking", "Travel", "Music", "Sports", "Art", "Technology", "Science", "History"].map((interest) => (
                                    <Badge
                                        key={interest}
                                        variant={formData.interests.some(i => i.interest === interest) ? "default" : "outline"}
                                        className="cursor-pointer"
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
    )
}