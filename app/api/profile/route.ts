import pg from 'pg';
import { NextRequest, NextResponse } from 'next/server';

const { Pool } = pg;

const pool = new Pool({
  connectionString: process.env.POSTGRES_URL,
})

// Function to safely parse JSON or return a default value
const safeJsonParse = (field: string, value: any): any => {
    if (field === 'interests') {
        try {
            return typeof value === 'string' ? JSON.parse(value) : value;
        } catch (error) {
            console.error(`Error parsing interests:`, error);
            return [];
        }
    }
    if (field === 'languages' || field === 'levels') {
        if (Array.isArray(value)) {
            return value;
        }
        try {
            return typeof value === 'string' ? value.split(',').map(item => item.trim()) : [];
        } catch (error) {
            console.error(`Error parsing ${field}:`, error);
            console.error(`${field} value:`, value);
            return [];
        }
    }
    try {
        return typeof value === 'string' ? JSON.parse(value) : value;
    } catch (error) {
        console.error(`Error parsing ${field}:`, error);
        console.error(`${field} value:`, value);
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

        console.log('Raw user data:', user);

        // Parse languages and levels
        user.learningLanguages = user.languages && user.levels ? 
            user.languages.map((lang: string, index: number) => ({
                name: lang.trim(),
                level: user.levels[index].trim()
            })) : [];

        // Parse interests as JSON
        user.interests = safeJsonParse('interests', user.interests) || [];

        // Replace null values with empty strings for certain fields
        const fieldsToCheck = ['native_language', 'firstname', 'lastname', 'email', 'country', 'bio'];
        fieldsToCheck.forEach(field => {
            user[field] = user[field] || '';
        });

        // Handle avatar_url
        user.avatar_url = user.avatar_url || null;

        // Format join date
        user.joinDate = `Joined ${new Date(user.created_at).toLocaleDateString('en-US', { month: 'long', year: 'numeric' })}`;

        // Create the final user object with the correct structure
        const transformedUser = {
            username: user.username,
            avatar_url: user.avatar_url,
            country: user.country,
            bio: user.bio,
            native_language: user.native_language,
            languages: user.languages,
            levels: user.levels,
            interests: user.interests,
            email: user.email,
            firstname: user.firstname,
            lastname: user.lastname,
            followers: user.followers,
            following: user.following
        };

        console.log('Transformed user data:', transformedUser);

        return NextResponse.json(transformedUser);
    } catch (error) {
        console.error('Error fetching user profile:', error);
        return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
    }
}

export async function POST(request: NextRequest) {
    const updates = await request.json();
    const { username, delete_language, interests, languages, levels, avatar_url, ...otherUpdates } = updates;

    console.log('Received updates:', updates);

    try {
        const userQuery = "SELECT * FROM users_globuddy WHERE username = $1";
        const userResult = await pool.query(userQuery, [username]);

        if (userResult.rows.length === 0) {
            return NextResponse.json({ error: 'User not found' }, { status: 404 });
        }

        const currentUser = userResult.rows[0];

        // Parse languages and levels, handling different possible formats
        let updatedLanguages = Array.isArray(currentUser.languages) ? currentUser.languages :
                               typeof currentUser.languages === 'string' ? currentUser.languages.replace(/[{}]/g, '').split(',').map((lang: string) => lang.trim()) :
                               [];
        let updatedLevels = Array.isArray(currentUser.levels) ? currentUser.levels :
                            typeof currentUser.levels === 'string' ? currentUser.levels.replace(/[{}]/g, '').split(',').map((level: string) => level.trim()) :
                            [];

        if (delete_language) {
            const index = updatedLanguages.findIndex((lang: string) => lang.toLowerCase() === delete_language.toLowerCase());
            if (index > -1) {
                updatedLanguages.splice(index, 1);
                updatedLevels.splice(index, 1);
            }
        } else if (languages && levels) {
            updatedLanguages = Array.isArray(languages) ? languages : [languages].filter(Boolean);
            updatedLevels = Array.isArray(levels) ? levels : [levels].filter(Boolean);
        }

        let updateQuery = `
            UPDATE users_globuddy 
            SET languages = $1, levels = $2
        `;
        let queryParams = [`{${updatedLanguages.join(',')}}`, `{${updatedLevels.join(',')}}`];

        if (interests !== undefined) {
            updateQuery += `, interests = $${queryParams.length + 1}`;
            queryParams.push(JSON.stringify(interests));
        }

        if (avatar_url !== undefined) {
            updateQuery += `, avatar_url = $${queryParams.length + 1}`;
            queryParams.push(avatar_url);
        }

        Object.entries(otherUpdates).forEach(([key, value]) => {
            updateQuery += `, ${key} = $${queryParams.length + 1}`;
            queryParams.push(value as string);
        });

        updateQuery += ` WHERE username = $${queryParams.length + 1} RETURNING *`;
        queryParams.push(username);

        const result = await pool.query(updateQuery, queryParams);

        const updatedUser = result.rows[0];

        // Parse the languages and levels back into arrays
        updatedUser.languages = safeJsonParse('languages', updatedUser.languages);
        updatedUser.levels = safeJsonParse('levels', updatedUser.levels);

        // Only parse interests if it's not already an object
        if (typeof updatedUser.interests !== 'object') {
            updatedUser.interests = safeJsonParse('interests', updatedUser.interests);
        }

        const fieldsToCheck = ['native_language', 'firstname', 'lastname', 'email', 'country', 'bio'];
        fieldsToCheck.forEach(field => {
            updatedUser[field] = updatedUser[field] || '';
        });

        // Ensure avatar_url is included in the returned user object
        updatedUser.avatar_url = updatedUser.avatar_url || null;

        console.log('Update result:', updatedUser);
        return NextResponse.json(updatedUser);
    } catch (error) {
        console.error('Error updating profile:', error);
        return NextResponse.json({ error: 'Failed to update profile' }, { status: 500 });
    }
}