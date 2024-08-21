import NextAuth, { NextAuthOptions } from "next-auth";
import CredentialsProvider from "next-auth/providers/credentials";
import { DefaultSession } from "next-auth";

declare module "next-auth" {
    interface Session {
        user: {
            id: string;
            email: string;
            username: string;
            firstname: string;
            lastname: string;
            country: string;
            bio: string;
            nativeLanguage: string;
            learningLanguages: { name: string; level: string }[];
            interests: { interest: string }[];
            avatarUrl: string;
            joinDate: string;
        } & DefaultSession["user"];
    }
    interface User {
        id: string;
        email: string;
        username: string;
        firstname: string;
        lastname: string;
        country: string;
        bio: string;
        nativeLanguage: string;
        learningLanguages: { name: string; level: string }[];
        interests: { interest: string }[];
        avatarUrl: string;
        joinDate: string;
    }
}

export const authOptions: NextAuthOptions = {
    providers: [
        CredentialsProvider({
            name: "Credentials",
            credentials: {
              email: { label: "Email", type: "text" },
              password: { label: "Password", type: "password" },
            },
            async authorize(credentials) {
                if (!credentials?.email || !credentials?.password) {
                    throw new Error("Email and password required");
                }

                try {
                    const res = await fetch(`${process.env.NEXTAUTH_URL}/api/auth/login`, {
                        method: 'POST',
                        body: JSON.stringify(credentials),
                        headers: { "Content-Type": "application/json" }
                    });

                    if (res.ok) {
                        const user = await res.json();
                        return {
                            id: user.id,
                            email: user.email,
                            username: user.username,
                            firstname: user.firstname,
                            lastname: user.lastname,
                            country: user.country,
                            bio: user.bio,
                            nativeLanguage: user.nativeLanguage,
                            learningLanguages: user.learningLanguages,
                            interests: user.interests,
                            avatarUrl: user.avatarUrl,
                            joinDate: user.joinDate,
                        };
                    } else {
                        const errorText = await res.text();
                        console.error('Login failed:', errorText);
                        throw new Error(errorText || 'Login failed');
                    }
                } catch (error) {
                    console.error('Authorization error:', error);
                    throw new Error('An error occurred during authentication');
                }
            }
        })
    ],
    session: {
        strategy: "jwt",
        maxAge: 30 * 24 * 60 * 60,
    },
    secret: process.env.NEXTAUTH_SECRET,
    pages: {
        signIn: '/login',
    },
    callbacks: {
        async jwt({ token, user }) {
            if (user) {
                token.id = user.id;
                token.email = user.email;
                token.username = user.username;
                token.firstname = user.firstname;
                token.lastname = user.lastname;
                token.country = user.country;
                token.bio = user.bio;
                token.nativeLanguage = user.nativeLanguage;
                token.learningLanguages = user.learningLanguages;
                token.interests = user.interests;
                token.avatarUrl = user.avatarUrl;
                token.joinDate = user.joinDate;
            }
            return token;
        },
        async session({ session, token }) {
            session.user = {
                id: token.id as string,
                email: token.email as string,
                username: token.username as string,
                firstname: token.firstname as string,
                lastname: token.lastname as string,
                country: token.country as string,
                bio: token.bio as string,
                nativeLanguage: token.nativeLanguage as string,
                learningLanguages: token.learningLanguages as { name: string; level: string }[],
                interests: token.interests as { interest: string }[],
                avatarUrl: token.avatarUrl as string,
                joinDate: token.joinDate as string,
            };
            return session;
        }
    }
};

const handler = NextAuth(authOptions);

export { handler as GET, handler as POST };