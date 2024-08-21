import pg from 'pg';
import { NextRequest, NextResponse } from 'next/server';

const { Pool } = pg;

const pool = new Pool({
  connectionString: process.env.POSTGRES_URL,
})

// Handle GET request for posts
export async function GET(request: NextRequest) {
  const url = new URL(request.url);
  const userLanguages = url.searchParams.get('userLanguages');

  let postsQuery = `
    SELECT p.*, u.avatar_url, u.native_language, u.languages
    FROM posts_globuddy p
    JOIN users_globuddy u ON p.username = u.username
    WHERE u.username IS NOT NULL
  `;

  let languages: string[] = [];
  if (userLanguages) {
    languages = userLanguages.split(',');
    postsQuery += `
      AND (u.native_language = ANY($1::text[])
      OR u.languages && $1::text[])
    `;
  }

  const result = userLanguages
    ? await pool.query(postsQuery, [languages])
    : await pool.query(postsQuery);
  
  const postsWithUserInfo = result.rows.map(row => ({
    id: row.id,
    content: row.content,
    username: row.username,
    created_at: row.created_at,
    user: {
      username: row.username,
      avatar_url: row.avatar_url,
      native_language: row.native_language,
      languages: row.languages
    }
  }));

  return NextResponse.json(postsWithUserInfo);
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
  const username = url.searchParams.get('username');

  if (!id || !username) {
    return NextResponse.json({ error: 'Post ID and username are required' }, { status: 400 });
  }

  // Start a transaction
  const client = await pool.connect();
  try {
    await client.query('BEGIN');

    // Delete comments associated with the post
    await client.query(
      'DELETE FROM comments_globuddy WHERE post_id = $1',
      [id]
    );

    // Delete the post
    const result = await client.query(
      `DELETE FROM posts_globuddy
       WHERE id = $1 AND username = $2
       RETURNING *`,
      [id, username]
    );

    await client.query('COMMIT');

    if (result.rowCount === 0) {
      return NextResponse.json({ error: 'Post not found or user not authorized' }, { status: 404 });
    }

    return NextResponse.json({ message: 'Post and associated comments deleted successfully' });
  } catch (error) {
    await client.query('ROLLBACK');
    console.error('Error deleting post:', error);
    return NextResponse.json({ error: 'An error occurred while deleting the post' }, { status: 500 });
  } finally {
    client.release();
  }
}