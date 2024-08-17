import pg from 'pg';
import { NextRequest, NextResponse } from 'next/server';
import bcrypt from 'bcrypt';

const { Pool } = pg;

const pool = new Pool({
  connectionString: process.env.POSTGRES_URL,
})

// Handle login request
export async function POST(request: NextRequest) {
    const { email, password } = await request.json();
    
    if (!email || !password) {
        return NextResponse.json({ error: 'Email and password are required' }, { status: 400 });
    }

    try {
        const userQuery = "SELECT * FROM users_globuddy WHERE email = $1";
        const userResult = await pool.query(userQuery, [email]);

        if (userResult.rows.length === 0) {
            return NextResponse.json({ error: 'Invalid credentials' }, { status: 401 });
        }

        const user = userResult.rows[0];
        const isPasswordValid = await bcrypt.compare(password, user.password_hash);

        if (!isPasswordValid) {
            return NextResponse.json({ error: 'Invalid credentials' }, { status: 401 });
        }

        return NextResponse.json({ 
            username: user.username,
            email: user.email,
        }, { status: 200 });
    } catch (err) {
        console.error(err);
        return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 });
    }
}