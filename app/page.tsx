"use client"

import { useSession } from "next-auth/react";
import SidebarComponent from "@/components/core/Sidebar";
import LandingPage from "./landing-page/page";
import HomePage from "./home/page";

export default function App() {
  const { data: session, status } = useSession();

  return (
    <div>
      <SidebarComponent></SidebarComponent>
      <main>
        {status === 'authenticated' ? (
          <div>
            <HomePage></HomePage>
          </div>
        ) : (
          <div>
            <LandingPage></LandingPage>
          </div>
        )}
      </main>
    </div>
  );
}
