"use client";

import Link from "next/link";
import Image from "next/image";
import { useState, useCallback, useEffect } from "react";
import { useRouter } from "next/navigation";
import { useSession, signIn, signOut } from "next-auth/react";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { UserRoundSearch, Earth } from "lucide-react";
import Countries from "@/components/Countries";
import Languages from "@/components/Languages";

export default function Landing() {
    const [submitted, setSubmitted] = useState<boolean>(false);
    const [activeSection, setActiveSection] = useState<string>('about');
    const router = useRouter();
    const { data: session, status } = useSession();
    const [notificationCount, setNotificationCount] = useState<number>(0);
    const [formDataRegister, setFormDataRegister] = useState({
        username: '',
        email: '',
        password: '',
        country: '',
        native_language: '',
        languages: [] as string[],
        levels: [] as string[],
        language: '',
        level: '',
    });

    const [formDataLogin, setFormDataLogin] = useState({
        email: '',
        password: '',
    });

    const handleChangeRegister = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>) => {
        setFormDataRegister({
            ...formDataRegister,
            [e.target.name]: e.target.value,
        });
    };

    const handleChangeRegisterMore = (name: string, value: string) => {
        setFormDataRegister(prev => ({
            ...prev,
            [name]: value,
            ...(name === 'language' ? { languages: [...prev.languages, value] } : {}),
            ...(name === 'level' ? { levels: [...prev.levels, value] } : {})
        }));
    };

    const handleChangeLogin = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>) => {
        setFormDataLogin({
            ...formDataLogin,
            [e.target.name]: e.target.value,
        });
    };

    const handleRegister = async (e: React.FormEvent) => {
        e.preventDefault();
        setActiveSection('register-more');
    }

    const handleCompleteRegistration = async (e: React.FormEvent) => {
        e.preventDefault();
    
        // Check if all required fields are filled
        if (!formDataRegister.username || !formDataRegister.email || !formDataRegister.password ||
            !formDataRegister.country || !formDataRegister.native_language || 
            formDataRegister.languages.length === 0 || formDataRegister.levels.length === 0) {
            alert('Please fill in all fields');
            return;
        }
    
        const response = await fetch('/api/auth/register', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
            },
            body: JSON.stringify(formDataRegister),
        });
    
        const data = await response.json();
    
        if (response.ok) {
            setSubmitted(true);
            setActiveSection('login');
        } else {
            alert(data.error || 'Failed to register');
        }
    }
    
    const handleLogin = async (e: React.FormEvent) => {
        e.preventDefault();

        const result = await signIn('credentials', {
            email: formDataLogin.email,
            password: formDataLogin.password,
            redirect: false,
        });

        if (result?.ok) {
            router.push('/home');
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

    const renderSection = () => {
        switch (activeSection) {
            case 'login':
                return (
                    <section className="flex flex-col items-center justify-center gap-8 max-sm:p-1">
                        <div className="flex flex-col items-center justify-center gap-2">
                            <h2 className="text-2xl font-bold text-center">Welcome back to Globuddy !</h2>
                            <p className="max-sm:text-center">Continue your journey of language exchange and cultural exploration with Globuddy.</p>
                        </div>                       

                        <form onSubmit={handleLogin} className="flex flex-col items-center justify-center gap-8">
                            <input onChange={handleChangeLogin} name="email" type="email" value={formDataLogin.email} placeholder="Email" className="p-2 rounded-md border-2 border-gray-200 max-sm:w-full" />
                            <input onChange={handleChangeLogin} name="password" type="password" value={formDataLogin.password} placeholder="Password" className="p-2 rounded-md border-2 border-gray-200 max-sm:w-full" />

                            <button type="submit" className="bg-white text-black px-4 py-2 rounded-md hover:bg-gray-200 border-2 border-gray-200">Login</button>
                        </form>
                    </section>
                );
            case 'register':
                return (
                    <section className="flex flex-col items-center justify-center gap-8 max-sm:p-1">
                        <div className="flex flex-col items-center justify-center gap-2">
                            <h2 className="text-2xl font-bold text-center">Welcome to Globuddy !</h2>
                            <p className="max-sm:text-center">Embark on a journey of language exchange and cultural exploration with Globuddy.</p>
                        </div>

                        <form onSubmit={handleRegister} className="flex flex-col items-center justify-center gap-8">
                            <input onChange={handleChangeRegister} name="username" type="text" value={formDataRegister.username} placeholder="Username" className="p-2 rounded-md border-2 border-gray-200 max-sm:w-full" required />
                            <input onChange={handleChangeRegister} name="email" type="email" value={formDataRegister.email} placeholder="Email" className="p-2 rounded-md border-2 border-gray-200 max-sm:w-full" required />
                            <input onChange={handleChangeRegister} name="password" type="password" value={formDataRegister.password} placeholder="Password" className="p-2 rounded-md border-2 border-gray-200 max-sm:w-full" required />

                            <button type="submit" className="bg-white text-black px-4 py-2 rounded-md hover:bg-gray-200 border-2 border-gray-200">Next</button>
                        </form>
                    </section>
                );
            case 'register-more':
                return (
                    <section className="flex flex-col items-center justify-center gap-8 max-sm:p-1">
                        <div className="flex flex-col items-center justify-center gap-2">
                            <h2 className="text-2xl font-bold text-center">Welcome ! Let us know about you.</h2>
                        </div>

                        <form onSubmit={handleCompleteRegistration} className="flex flex-col items-center justify-center gap-8">
                            <Select onValueChange={(value) => handleChangeRegisterMore("country", value)} value={formDataRegister.country}>
                                <SelectTrigger className="p-2 sm:rounded-md sm:border-2 sm:border-gray-200">
                                    <SelectValue placeholder="Country" />
                                </SelectTrigger>
                                <SelectContent>
                                    <Countries />
                                </SelectContent>
                            </Select>

                            <Select onValueChange={(value) => handleChangeRegisterMore("native_language", value)} value={formDataRegister.native_language}>
                                <SelectTrigger className="p-2 sm:rounded-md sm:border-2 sm:border-gray-200">
                                    <SelectValue placeholder="Native Language" />
                                </SelectTrigger>
                                <SelectContent>
                                    <Languages />
                                </SelectContent>
                            </Select>

                            <div className="flex flex-col gap-4 w-full">
                                <h3 className="max-sm:text-center">Learning Language</h3>
                                <Select 
                                    onValueChange={(value) => handleChangeRegisterMore("language", value)}
                                    value={formDataRegister.language}
                                >
                                    <SelectTrigger className="p-2 sm:rounded-md sm:border-2 sm:border-gray-200 w-full">
                                        <SelectValue placeholder="Select Learning Language" />
                                    </SelectTrigger>
                                    <SelectContent>
                                        <Languages />
                                    </SelectContent>
                                </Select>

                                <Select 
                                    onValueChange={(value) => handleChangeRegisterMore("level", value)}
                                    value={formDataRegister.level}
                                >
                                    <SelectTrigger className="p-2 sm:rounded-md sm:border-2 sm:border-gray-200 w-full">
                                        <SelectValue placeholder="Select Level" />
                                    </SelectTrigger>
                                    <SelectContent>
                                        <SelectItem value="Beginner">Beginner</SelectItem>
                                        <SelectItem value="Intermediate">Intermediate</SelectItem>
                                        <SelectItem value="Advanced">Advanced</SelectItem>
                                        <SelectItem value="Fluent">Fluent</SelectItem>
                                    </SelectContent>
                                </Select>
                            </div>

                            <button type="submit" className="bg-white text-black px-4 py-2 sm:rounded-md sm:border-2 sm:border-gray-200">
                                Complete Registration
                            </button>
                        </form>
                    </section>
                );
            case 'contact':
                return (
                    <section className="flex flex-col items-center justify-center gap-8">
                        <div className="flex flex-col items-center justify-center gap-2">
                            <h2 className="text-2xl font-bold text-center">Contact</h2>
                            <p className="max-sm:text-center">Contact us at contact@globuddy.com</p>
                        </div>
                    </section>
                );
            default:
                return (
                    <section className="flex flex-col items-center justify-center gap-8 max-sm:w-full">
                        <div className="flex flex-row items-center justify-center gap-4 max-sm:flex-col max-sm:w-full">
                            <article className="flex flex-col items-center justify-between sm:w-1/6 gap-4 sm:border-2 sm:border-gray-200 sm:rounded-md p-4 h-[300px] hover:scale-105 transition-all duration-300 bg-white max-sm:text-center">
                                <h2><UserRoundSearch /></h2>

                                <p className="flex grow">Globuddy is an international language exchange platform that allows you to connect with people from all over the world.</p>
                        </article>

                        <article className="flex flex-col items-center justify-between sm:w-1/6 gap-4 sm:border-2 sm:border-gray-200 sm:rounded-md p-4 h-[300px] hover:scale-105 transition-all duration-300 bg-white max-sm:text-center">
                            <h2><Earth /></h2>

                            <p className="flex grow">Explore the world with Globuddy. Connect with people from all over the world. Learn new languages and cultures.</p>
                        </article>

                        <article className="flex flex-col items-center justify-between sm:w-1/6 gap-4 sm:border-2 sm:border-gray-200 sm:rounded-md p-4 h-[300px] hover:scale-105 transition-all duration-300 bg-white max-sm:text-center">
                            <h2><UserRoundSearch /></h2>

                            <p className="flex grow">Globuddy is a project management tool that allows you to track your projects and tasks.</p>
                        </article>
                    </div>
                </section>
                );
        }
    };

    return (
        <>
            <header className="flex flex-col items-center justify-center">
                <section className="relative sm:h-[40vh] w-full">
                    <Image src="/hero.png" alt="Home" width={1980} height={1080} className="sm:w-full sm:h-full object-cover" />

                    {status === "unauthenticated" && (
                        <div className="sm:absolute inset-0 flex flex-col justify-end items-center text-white p-10">
                            <button className="bg-white text-black px-4 py-2 rounded-md hover:bg-gray-200" onClick={() => setActiveSection('register')}>Get Started</button>
                        </div>
                    )}
                </section>
            </header>
            {status === "authenticated" && session?.user ? (
                <main className="flex flex-col items-center gap-8 grow">
                    <nav className="w-full">
                        <ul className="flex justify-evenly items-center w-full max-sm:flex-col">
                            <li
                                className={`w-full flex justify-center bg-white text-black px-4 py-2 hover:bg-gray-200 border-b-2 border-transparent hover:border-gray-400 transition-all duration-300 ${activeSection === 'login' ? 'bg-gray-200 border-gray-400' : ''}`}
                            >
                                <Link href="/home" className="w-full text-center">Posts</Link>
                            </li>

                            <li
                                className={`w-full flex justify-center bg-white text-black px-4 py-2 hover:bg-gray-200 border-b-2 border-transparent hover:border-gray-400 transition-all duration-300 ${activeSection === 'profile' ? 'bg-gray-200 border-gray-400' : ''}`}
                                onClick={() => setActiveSection('profile')}
                            >
                                <Link href="/profile" className="w-full text-center">Profile</Link>
                            </li>

                            <li
                                className={`w-full flex justify-center bg-white text-black px-4 py-2 hover:bg-gray-200 border-b-2 border-transparent hover:border-gray-400 transition-all duration-300 ${activeSection === 'profile' ? 'bg-gray-200 border-gray-400' : ''}`}
                                onClick={() => setActiveSection('profile')}
                            >
                                <Link href="/notifications" className="flex items-center gap-2 hover:scale-105">
                                    Notifications
                                    {notificationCount > 0 && (
                                        <span className="bg-red-500 text-white rounded-full text-xs w-5 h-5 flex justify-center items-center">
                                            {notificationCount}
                                        </span>
                                    )}
                                </Link>
                            </li>

                            <li
                                className={`w-full flex justify-center bg-white text-black px-4 py-2 hover:bg-gray-200 border-b-2 border-transparent hover:border-gray-400 transition-all duration-300 ${activeSection === 'profile' ? 'bg-gray-200 border-gray-400' : ''}`}
                                onClick={() => signOut()}
                            >
                                <button className="w-full text-center">Logout</button>
                            </li>
                        </ul>
                    </nav>

                    <section>
                        <p className="text-center">You&apos;re already logged in, {session.user.username}</p>
                    </section>
                </main>
                ) : (
                <main className="flex flex-col items-center gap-8 grow">
                    <nav className="w-full">
                        <ul className="flex justify-evenly items-center w-full max-sm:flex-col">
                            <li 
                                className={`w-full flex justify-center bg-white text-black px-4 py-2 hover:bg-gray-200 border-b-2 border-transparent hover:border-gray-400 transition-all duration-300 ${activeSection === 'login' ? 'bg-gray-200 border-gray-400' : ''}`}
                                onClick={() => setActiveSection('login')}
                            >
                                <Link href="/" className="w-full text-center">Login</Link>
                            </li>

                            <li 
                                className={`w-full flex justify-center bg-white text-black px-4 py-2 hover:bg-gray-200 border-b-2 border-transparent hover:border-gray-400 transition-all duration-300 ${activeSection === 'register' ? 'bg-gray-200 border-gray-400' : ''}`}
                                onClick={() => setActiveSection('register')}
                            >
                                <Link href="/" className="w-full text-center">Register</Link>
                            </li>

                            <li 
                                className={`w-full flex justify-center bg-white text-black px-4 py-2 hover:bg-gray-200 border-b-2 border-transparent hover:border-gray-400 transition-all duration-300 ${activeSection === 'about' ? 'bg-gray-200 border-gray-400' : ''}`}
                                onClick={() => setActiveSection('about')}
                            >
                                <Link href="/" className="w-full text-center">About</Link>
                            </li>

                            <li 
                                className={`w-full flex justify-center bg-white text-black px-4 py-2 hover:bg-gray-200 border-b-2 border-transparent hover:border-gray-400 transition-all duration-300 ${activeSection === 'contact' ? 'bg-gray-200 border-gray-400' : ''}`}
                                onClick={() => setActiveSection('contact')}
                            >
                                <Link href="/" className="w-full text-center">Contact</Link>
                            </li>

                            <li 
                                className={`w-full flex justify-center bg-white text-black px-4 py-2 hover:bg-gray-200 border-b-2 border-transparent hover:border-gray-400 transition-all duration-300 ${activeSection === 'blog' ? 'bg-gray-200 border-gray-400' : ''} pointer-events-none`}
                            >
                                <Link href="/" className="w-full text-center">Blog (Soon)</Link>
                            </li>
                        </ul>
                    </nav>
                    {renderSection()}
                </main>
            )}  

            <footer className="flex flex-col items-center justify-center py-2 text-sm max-sm:mt-12 text-center">
                <p>© 2024 Globuddy. All rights reserved.</p>
            </footer>
        </>
    );
}