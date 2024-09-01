import pg from 'pg';
import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth/next';
import { authOptions } from '../auth/[...nextauth]/options';

const { Pool } = pg;

const pool = new Pool({
  connectionString: process.env.POSTGRES_URL,
});

async function createLikeNotification(username: string, postId: number) {
    const client = await pool.connect();
    try {
        const result = await client.query(
            'INSERT INTO notifications_globuddy (type, username, content, related_id) VALUES ($1, $2, $3, $4) RETURNING *',
            ['like', username, `New like on your post`, postId]
        );
        return result.rows[0];
    } finally {
        client.release();
    }
}

// Handle POST request to like or unlike a post
export async function POST(request: NextRequest) {
    try {
        const session = await getServerSession(authOptions);
        if (!session) {
            return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
        }

        const { id } = await request.json();
        
        if (!id || typeof id !== 'number') {
            return NextResponse.json({ error: 'Invalid post ID' }, { status: 400 });
        }

        const userId = session.user.username;

        // Check if the user has already liked the post
        const likeCheck = await pool.query(
            'SELECT * FROM likes_globuddy WHERE username = $1 AND post_id = $2',
            [userId, id]
        );

        let action;
        if (likeCheck.rowCount === 0) {
            // User hasn't liked the post, so add a like
            await pool.query(
                'INSERT INTO likes_globuddy (username, post_id) VALUES ($1, $2)',
                [userId, id]
            );
            await createLikeNotification(userId, id);
            action = 'liked';
        } else {
            // Remove the like
            await pool.query(
                'DELETE FROM likes_globuddy WHERE username = $1 AND post_id = $2',
                [userId, id]
            );
            action = 'unliked';
        }

        // Get the updated like count
        const likeCount = await pool.query(
            'SELECT COUNT(*) as count FROM likes_globuddy WHERE post_id = $1',
            [id]
        );

        return NextResponse.json({
            post_id: id,
            likes: parseInt(likeCount.rows[0].count),
            action: action
        });
    } catch (error) {
        console.error('Error handling like:', error);
        return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
    }
}

// Handle GET request to get all likes for a post
export async function GET(request: NextRequest) {
    try {
        const session = await getServerSession(authOptions);
        if (!session) {
            return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
        }

        const url = new URL(request.url);
        const id = url.searchParams.get('id');

        if (!id) {
            return NextResponse.json({ error: 'Post ID is required' }, { status: 400 });
        }

        const likeCount = await pool.query(
            'SELECT COUNT(*) as count FROM likes_globuddy WHERE post_id = $1',
            [id]
        );

        const userLiked = await pool.query(
            'SELECT EXISTS(SELECT 1 FROM likes_globuddy WHERE post_id = $1 AND username = $2) as liked',
            [id, session.user.username]
        );

        return NextResponse.json({
            post_id: id,
            likes: parseInt(likeCount.rows[0].count),
            userLiked: userLiked.rows[0].liked
        });
    } catch (error) {
        console.error('Error fetching likes:', error);
        return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
    }
}