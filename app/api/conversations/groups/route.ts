import pg from 'pg';
import { NextRequest, NextResponse } from 'next/server';

const { Pool } = pg;

const pool = new Pool({
  connectionString: process.env.POSTGRES_URL,
})

export async function POST(request: NextRequest) {
  const { name, userIds } = await request.json();

  try {
    const client = await pool.connect();
    
    // Create group
    const groupResult = await client.query(
      'INSERT INTO groups_globuddy (name) VALUES ($1) RETURNING id',
      [name]
    );
    const groupId = groupResult.rows[0].id;

    // Add users to group
    for (const username of userIds) {
      await client.query(
        'INSERT INTO group_members_globuddy (group_id, username) VALUES ($1, $2)',
        [groupId, username]
      );
    }

    client.release();

    return NextResponse.json({ groupId }, { status: 201 });
  } catch (error) {
    console.error('Error creating group:', error);
    return NextResponse.json({ error: 'Failed to create group' }, { status: 500 });
  }
}

export async function GET(request: NextRequest) {
  const url = new URL(request.url);
  const username = url.searchParams.get('username');

  if (!username) {
    return NextResponse.json({ error: 'Username is required' }, { status: 400 });
  }

  try {
    const client = await pool.connect();
    
    const result = await client.query(
      `SELECT g.id, g.name 
       FROM groups_globuddy g
       JOIN group_members_globuddy gm ON g.id = gm.group_id
       WHERE gm.username = $1`,
      [username]
    );

    client.release();

    return NextResponse.json(result.rows);
  } catch (error) {
    console.error('Error fetching groups:', error);
    return NextResponse.json({ error: 'Failed to fetch groups' }, { status: 500 });
  }
}