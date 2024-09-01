import pg from 'pg';
import { NextRequest, NextResponse } from 'next/server';

const { Pool } = pg;

const pool = new Pool({
  connectionString: process.env.POSTGRES_URL,
})

export async function POST(request: NextRequest) {
    const { name, members, group_author, description } = await request.json();

    if (!name || !members || members.length === 0) {
        return NextResponse.json({ error: 'Name and at least one member are required' }, { status: 400 });
    }

    try {
        const client = await pool.connect();
        const result = await client.query(
            'INSERT INTO groups_globuddy (name, members, group_author, created_at, description) VALUES ($1, $2, $3, $4, $5) RETURNING *',
            [name, members, group_author, new Date().toISOString(), description]
        );
        client.release();
        return NextResponse.json(result.rows[0], { status: 201 });
    } catch (error) {
        console.error('Error creating group:', error);
        return NextResponse.json({ error: 'Failed to create group' }, { status: 500 });
    }
}

export async function GET(request: NextRequest) {
    const username = request.nextUrl.searchParams.get('username');
    const all = request.nextUrl.searchParams.get('all');

    if (all === 'true') {
        try {
            const client = await pool.connect();
            const result = await client.query(
                'SELECT id, name, members, group_author, created_at, description, image_url FROM groups_globuddy ORDER BY created_at DESC'
            );
            client.release();
            return NextResponse.json(result.rows, { status: 200 });
        } catch (error) {
            console.error('Error fetching all groups:', error);
            return NextResponse.json({ error: 'Failed to fetch all groups' }, { status: 500 });
        }
    } else {
        if (!username) {
            return NextResponse.json({ error: 'Username is required when not fetching all groups' }, { status: 400 });
        }

        try {
            const client = await pool.connect();
            const result = await client.query(
                'SELECT id, name, members, group_author, created_at, description, image_url FROM groups_globuddy WHERE members LIKE $1 ORDER BY created_at DESC',
                [`%${username}%`]
            );
            client.release();

            const groups = result.rows.map(row => ({
                id: row.id,
                name: row.name,
                members: row.members,
                group_author: row.group_author,
                created_at: row.created_at,
                description: row.description,
                image_url: row.image_url
            }));

            return NextResponse.json(groups, { status: 200 });
        } catch (error) {
            console.error('Error fetching groups:', error);
            return NextResponse.json({ error: 'Failed to fetch groups' }, { status: 500 });
        }
    }
}

export async function PUT(request: NextRequest) {
    const { group_id, username, name, description, image_url } = await request.json();

    if (!group_id || !username) {
        return NextResponse.json({ error: 'Group ID and username are required' }, { status: 400 });
    }

    try {
        const client = await pool.connect();
        const result = await client.query(
            'UPDATE groups_globuddy SET name = $1, description = $2, image_url = $3 WHERE id = $4 RETURNING *',
            [name, description, image_url, group_id]
        );
        client.release();
        return NextResponse.json(result.rows[0], { status: 200 });
    } catch (error) {
        console.error('Error updating group:', error);
        return NextResponse.json({ error: 'Failed to update group' }, { status: 500 });
    }
}

export async function DELETE(request: NextRequest) {
    const { group_id, username } = await request.json();

    if (!group_id || !username) {
        return NextResponse.json({ error: 'Group ID and username are required' }, { status: 400 });
    }

    try {
        const client = await pool.connect();
        const result = await client.query(
            'DELETE FROM groups_globuddy WHERE id = $1 AND group_author = $2 RETURNING *',
            [group_id, username]
        );
        client.release();
        return NextResponse.json(result.rows[0], { status: 200 });
    } catch (error) {
        console.error('Error deleting group:', error);
        return NextResponse.json({ error: 'Failed to delete group' }, { status: 500 });
    }
}
