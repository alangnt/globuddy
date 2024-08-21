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

// Function GET to handle messages between two users
export async function GET(request: NextRequest) {
    const username = request.nextUrl.searchParams.get('username');
    const otherUser = request.nextUrl.searchParams.get('otherUser');

    if (!username) {
        return NextResponse.json({ error: 'Username is required' }, { status: 400 });
    }

    let messagesQuery;
    let queryParams;

    if (otherUser) {
        // Fetch messages for a specific conversation
        messagesQuery = `
            SELECT m.*, u.avatar_url
            FROM messages_globuddy m
            LEFT JOIN users_globuddy u ON u.username = 
                CASE 
                    WHEN m.user1 = $1 THEN m.user2
                    ELSE m.user1
                END
            WHERE (m.user1 = $1 AND m.user2 = $2) OR (m.user1 = $2 AND m.user2 = $1)
            ORDER BY m.created_at ASC
        `;
        queryParams = [username, otherUser];
    } else {
        // Fetch all conversations for the user
        messagesQuery = `
            SELECT 
                CASE 
                    WHEN m.user1 = $1 THEN m.user2
                    ELSE m.user1
                END AS other_user,
                m.message,
                m.created_at,
                u.avatar_url
            FROM messages_globuddy m
            LEFT JOIN users_globuddy u ON u.username = 
                CASE 
                    WHEN m.user1 = $1 THEN m.user2
                    ELSE m.user1
                END
            WHERE (m.user1 = $1 OR m.user2 = $1)
            AND m.id IN (
                SELECT MAX(id)
                FROM messages_globuddy
                WHERE (user1 = $1 OR user2 = $1)
                GROUP BY 
                    CASE 
                        WHEN user1 = $1 THEN user2
                        ELSE user1
                    END
            )
            ORDER BY m.created_at DESC
        `;
        queryParams = [username];
    }

    try {
        const messagesResult = await pool.query(messagesQuery, queryParams);

        if (otherUser) {
            return NextResponse.json(messagesResult.rows);
        } else {
            const conversations = messagesResult.rows.map(row => ({
                otherUser: row.other_user,
                lastMessage: row.message,
                timestamp: row.created_at,
                avatarUrl: row.avatar_url
            }));
            return NextResponse.json(conversations);
        }
    } catch (error) {
        console.error('Error fetching messages:', error);
        return NextResponse.json({ error: 'Failed to fetch messages' }, { status: 500 });
    }
}

/// Updated POST function to create a new message and notification
export async function POST(request: NextRequest) {
    try {
      const { user1, user2, message } = await request.json();
      
      // Basic validation
      if (!user1 || !user2) {
        return NextResponse.json({ error: 'Both users are required' }, { status: 400 });
      }
  
      const client = await pool.connect();
      try {
        await client.query('BEGIN');
  
        const newMessage = await client.query(
          'INSERT INTO messages_globuddy (user1, user2, message, created_at) VALUES ($1, $2, $3, NOW()) RETURNING *', 
          [user1, user2, message || '']
        );
  
        // Create a notification for the recipient
        await createMessageNotification(user2, user1, message, newMessage.rows[0].id);
  
        await client.query('COMMIT');
  
        return NextResponse.json(newMessage.rows[0]);
      } catch (error) {
        await client.query('ROLLBACK');
        throw error;
      } finally {
        client.release();
      }
    } catch (error) {
      console.error('Error creating new message:', error);
      return NextResponse.json({ error: 'Failed to create message' }, { status: 500 });
    }
  }