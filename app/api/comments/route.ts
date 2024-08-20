import { NextRequest, NextResponse } from 'next/server';
import { Pool } from 'pg';

const pool = new Pool({
  connectionString: process.env.POSTGRES_URL,
});

export async function POST(request: NextRequest) {
    try {
        const { content, postId, username } = await request.json();

        if (!content || !postId || !username) {
            return NextResponse.json({ error: 'Content, postId, and userId are required' }, { status: 400 });
        }

        const query = `
            INSERT INTO comments_globuddy (content, post_id, username)
            VALUES ($1, $2, $3)
            RETURNING id, content, post_id, username, created_at
        `;
        const values = [content, postId, username];

        const result = await pool.query(query, values);
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
            SELECT id, content, post_id, username, created_at
            FROM comments_globuddy
        `;
        const values: any[] = [];

        if (postId) {
            query += ' WHERE post_id = $1';
            values.push(postId);
        }

        query += ' ORDER BY created_at DESC';

        const result = await pool.query(query, values);
        return NextResponse.json(result.rows);
    } catch (error) {
        console.error('Error fetching comments:', error);
        return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
    }
}

// DELETE /api/comments?id=1
export async function DELETE(request: NextRequest) {
    const { searchParams } = new URL(request.url);
    const id = searchParams.get('id');

    if (!id) {
        return NextResponse.json({ error: 'Comment ID is required' }, { status: 400 });
    }

    try {
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