import pg from 'pg';
import { NextRequest, NextResponse } from 'next/server';

const { Pool } = pg;

const pool = new Pool({
  connectionString: process.env.POSTGRES_URL,
})

// Handle GET request to retrieve follower and following count
export async function GET(req: NextRequest) {
  const username = req.nextUrl.searchParams.get('username');

  const result = await pool.query('SELECT followers, following FROM users_globuddy WHERE username = $1', [username]);
  const { followers, following } = result.rows[0];
  return NextResponse.json({ followers, following }, { status: 200 });
}