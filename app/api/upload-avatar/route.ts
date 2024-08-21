import { NextRequest, NextResponse } from 'next/server';
import { Pool } from 'pg';
import { writeFile } from 'fs/promises';
import path from 'path';

const pool = new Pool({
  connectionString: process.env.POSTGRES_URL,
});

export async function POST(request: NextRequest) {
    try {
        const formData = await request.formData();
        const file = formData.get('file') as File | null;
        const username = formData.get('username') as string | null;

        if (!file || !username) {
            return NextResponse.json({ error: 'File and username are required' }, { status: 400 });
        }

        const bytes = await file.arrayBuffer();
        const buffer = Buffer.from(bytes);

        // Save file to disk
        const filename = `${username}-${Date.now()}${path.extname(file.name)}`;
        const filepath = path.join(process.cwd(), 'public', 'avatars', filename);
        await writeFile(filepath, buffer);

        // Update database
        const avatarUrl = `/avatars/${filename}`;
        await pool.query('UPDATE users_globuddy SET avatar_url = $1 WHERE username = $2', [avatarUrl, username]);

        return NextResponse.json({ url: avatarUrl });
    } catch (error) {
        console.error('Error uploading avatar:', error);
        return NextResponse.json({ error: 'Failed to upload avatar' }, { status: 500 });
    }
}