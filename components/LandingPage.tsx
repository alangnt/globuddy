"use client";

import Link from "next/link";
import Image from "next/image";
import { useState } from "react";
import { useRouter } from "next/navigation";
import { useSession, signIn, signOut } from "next-auth/react";

import { UserRoundSearch, Earth } from "lucide-react";

export default function Landing() {
    const [submitted, setSubmitted] = useState<boolean>(false);
    const [activeSection, setActiveSection] = useState<string>('about');
    const router = useRouter();
    const { data: session, status } = useSession();

    const [formDataRegister, setFormDataRegister] = useState({
        username: '',
        email: '',
        password: '',
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

    const handleChangeLogin = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>) => {
        setFormDataLogin({
            ...formDataLogin,
            [e.target.name]: e.target.value,
        });
    };

    const handleRegister = async (e: React.FormEvent) => {
        e.preventDefault();

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
        } else {
            alert(data.error || 'Failed to register');
        }

        // Redirect to the login page
        setActiveSection('login');
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

    const renderSection = () => {
        switch (activeSection) {
            case 'login':
                return (
                    <section className="flex flex-col items-center justify-center gap-8">
                        <div className="flex flex-col items-center justify-center gap-2">
                            <h2 className="text-2xl font-bold text-center">Welcome back to Globuddy !</h2>
                            <p>Continue your journey of language exchange and cultural exploration with Globuddy.</p>
                        </div>                       

                        <form onSubmit={handleLogin} className="flex flex-col items-center justify-center gap-8">
                            <input onChange={handleChangeLogin} name="email" type="email" value={formDataLogin.email} placeholder="Email" className="p-2 rounded-md border-2 border-gray-200" />
                            <input onChange={handleChangeLogin} name="password" type="password" value={formDataLogin.password} placeholder="Password" className="p-2 rounded-md border-2 border-gray-200" />

                            <button type="submit" className="bg-white text-black px-4 py-2 rounded-md hover:bg-gray-200 border-2 border-gray-200">Login</button>
                        </form>
                    </section>
                );
            case 'register':
                return (
                    <section className="flex flex-col items-center justify-center gap-8">
                        <div className="flex flex-col items-center justify-center gap-2">
                            <h2 className="text-2xl font-bold text-center">Welcome to Globuddy !</h2>
                            <p>Embark on a journey of language exchange and cultural exploration with Globuddy.</p>
                        </div>

                        <form onSubmit={handleRegister} className="flex flex-col items-center justify-center gap-8">
                            <input onChange={handleChangeRegister} name="username" type="text" value={formDataRegister.username} placeholder="Username" className="p-2 rounded-md border-2 border-gray-200" />
                            <input onChange={handleChangeRegister} name="email" type="email" value={formDataRegister.email} placeholder="Email" className="p-2 rounded-md border-2 border-gray-200" />
                            <input onChange={handleChangeRegister} name="password" type="password" value={formDataRegister.password} placeholder="Password" className="p-2 rounded-md border-2 border-gray-200" />

                            <button type="submit" className="bg-white text-black px-4 py-2 rounded-md hover:bg-gray-200 border-2 border-gray-200">Register</button>
                        </form>
                    </section>
                );
            case 'contact':
                return (
                    <section className="flex flex-col items-center justify-center gap-8">
                        <div className="flex flex-col items-center justify-center gap-2">
                            <h2 className="text-2xl font-bold text-center">Contact</h2>
                            <p>Contact us at contact@globuddy.com</p>
                        </div>
                    </section>
                );
            default:
                return (
                    <section className="flex flex-col items-center justify-center gap-8">
                        <div className="flex flex-row items-center justify-center gap-4">
                            <article className="flex flex-col items-center justify-between w-1/6 gap-4 border-2 border-gray-200 rounded-md p-4 h-[300px] hover:scale-105 transition-all duration-300 bg-white">
                            <h2><UserRoundSearch /></h2>

                            <p className="flex grow">Globuddy is an international language exchange platform that allows you to connect with people from all over the world.</p>
                        </article>

                        <article className="flex flex-col items-center justify-between w-1/6 gap-4 border-2 border-gray-200 rounded-md p-4 h-[300px] hover:scale-105 transition-all duration-300 bg-white">
                            <h2><Earth /></h2>

                            <p className="flex grow">Explore the world with Globuddy. Connect with people from all over the world. Learn new languages and cultures.</p>
                        </article>

                        <article className="flex flex-col items-center justify-between w-1/6 gap-4 border-2 border-gray-200 rounded-md p-4 h-[300px] hover:scale-105 transition-all duration-300 bg-white">
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
                <section className="relative h-[40vh] w-full">
                    <Image src="/hero.png" alt="Home" width={1980} height={1080} className="w-full h-full object-cover" />

                    {status === "unauthenticated" && (
                    <div className="absolute inset-0 flex flex-col justify-end items-center text-white p-10">
                            <button className="bg-white text-black px-4 py-2 rounded-md hover:bg-gray-200" onClick={() => setActiveSection('register')}>Get Started</button>
                        </div>
                    )}
                </section>
            </header>
            {status === "authenticated" && session?.user ? (
                <main className="flex flex-col items-center gap-8 grow">
                    <nav className="w-full">
                        <ul className="flex justify-evenly items-center w-full">
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
                                onClick={() => signOut()}
                            >
                                <button className="w-full text-center">Logout</button>
                            </li>
                        </ul>
                    </nav>

                    <section>
                        <p>You're already logged in, {session.user.username}</p>
                    </section>
                </main>
                ) : (
                <main className="flex flex-col items-center gap-8 grow">
                    <nav className="w-full">
                        <ul className="flex justify-evenly items-center w-full">
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
                                className={`w-full flex justify-center bg-white text-black px-4 py-2 hover:bg-gray-200 border-b-2 border-transparent hover:border-gray-400 transition-all duration-300 ${activeSection === 'blog' ? 'bg-gray-200 border-gray-400' : ''}`}
                                onClick={() => setActiveSection('blog')}
                            >
                                <Link href="/" className="w-full text-center">Blog</Link>
                            </li>
                        </ul>
                    </nav>
                    {renderSection()}
                </main>
            )}  

            <footer className="flex flex-col items-center justify-center py-2 text-sm">
                <p>© 2024 Globuddy. All rights reserved.</p>
            </footer>
        </>
    );
}