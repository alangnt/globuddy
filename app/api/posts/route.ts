import pg from 'pg';
import { NextRequest, NextResponse } from 'next/server';

const { Pool } = pg;

const pool = new Pool({
  connectionString: process.env.POSTGRES_URL,
})

// Handle GET request for posts
export async function GET(request: NextRequest) {
    const posts = await pool.query('SELECT * FROM posts_globuddy');
    return NextResponse.json(posts.rows);
}

// Handle POST request to create a new post
export async function POST(request: NextRequest) {
  const { content, username } = await request.json();
  const result = await pool.query(
      'INSERT INTO posts_globuddy (content, username) VALUES ($1, $2) RETURNING *',
      [content, username]
  );

  return NextResponse.json(result.rows[0]);
}

// Handle PUT request to update a post
export async function PUT(request: NextRequest) {
  const { id, content } = await request.json();
  const result = await pool.query(
      'UPDATE posts_globuddy SET content = $1 WHERE id = $2 RETURNING *',
      [content, id]
  );

  if (result.rowCount === 0) {
    return NextResponse.json({ error: 'Post not found' }, { status: 404 });
  }

  return NextResponse.json(result.rows[0]);
}

// Handle DELETE request to delete a post
export async function DELETE(request: NextRequest) {
  const url = new URL(request.url);
  const id = url.searchParams.get('id');

  if (!id) {
    return NextResponse.json({ error: 'Post ID is required' }, { status: 400 });
  }

  const result = await pool.query(
      'DELETE FROM posts_globuddy WHERE id = $1 RETURNING *',
      [id]
  );

  if (result.rowCount === 0) {
    return NextResponse.json({ error: 'Post not found' }, { status: 404 });
  }

  return NextResponse.json({ message: 'Post deleted successfully' });
}