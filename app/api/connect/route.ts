import pg from 'pg';
import { NextRequest, NextResponse } from 'next/server';

const { Pool } = pg;

const pool = new Pool({
  connectionString: process.env.POSTGRES_URL,
})

// Handle connect functionality
export async function POST(req: NextRequest) {
  const follower_username = req.nextUrl.searchParams.get('user.username');
  const followed_username = req.nextUrl.searchParams.get('username');

  if (!follower_username || !followed_username) {
    return NextResponse.json({ error: 'Both usernames are required' }, { status: 400 });
  }

  const client = await pool.connect();
  try {
    await client.query('BEGIN');

    // Check if the connection already exists
    const existingConnection = await client.query(
      'SELECT * FROM connections_globuddy WHERE follower_username = $1 AND followed_username = $2',
      [follower_username, followed_username]
    );

    if (existingConnection.rows.length > 0) {
      await client.query('ROLLBACK');
      return NextResponse.json({ message: 'Already following this user' }, { status: 400 });
    }

    // Create the new connection
    await client.query(
      'INSERT INTO connections_globuddy (follower_username, followed_username) VALUES ($1, $2)',
      [follower_username, followed_username]
    );

    // Update follower count for followed user
    await client.query(
      'UPDATE users_globuddy SET followers = followers + 1 WHERE username = $1',
      [followed_username]
    );

    // Update following count for follower user
    await client.query(
      'UPDATE users_globuddy SET following = following + 1 WHERE username = $1',
      [follower_username]
    );

    await client.query('COMMIT');
    
    return NextResponse.json({ message: 'Connection successful' }, { status: 200 });
  } catch (error) {
    await client.query('ROLLBACK');
    console.error('Error in connect functionality:', error);
    return NextResponse.json({ error: 'Failed to connect' }, { status: 500 });
  } finally {
    client.release();
  }
}

// Handle disconnect functionality
export async function DELETE(req: NextRequest) {
  const follower_username = req.nextUrl.searchParams.get('user.username');
  const followed_username = req.nextUrl.searchParams.get('username');

  if (!follower_username || !followed_username) {
    return NextResponse.json({ error: 'Both usernames are required' }, { status: 400 });
  }

  const client = await pool.connect();
  try {
    await client.query('BEGIN');

    // Remove the connection
    const result = await client.query(
      'DELETE FROM connections_globuddy WHERE follower_username = $1 AND followed_username = $2',
      [follower_username, followed_username]
    );

    if (result.rowCount === 0) {
      await client.query('ROLLBACK');
      return NextResponse.json({ message: 'Connection not found' }, { status: 404 });
    }

    // Update follower count for followed user
    await client.query(
      'UPDATE users_globuddy SET followers = GREATEST(followers - 1, 0) WHERE username = $1',
      [followed_username]
    );

    // Update following count for follower user
    await client.query(
      'UPDATE users_globuddy SET following = GREATEST(following - 1, 0) WHERE username = $1',
      [follower_username]
    );

    await client.query('COMMIT');
    
    return NextResponse.json({ message: 'Disconnection successful' }, { status: 200 });
  } catch (error) {
    await client.query('ROLLBACK');
    console.error('Error in disconnect functionality:', error);
    return NextResponse.json({ error: 'Failed to disconnect' }, { status: 500 });
  } finally {
    client.release();
  }
}

// Handle GET request to check if a user is following another user
export async function GET(req: NextRequest) {
  const follower_username = req.nextUrl.searchParams.get('user.username');
  const followed_username = req.nextUrl.searchParams.get('username');

  if (!follower_username || !followed_username) {
    return NextResponse.json({ error: 'Both usernames are required' }, { status: 400 });
  }

  try {
    const result = await pool.query(
      'SELECT * FROM connections_globuddy WHERE follower_username = $1 AND followed_username = $2',
      [follower_username, followed_username]
    );

    return NextResponse.json({ isFollowing: result.rows.length > 0 }, { status: 200 });
  } catch (error) {
    console.error('Error checking follow status:', error);
    return NextResponse.json({ error: 'Failed to check follow status' }, { status: 500 });
  }
}