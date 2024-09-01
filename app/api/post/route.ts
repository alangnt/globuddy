import pg from 'pg';
import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from "next-auth/next";
import { authOptions } from "../auth/[...nextauth]/options";

const { Pool } = pg;

const pool = new Pool({
  connectionString: process.env.POSTGRES_URL,
})

// Handle GET request for posts
export async function GET(request: NextRequest) {
    const url = new URL(request.url);
    const postId = url.searchParams.get('postId');

    if (!postId) {
        return NextResponse.json({ error: 'Post ID is required' }, { status: 400 });
    }

    const session = await getServerSession(authOptions);
    const currentUsername = session?.user?.username || null;

    let postsQuery = `
      SELECT p.*, u.avatar_url, u.native_language, u.languages, u.bio,
             COUNT(DISTINCT l.id) AS likes_count,
             COUNT(DISTINCT c.id) AS comments_count,
             EXISTS(SELECT 1 FROM likes_globuddy ul WHERE ul.post_id = p.id AND ul.username = $2) AS user_liked
      FROM posts_globuddy p
      JOIN users_globuddy u ON p.username = u.username
      LEFT JOIN likes_globuddy l ON p.id = l.post_id
      LEFT JOIN comments_globuddy c ON p.id = c.post_id
      WHERE p.id = $1
      GROUP BY p.id, p.content, p.username, p.created_at, u.avatar_url, u.native_language, u.languages, p.likes, p.comments, p.user_comment, u.bio
    `;
    let queryParams = [postId, currentUsername];

    try {
        const result = await pool.query(postsQuery, queryParams);

        if (result.rows.length === 0) {
            return NextResponse.json({ error: 'Post not found' }, { status: 404 });
        }

        const postWithUserInfo = {
            id: result.rows[0].id,
            content: result.rows[0].content,
            username: result.rows[0].username,
            created_at: result.rows[0].created_at,
            likes: parseInt(result.rows[0].likes_count),
            userLiked: result.rows[0].user_liked,
            comments: parseInt(result.rows[0].comments_count),
            user: {
                username: result.rows[0].username,
                avatar_url: result.rows[0].avatar_url,
                native_language: result.rows[0].native_language,
                languages: result.rows[0].languages,
                bio: result.rows[0].bio
            }
        };

        return NextResponse.json(postWithUserInfo);
    } catch (error) {
        console.error('Error fetching post:', error);
        return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
    }
}