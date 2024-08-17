import pg from 'pg';
import { NextRequest, NextResponse } from 'next/server';

const { Pool } = pg;

const pool = new Pool({
  connectionString: process.env.POSTGRES_URL,
})

// Handle GET request for profile
export async function GET(request: NextRequest) {
    try {
        const username = request.nextUrl.searchParams.get('username');

        if (!username) {
            return NextResponse.json({ error: 'Username is required' }, { status: 400 });
        }

        const userQuery = "SELECT * FROM users_globuddy WHERE username = $1";
        const userResult = await pool.query(userQuery, [username]);

        if (userResult.rows.length === 0) {
            return NextResponse.json({ error: 'User not found' }, { status: 404 });
        }

        return NextResponse.json(userResult.rows[0]);
    } catch (error) {
        console.error('Error fetching user profile:', error);
        return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
    }
}

// Handle POST request to update a profile
export async function POST(request: NextRequest) {
    const updates = await request.json();
    const { username } = updates;

    console.log('Received updates:', updates); // Log received data

    // Create an array to store the fields to update and their values
    const fieldsToUpdate = [];
    const values = [];
    let paramCounter = 1;

    // List of allowed fields to update
    const allowedFields = ['firstname', 'lastname', 'email', 'location', 'bio', 'native_language', 'learning_languages', 'interests', 'languages', 'levels'];

    // Function to truncate string values
    const truncate = (value: any, maxLength = 50): any => {
        if (typeof value === 'string') {
            return value.slice(0, maxLength);
        }
        if (Array.isArray(value)) {
            return value.map(item => truncate(item, maxLength));
        }
        if (typeof value === 'object' && value !== null) {
            return Object.fromEntries(
                Object.entries(value).map(([k, v]) => [k, truncate(v, maxLength)])
            );
        }
        return value;
    };

    // Build the query dynamically based on the provided fields
    for (const field of allowedFields) {
        if (updates[field] !== undefined) {
            fieldsToUpdate.push(`${field} = $${paramCounter}`);
            values.push(truncate(updates[field]));
            paramCounter++;
        }
    }

    // If no fields to update, return early
    if (fieldsToUpdate.length === 0) {
        return NextResponse.json({ message: "No fields to update" });
    }

    // Add username as the last parameter for the WHERE clause
    values.push(username);

    const updateQuery = `
        UPDATE users_globuddy 
        SET ${fieldsToUpdate.join(', ')} 
        WHERE username = $${paramCounter} 
        RETURNING *
    `;

    try {
        const result = await pool.query(updateQuery, values);
        console.log('Update result:', result.rows[0]); // Log update result
        return NextResponse.json(result.rows[0]);
    } catch (error) {
        console.error('Error updating profile:', error);
        return NextResponse.json({ error: 'Failed to update profile' }, { status: 500 });
    }
}