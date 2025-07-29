"use client";

import { useRouter } from "next/navigation";

export default function LandingPage() {
    const router = useRouter();

    const buttonsList = [
      { name: 'Register', value: 'register' },
      { name: 'Login', value: 'login' },
    ];

    return (
        <>
          <div className="flex flex-col items-center justify-center min-h-screen text-background bg-gradient-to-r from-[#224aa8] to-[#b56fdc]">
            <header className="text-8xl">Globuddy</header>
            <main>
              {buttonsList.map((buttonItem, index) => (
                <button key={index}>{buttonItem.name}</button>
              ))}
            </main>
          </div>
        </>
    );
} 