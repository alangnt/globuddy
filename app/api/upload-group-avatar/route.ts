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
        const group_id = formData.get('group_id') as string | null;

        if (!file || !group_id) {
            return NextResponse.json({ error: 'File and group_id are required' }, { status: 400 });
        }

        const filename = `${group_id}-${Date.now()}${path.extname(file.name)}`;
        
        // Upload to Vercel Blob Storage
        const blob = await put(filename, file, {
            access: 'public',
        });

        console.log(`File uploaded to: ${blob.url}`);

        // Update database
        await pool.query('UPDATE groups_globuddy SET image_url = $1 WHERE id = $2', [blob.url, group_id]);

        console.log(`Database updated for group: ${group_id}`);

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
