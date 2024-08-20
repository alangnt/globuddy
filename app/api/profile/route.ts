import pg from 'pg';
import { NextRequest, NextResponse } from 'next/server';

const { Pool } = pg;

const pool = new Pool({
  connectionString: process.env.POSTGRES_URL,
})

// Function to safely parse JSON or return a default value
const safeJsonParse = (field: string, value: string): any => {
    if (field === 'interests') {
        // Remove outer curly braces and split by commas
        const interestsArray = value.slice(1, -1).split(',');
        // Extract interest values using regex
        return interestsArray.map(interest => {
            const match = interest.match(/"interest":"([^"]+)"/);
            return match ? match[1] : interest.trim().replace(/"/g, '');
        });
    }
    try {
        return JSON.parse(value);
    } catch (error) {
        console.error(`Error parsing ${field}:`, error);
        console.error(`${field} value:`, value);
        if (field === 'learning_languages' || field === 'levels') {
            return [];
        }
        return null;
    }
};

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

        const user = userResult.rows[0];

        // Parse JSON strings for levels and learning_languages
        if (typeof user.levels === 'string') {
            user.levels = safeJsonParse('levels', user.levels);
        }
        if (typeof user.learning_languages === 'string') {
            const parsedLanguages = safeJsonParse('learning_languages', user.learning_languages);
            user.learning_languages = parsedLanguages.map((lang: any, index: number) => ({
                language: lang.language || lang,
                level: user.levels[index] || 'Beginner'
            }));
        }

        if (typeof user.interests === 'string') {
            user.interests = safeJsonParse('interests', user.interests);
        }

        return NextResponse.json(user);
    } catch (error) {
        console.error('Error fetching user profile:', error);
        return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
    }
}

// Handle POST request to update a profile
export async function POST(request: NextRequest) {
    const updates = await request.json();
    const { username, delete_language, interests } = updates;

    console.log('Received updates:', updates); // Log received data

    try {
        // First, fetch the current user data
        const userQuery = "SELECT * FROM users_globuddy WHERE username = $1";
        const userResult = await pool.query(userQuery, [username]);

        if (userResult.rows.length === 0) {
            return NextResponse.json({ error: 'User not found' }, { status: 404 });
        }

        const user = userResult.rows[0];

        // Parse existing learning_languages and levels
        let learning_languages = safeJsonParse('learning_languages', user.learning_languages);
        let levels = safeJsonParse('levels', user.levels);

        if (delete_language) {
            // Remove the specified language and its corresponding level
            learning_languages = learning_languages.filter((lang: any) => 
                (typeof lang === 'object' ? lang.language : lang) !== delete_language
            );
            levels = levels.filter((_: unknown, index: number) => 
                (typeof learning_languages[index] === 'object' ? 
                    learning_languages[index].language : 
                    learning_languages[index]) !== delete_language
            );
        } else {
            // Update learning_languages and levels if provided in updates
            if (updates.learning_languages) {
                learning_languages = updates.learning_languages;
            }
            if (updates.levels) {
                levels = updates.levels;
            }
        }

        // Prepare the update query
        let updateQuery = `
            UPDATE users_globuddy 
            SET learning_languages = $1, levels = $2
        `;
        let queryParams = [JSON.stringify(learning_languages), JSON.stringify(levels)];

        // If interests are provided, update them as well
        if (interests !== undefined) {
            updateQuery += `, interests = $${queryParams.length + 1}`;
            queryParams.push(JSON.stringify(interests));
        }

        updateQuery += ` WHERE username = $${queryParams.length + 1} RETURNING *`;
        queryParams.push(username);

        const result = await pool.query(updateQuery, queryParams);

        const updatedUser = result.rows[0];

        // Parse JSON strings for levels, learning_languages, and interests in the response
        updatedUser.levels = safeJsonParse('levels', updatedUser.levels);
        const parsedLanguages = safeJsonParse('learning_languages', updatedUser.learning_languages);
        updatedUser.learning_languages = parsedLanguages.map((lang: any, index: number) => ({
            language: typeof lang === 'object' ? lang.language : lang,
            level: updatedUser.levels[index] || 'Beginner'
        }));
        updatedUser.interests = safeJsonParse('interests', updatedUser.interests);

        console.log('Update result:', updatedUser); // Log update result
        return NextResponse.json(updatedUser);
    } catch (error) {
        console.error('Error updating profile:', error);
        return NextResponse.json({ error: 'Failed to update profile' }, { status: 500 });
    }
}