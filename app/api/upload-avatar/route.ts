import { NextRequest, NextResponse } from 'next/server';
import { Pool } from 'pg';
import { put } from '@vercel/blob';
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

        const filename = `${username}-${Date.now()}${path.extname(file.name)}`;
        
        // Upload to Vercel Blob Storage
        const blob = await put(filename, file, {
            access: 'public',
        });

        console.log(`File uploaded to: ${blob.url}`);

        // Update database
        await pool.query('UPDATE users_globuddy SET avatar_url = $1 WHERE username = $2', [blob.url, username]);

        console.log(`Database updated for user: ${username}`);

        return NextResponse.json({ url: blob.url });
    } catch (error) {
        console.error('Error uploading avatar:', error);
        if (error instanceof Error) {
            return NextResponse.json({ 
                error: `Failed to upload avatar: ${error.message}`,
                stack: error.stack 
            }, { status: 500 });
        }
        return NextResponse.json({ error: 'Failed to upload avatar: Unknown error' }, { status: 500 });
    }
}