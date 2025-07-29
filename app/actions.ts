import client from '@/lib/mongodb';

export const usersCollection = client.db("globuddy").collection("users");
export const postsCollection = client.db("globuddy").collection("posts");