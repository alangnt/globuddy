import pg from 'pg';
import { NextRequest, NextResponse } from 'next/server';

const { Pool } = pg;

const pool = new Pool({
  connectionString: process.env.POSTGRES_URL,
})

// Function to create a notification
async function createMessageNotification(recipientUsername: string, senderUsername: string, messageContent: string, messageId: number) {
    const client = await pool.connect();
    try {
      const result = await client.query(
        'INSERT INTO notifications_globuddy (type, username, content, related_id) VALUES ($1, $2, $3, $4) RETURNING *',
        ['message', recipientUsername, `New message from ${senderUsername}: ${messageContent.substring(0, 50)}...`, messageId]
      );
      return result.rows[0];
    } finally {
      client.release();
    }
  }

// Function GET to handle messages for a group
export async function GET(request: NextRequest) {
    const groupId = request.nextUrl.searchParams.get('id');

    if (!groupId) {
        return NextResponse.json({ error: 'Group ID is required' }, { status: 400 });
    }

    const messagesQuery = `
        SELECT m.*, u.avatar_url
        FROM group_messages_globuddy m
        LEFT JOIN users_globuddy u ON u.username = m.sender
        WHERE m.group_name = $1
        ORDER BY m.created_at ASC
    `;

    try {
        const messagesResult = await pool.query(messagesQuery, [groupId]);
        return NextResponse.json(messagesResult.rows);
    } catch (error) {
        console.error('Error fetching group messages:', error);
        return NextResponse.json({ error: 'Failed to fetch group messages' }, { status: 500 });
    }
}

// Updated POST function to create a new group message and notification
export async function POST(request: NextRequest) {
    try {
      const { sender, id, message } = await request.json();
      
      // Basic validation
      if (!sender || !id || !message) {
        return NextResponse.json({ error: 'Sender, id, and message are required' }, { status: 400 });
      }
  
      const client = await pool.connect();
      try {
        await client.query('BEGIN');
  
        const newMessage = await client.query(
          'INSERT INTO group_messages_globuddy (sender, group_name, message, created_at) VALUES ($1, $2, $3, NOW()) RETURNING *', 
          [sender, id, message]
        );
  
        // Fetch group members to create notifications
        const groupMembersResult = await client.query(
          'SELECT members FROM groups_globuddy WHERE id = $1',
          [id]
        );
        
        if (groupMembersResult.rows.length > 0) {
          const members = groupMembersResult.rows[0].members;
          for (const member of members) {
            if (member !== sender) {
              await createMessageNotification(member, sender, message, newMessage.rows[0].id);
            }
          }
        }
  
        await client.query('COMMIT');
  
        return NextResponse.json(newMessage.rows[0]);
      } catch (error) {
        await client.query('ROLLBACK');
        throw error;
      } finally {
        client.release();
      }
    } catch (error) {
      console.error('Error creating new group message:', error);
      return NextResponse.json({ error: 'Failed to create group message' }, { status: 500 });
    }
  }