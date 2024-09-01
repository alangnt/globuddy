import { NextRequest, NextResponse } from 'next/server';
import { Pool } from 'pg';

const pool = new Pool({
  connectionString: process.env.POSTGRES_URL,
});

async function createCommentNotification(postOwnerUsername: string, commentAuthorUsername: string, postId: number) {
    const client = await pool.connect();
    try {
        const result = await client.query(
            'INSERT INTO notifications_globuddy (type, username, content, related_id) VALUES ($1, $2, $3, $4) RETURNING *',
            ['comment', postOwnerUsername, `New comment from ${commentAuthorUsername} on your post`, postId]
        );
        return result.rows[0];
    } finally {
        client.release();
    }
}

export async function POST(request: NextRequest) {
    try {
        const { content, postId, username } = await request.json();

        if (!content || !postId || !username) {
            return NextResponse.json({ error: 'Content, postId, and username are required' }, { status: 400 });
        }

        // First, get the post owner's username
        const postOwnerQuery = 'SELECT username FROM posts_globuddy WHERE id = $1';
        const postOwnerResult = await pool.query(postOwnerQuery, [postId]);
        
        if (postOwnerResult.rows.length === 0) {
            return NextResponse.json({ error: 'Post not found' }, { status: 404 });
        }
        
        const postOwnerUsername = postOwnerResult.rows[0].username;

        // Insert the comment
        const query = `
            INSERT INTO comments_globuddy (content, post_id, username)
            VALUES ($1, $2, $3)
            RETURNING id, content, post_id, username, created_at
        `;
        const values = [content, postId, username];
        const result = await pool.query(query, values);

        // Create notification only if the comment author is not the post owner
        if (username !== postOwnerUsername) {
            await createCommentNotification(postOwnerUsername, username, postId);
        }

        return NextResponse.json(result.rows[0]);
    } catch (error) {
        console.error('Error creating comment:', error);
        return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
    }
}

export async function GET(request: NextRequest) {
    try {
        const { searchParams } = new URL(request.url);
        const postId = searchParams.get('postId');

        let query = `
            SELECT c.id, c.content, c.post_id, c.username, c.created_at, u.avatar_url
            FROM comments_globuddy c
            LEFT JOIN users_globuddy u ON c.username = u.username
        `;
        const values: any[] = [];

        if (postId) {
            query += ' WHERE c.post_id = $1';
            values.push(postId);
        }

        query += ' ORDER BY c.created_at DESC';

        const result = await pool.query(query, values);
        return NextResponse.json(result.rows.map(row => ({
            id: row.id,
            content: row.content,
            postId: row.post_id,
            username: row.username,
            created_at: row.created_at,
            user: {
                username: row.username,
                avatar_url: row.avatar_url
            }
        })));
    } catch (error) {
        console.error('Error fetching comments:', error);
        return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
    }
}

export async function DELETE(request: NextRequest) {
    try {
        const { searchParams } = new URL(request.url);
        const id = searchParams.get('id');

        if (!id) {
            return NextResponse.json({ error: 'Comment ID is required' }, { status: 400 });
        }

        const query = 'DELETE FROM comments_globuddy WHERE id = $1 RETURNING *';
        const result = await pool.query(query, [id]);

        if (result.rowCount === 0) {
            return NextResponse.json({ error: 'Comment not found' }, { status: 404 });
        }

        return NextResponse.json({ message: 'Comment deleted successfully', deletedComment: result.rows[0] });
    } catch (error) {
        console.error('Error deleting comment:', error);
        return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
    }
}