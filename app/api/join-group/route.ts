import pg from 'pg';
import { NextRequest, NextResponse } from 'next/server';

const { Pool } = pg;

const pool = new Pool({
  connectionString: process.env.POSTGRES_URL,
})

export async function POST(request: NextRequest) {
    let group_id, username;
    
    try {
        // Since the error is occurring when parsing JSON, let's skip that for now
        const url = new URL(request.url);
        group_id = url.searchParams.get('group_id');
        username = url.searchParams.get('username');

        if (!group_id || !username) {
            return NextResponse.json({ error: 'Missing group_id or username' }, { status: 400 });
        }

        const client = await pool.connect();
        const result = await client.query(
            'UPDATE groups_globuddy SET members = CASE WHEN members IS NULL OR members = \'\' THEN $1::text ELSE members || \',\' || $1::text END WHERE id = $2 RETURNING *',
            [JSON.stringify({ username }), group_id]
        );

        client.release();
        
        if (result.rowCount === 0) {
            return NextResponse.json({ error: 'Group not found' }, { status: 404 });
        }
        
        return NextResponse.json(result.rows[0], { status: 201 });
    } catch (error) {
        console.error('Error joining group:', error);
        return NextResponse.json({ 
            error: 'Failed to join group', 
            details: (error as Error).message,
            stack: (error as Error).stack
        }, { status: 500 });
    }
}

// If leaving a group
export async function DELETE(request: NextRequest) {
    let group_id, username;
    
    try {
        const url = new URL(request.url);
        group_id = url.searchParams.get('group_id');
        username = url.searchParams.get('username');

        if (!group_id || !username) {
            return NextResponse.json({ error: 'Missing group_id or username' }, { status: 400 });
        }

        const client = await pool.connect();
        const result = await client.query(
            'UPDATE groups_globuddy SET members = array_to_string(array_remove(string_to_array(members, \',\'), $1), \',\') WHERE id = $2 RETURNING *',
            [JSON.stringify({ username }), group_id]
        );

        client.release();
        
        if (result.rowCount === 0) {
            return NextResponse.json({ error: 'Group not found' }, { status: 404 });
        }
        
        return NextResponse.json(result.rows[0], { status: 200 });
    } catch (error) {
        console.error('Error leaving group:', error);
        return NextResponse.json({ 
            error: 'Failed to leave group', 
            details: (error as Error).message,
            stack: (error as Error).stack
        }, { status: 500 });
    }
}

// Check if user is in group
export async function GET(request: NextRequest) {
    const url = new URL(request.url);
    const group_id = url.searchParams.get('group_id');
    const username = url.searchParams.get('username');

    if (!group_id || !username) {
        return NextResponse.json({ error: 'Missing group_id or username' }, { status: 400 });
    }

    try {
        const client = await pool.connect();
        const result = await client.query(
            'SELECT * FROM groups_globuddy WHERE id = $1 AND members LIKE $2',
            [group_id, `'%${username}%'`]
        );
        client.release();
        return NextResponse.json({ isInGroup: result.rows.length > 0 }, { status: 200 });
    } catch (error) {
        console.error('Error checking if user is in group:', error);
        return NextResponse.json({ error: 'Failed to check if user is in group' }, { status: 500 });
    }
}