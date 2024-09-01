import { notFound } from "next/navigation"
import PostsContent from "./PostsContent"

async function getPost(postId: string) {
    const url = `${process.env.NEXTAUTH_URL}/api/post?postId=${postId}`;
    const res = await fetch(url, { next: { revalidate: 3600 } });
    if (!res.ok) {
        if (res.status === 404) return null;
        throw new Error(`Failed to fetch post: ${res.status} ${res.statusText}`);
    }
    return res.json();
}

export default async function PostPage({ params }: { params: { postId: string } }) {
    const postId = params.postId;
    const post = await getPost(postId);

    if (!post) {
        notFound();
    }

    return <PostsContent post={post} />;
}