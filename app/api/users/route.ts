import { NextRequest, NextResponse } from 'next/server';
import { Pool } from 'pg';

const pool = new Pool({
  connectionString: process.env.POSTGRES_URL,
});

// Get user by username
export async function GET(request: NextRequest) {
    const url = new URL(request.url);
    const username = url.searchParams.get('username');

    if (!username) {
        return NextResponse.json({ error: 'Username is required' }, { status: 400 });
    }

    try {
        const result = await pool.query('SELECT * FROM users_globuddy WHERE username = $1', [username]);
        
        if (result.rows.length === 0) {
            return NextResponse.json({ error: 'User not found' }, { status: 404 });
        }

        const user = result.rows[0];
        
        const transformedUser = {
            name: user.name,
            username: user.username,
            avatarUrl: user.avatar_url,
            location: user.location,
            joinDate: `Joined ${new Date(user.created_at).toLocaleDateString('en-US', { month: 'long', year: 'numeric' })}`,
            bio: user.bio,
            nativeLanguage: user.native_language,
            learningLanguages: JSON.parse(user.learning_languages || '[]'),
            interests: JSON.parse(user.interests || '[]'),
            recentActivity: JSON.parse(user.recent_activity || '[]')
        };

        return NextResponse.json(transformedUser);
    } catch (error) {
        console.error('Error fetching user:', error);
        return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
    }
}