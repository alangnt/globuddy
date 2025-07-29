"use client";

import { useRouter } from "next/navigation";

export default function LandingPage() {
    const router = useRouter();

    return (
        <>
          <div className="flex flex-col min-h-screen bg-gradient-to-r from-[#224aa8] to-[#b56fdc]">
            <header>Hi</header>
          </div>
        </>
    );
}