import pg from 'pg';
import { NextRequest, NextResponse } from 'next/server';

const { Pool } = pg;

const pool = new Pool({
  connectionString: process.env.POSTGRES_URL,
})

// Function GET to handle messages between two users
export async function GET(request: NextRequest) {
    const usernameone = request.nextUrl.searchParams.get('usernameone');
    const usernametwo = request.nextUrl.searchParams.get('usernametwo');
    
    if (!usernameone || !usernametwo) {
        return NextResponse.json({ error: 'Username is required' }, { status: 400 });
    }

    const conversationQuery = "SELECT * FROM messages_globuddy WHERE user1 = $1 AND user2 = $2";
    const conversationResult = await pool.query(conversationQuery, [usernameone, usernametwo]);

    return NextResponse.json(conversationResult.rows);
}