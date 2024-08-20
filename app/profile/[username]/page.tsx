import { notFound } from 'next/navigation'
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Progress } from "@/components/ui/progress"
import { Globe2, MapPin, Calendar, UserPlus, Earth, Menu } from "lucide-react"
import Link from 'next/link'
import { Sheet, SheetContent, SheetHeader, SheetTitle, SheetTrigger } from "@/components/ui/sheet"

async function getUser(username: string) {
  const res = await fetch(`${process.env.NEXTAUTH_URL}/api/users?username=${username}`, { next: { revalidate: 3600 } })
  if (!res.ok) {
    if (res.status === 404) return null
    throw new Error('Failed to fetch user')
  }
  return res.json()
}

export default async function ProfilePage({ params }: { params: { username: string } }) {
  const user = await getUser(params.username)

  if (!user) {
    notFound()
  }

  return (
    <div className="flex flex-col min-h-screen bg-gray-100">
      <header className="flex justify-between items-center px-2 mb-12">
                <Link href="/" className="flex items-center gap-1">
                    <Earth />
                    <h1 className="text-2xl font-bold">Globuddy</h1>
                </Link>

                <nav className="hidden sm:block">
                    <ul className="flex py-0">
                        <li className="text-black px-4 py-2 hover:bg-gray-200 border-b-2 border-transparent hover:border-gray-400 transition-all duration-300 w-full flex justify-center"><Link href="/home">Home</Link></li>
                        <li className="text-black px-4 py-2 hover:bg-gray-200 border-b-2 border-transparent hover:border-gray-400 transition-all duration-300 w-full flex justify-center"><Link href="/profile">Profile</Link></li>
                        <li className="text-black px-4 py-2 hover:bg-gray-200 border-b-2 border-transparent hover:border-gray-400 transition-all duration-300 w-full flex justify-center"><Link href="/messages">Messages</Link></li>
                        <li className="text-black px-4 py-2 hover:bg-gray-200 border-b-2 border-transparent hover:border-gray-400 transition-all duration-300 w-full flex justify-center"><Link href="/settings">Settings</Link></li>
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
                                <Link href="/settings" className="hover:scale-105 transition-all duration-300">Settings</Link>
                            </nav>
                        </SheetContent>
                    </Sheet>
                </div>
            </header>

      <main className="flex-1 py-12 container mx-auto px-4 md:px-6">
        <div className="grid gap-6 md:grid-cols-[1fr_2fr]">
          <div className="space-y-6">
            <Card>
              <CardContent className="p-6">
                <div className="flex flex-col items-center space-y-4">
                  <div className="text-center">
                    <h1 className="text-2xl font-bold">{user.name}</h1>
                    <p className="text-gray-500">{user.username}</p>
                  </div>
                  <div className="flex items-center text-gray-500 text-sm">
                    <MapPin className="w-4 h-4 mr-1" />
                    {user.location}
                  </div>
                  <div className="flex items-center text-gray-500 text-sm">
                    <Calendar className="w-4 h-4 mr-1" />
                    {user.joinDate}
                  </div>
                  <div className="flex space-x-2">
                    <Button variant="outline">
                      <UserPlus className="w-4 h-4 mr-2" />
                      Connect
                    </Button>
                  </div>
                </div>
              </CardContent>
            </Card>
            <Card>
              <CardHeader>
                <CardTitle>About Me</CardTitle>
              </CardHeader>
              <CardContent>
                <p className="text-gray-600">{user.bio}</p>
              </CardContent>
            </Card>
            <Card>
              <CardHeader>
                <CardTitle>Interests</CardTitle>
              </CardHeader>
              <CardContent>
              </CardContent>
            </Card>
          </div>
          <div className="space-y-6">
            <Card>
              <CardHeader>
                <CardTitle>Language Proficiency</CardTitle>
              </CardHeader>
              <CardContent>
              <div className="space-y-4">
                <div>
                    <div className="flex justify-between mb-1">
                        <span className="text-sm font-medium">Native Language: {user.nativeLanguage}</span>
                    </div>
                </div>
                {Array.isArray(user.learningLanguages) ? (
                    user.learningLanguages.map((lang: any, index: number) => (
                    <div key={index}>
                        <div className="flex justify-between mb-1">
                        <span className="text-sm font-medium">{lang.language}</span>
                        <span className="text-sm font-medium text-gray-500">{lang.level}</span>
                        </div>
                        <Progress value={lang.progress} className="h-2" />
                    </div>
                    ))
                ) : (
                    <p>No learning languages specified</p>
                )}
                </div>
              </CardContent>
            </Card>
            <Card>
              <CardHeader>
                <CardTitle>Recent Activity</CardTitle>
              </CardHeader>
              <CardContent>
              </CardContent>
            </Card>
          </div>
        </div>
      </main>
      <footer className="py-6 w-full shrink-0 items-center px-4 md:px-6 border-t bg-white">
        <p className="text-xs text-center text-gray-500">© 2024 LinguaLink. All rights reserved.</p>
      </footer>
    </div>
  )
}