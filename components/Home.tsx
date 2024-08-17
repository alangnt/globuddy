import Link from "next/link";
import { Earth } from "lucide-react";

export default function Home() {
    return (
        <>
            <header className="flex justify-between items-center p-2 mb-4">
                <div className="flex items-center gap-1">
                    <Earth />
                    <h1 className="text-2xl font-bold">Globuddy</h1>
                </div>

                <nav>
                    <ul className="flex gap-4">
                        <li><Link href="/">Home</Link></li>
                        <li><Link href="/">Profile</Link></li>
                        <li><Link href="/">Messages</Link></li>
                        <li><Link href="/">Settings</Link></li>
                    </ul>
                </nav>
            </header>

            <main className="flex flex-col items-center grow">
                <section className="flex flex-col gap-8 w-full max-w-2xl mx-auto bg-white p-4 rounded-md border border-gray-300">
                    <div>
                        <h2 className="text-2xl font-bold">Create a New Post</h2>
                        <p className="text-gray-500 text-sm">Share your thoughts or find a language partner</p>
                    </div>

                    <form action="" className="flex flex-col gap-4">
                        <textarea 
                            name="content" 
                            placeholder="What's on your mind? Share your language learning goals or ask for a partner to practice with..."
                            className="w-full p-2 border border-gray-300 rounded-md placeholder:text-sm"
                        />
                        <button type="submit" className="bg-black text-white p-2 px-4 rounded-md text-sm w-min">Post</button>
                    </form>
                </section>


            </main>

            <footer className="flex flex-col items-center justify-center py-2 text-sm">
                <p>© 2024 Globuddy. All rights reserved.</p>
            </footer>
        </>
    );
}