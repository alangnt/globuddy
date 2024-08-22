import pg from 'pg';
import bcrypt from 'bcrypt';
import { NextRequest, NextResponse } from 'next/server';

const { Pool } = pg;

const pool = new Pool({
  connectionString: process.env.POSTGRES_URL,
})

async function hashPassword(password: string): Promise<string> {
    const saltRounds = 12;
    return bcrypt.hash(password, saltRounds);
}

// Handle registration request
export async function POST(request: NextRequest) {
    const { username, email, password, country, native_language, languages, levels } = await request.json();
    
    try {
        // Check if user already exists
        const checkUserQuery = "SELECT * FROM users_globuddy WHERE email = $1";
        const checkUserResult = await pool.query(checkUserQuery, [email]);

        if (checkUserResult.rows.length > 0) {
            return NextResponse.json({ error: 'User already exists' }, { status: 400 });
        }

        // Hash the password
        const hashedPassword = await hashPassword(password);

        // Encode the username
        const encodedUsername = encodeURIComponent(username);

        // Insert new user
        const insertUserQuery = `
            INSERT INTO users_globuddy (
                username, encoded_username, email, password_hash, country, native_language, languages, levels
            ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8) RETURNING *
        `;
        const insertUserResult = await pool.query(insertUserQuery, [
            username,
            encodedUsername,
            email, 
            hashedPassword, 
            country, 
            native_language, 
            languages, 
            levels
        ]);

        const newUser = insertUserResult.rows[0];

        return NextResponse.json({ 
            message: 'User registered successfully', 
            user: { id: newUser.id, email: newUser.email, username: newUser.encoded_username } 
        }, { status: 201 });
    } catch (err) {
        console.error('Registration error:', err);
        return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 });
    }
}