import { NextRequest, NextResponse } from 'next/server';
import { Pool } from 'pg';

const pool = new Pool({
  connectionString: process.env.POSTGRES_URL,
});

// Helper function to safely parse JSON or return a default value
const safeJsonParse = (value: any, defaultValue: any = []): any => {
    if (typeof value === 'string') {
        try {
            return JSON.parse(value);
        } catch (error) {
            console.error('Error parsing JSON:', error);
            return defaultValue;
        }
    }
    return value || defaultValue;
};

// Get user by username
export async function GET(request: NextRequest) {
    const url = new URL(request.url);
    const username = url.searchParams.get('username');

    if (!username) {
        return NextResponse.json({ error: 'Username is required' }, { status: 400 });
    }

    try {
        // Fetch user details
        const userResult = await pool.query('SELECT * FROM users_globuddy WHERE username = $1', [username]);
        
        console.log('User query result:', userResult.rows);

        if (userResult.rows.length === 0) {
            return NextResponse.json({ error: 'User not found' }, { status: 404 });
        }

        const user = userResult.rows[0];

        // Fetch user's posts
        const postsResult = await pool.query(
            'SELECT id, content, created_at FROM posts_globuddy WHERE username = $1 ORDER BY created_at DESC LIMIT 5',
            [username] // Ensure this is the correct username
        );

        console.log('Posts query result:', postsResult.rows);

        // Parse languages and levels
        const languages = safeJsonParse(user.languages, []);
        const levels = safeJsonParse(user.levels, []);

        const transformedUser = {
            username: user.username,
            avatarUrl: user.avatar_url || null,
            country: user.country || '',
            joinDate: `Joined ${new Date(user.created_at).toLocaleDateString('en-US', { month: 'long', year: 'numeric' })}`,
            bio: user.bio || '',
            native_language: user.native_language || '',
            languages: languages,
            levels: levels,
            interests: safeJsonParse(user.interests, []),
            posts: postsResult.rows.map(post => ({
                id: post.id,
                content: post.content,
                created_at: post.created_at
            })),
            followers: user.followers || 0,
            following: user.following || 0
        };

        console.log('Final transformed user object:', JSON.stringify(transformedUser, null, 2));

        return NextResponse.json(transformedUser);
    } catch (error) {
        console.error('Error in GET request:', error);
        return NextResponse.json({ error: 'Internal server error', details: (error as Error).message }, { status: 500 });
    }
}