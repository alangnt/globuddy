import pg from 'pg';
import { NextRequest, NextResponse } from 'next/server';

const { Pool } = pg;

const pool = new Pool({
  connectionString: process.env.POSTGRES_URL,
})

export async function GET(req: NextRequest) {
  const username = req.nextUrl.searchParams.get('username');
  const countOnly = req.nextUrl.searchParams.get('countOnly');

  if (!username) {
      return NextResponse.json({ error: 'Username is required' }, { status: 400 });
  }

  try {
      const client = await pool.connect();
      
      if (countOnly === 'true') {
          const result = await client.query(
              'SELECT COUNT(*) FROM notifications_globuddy WHERE username = $1 AND read = false',
              [username]
          );
          client.release();
          return NextResponse.json({ count: parseInt(result.rows[0].count) });
      } else {
          const result = await client.query(
              'SELECT * FROM notifications_globuddy WHERE username = $1 ORDER BY created_at DESC',
              [username]
          );
          client.release();
          return NextResponse.json(result.rows);
      }
  } catch (error) {
      console.error('Error fetching notifications:', error);
      return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 });
  }
}
  
export async function PATCH(req: NextRequest) {
    try {
      const id = req.nextUrl.searchParams.get('id');
      const body = await req.json();
      const read = body.read;
  
      if (id === null) {
        return NextResponse.json({ error: 'Missing id parameter' }, { status: 400 });
      }
  
      const client = await pool.connect();
      const result = await client.query(
        'UPDATE notifications_globuddy SET read = $1 WHERE id = $2 RETURNING *',
        [read, id]
      );
      client.release();
  
      if (result.rows.length === 0) {
        return NextResponse.json({ error: 'Notification not found' }, { status: 404 });
      }
  
      return NextResponse.json(result.rows[0]);
    } catch (error) {
      console.error('Error updating notification:', error);
      return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 });
    }
  }
  
export async function DELETE(req: NextRequest) {
    try {
        const id = req.nextUrl.searchParams.get('id');
        const client = await pool.connect();
        await client.query('DELETE FROM notifications_globuddy WHERE id = $1', [id]);
        client.release();
        return NextResponse.json({ success: true });
    } catch (error) {
        console.error('Error deleting notification:', error);
        return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 });
    }
}