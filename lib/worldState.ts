import { query, queryOne } from './db';
import { HydrationState, User, World, WorldState, Message } from './models';

// Initial world state for Stage 0
// Monday 08:00, Rebecca just moved in, 10 days off-grid beginning
export function getInitialWorldState(): HydrationState {
  return {
    time: {
      current_datetime: "2025-07-01T08:00:00Z",
      days_into_offgrid: 0
    },
    locations: {
      george: "house:kitchen",
      rebecca: "house:kitchen"
    },
    relationship: {
      overall_tone: "warm, intimate, newly cohabiting, with underlying vulnerability and excitement",
      recent_key_moments: [
        "Rebecca just moved in with George",
        "Both agreed to 10 days off-grid to settle together"
      ]
    },
    threads: [
      "Rebecca settling into the house and routines",
      "Both enjoying their first morning together in their shared home",
      "Beginning of 10 days off-grid together"
    ],
    facts: {
      shared: [
        "This is their house in Cookridge, Leeds",
        "They both have taken 10 days off work",
        "They agreed to be mostly off-grid to focus on each other",
        "Rebecca has just moved in"
      ],
      rebecca_about_george: [
        "George tends to overthink philosophy and consciousness",
        "George plays guitar and composes music",
        "George was single for 15 years before Rebecca",
        "George has a daughter named Lucy"
      ]
    }
  };
}

// Create or get user
export async function getOrCreateUser(userId?: string): Promise<User> {
  if (userId) {
    const existing = await queryOne<User>(
      'SELECT * FROM users WHERE id = $1',
      [userId]
    );
    if (existing) return existing;
  }

  const rows = await query<User>(
    'INSERT INTO users (id) VALUES (gen_random_uuid()) RETURNING *'
  );
  return rows[0];
}

// Create or get world for user
export async function getOrCreateWorld(userId: string, worldId?: string): Promise<World> {
  if (worldId) {
    const existing = await queryOne<World>(
      'SELECT * FROM worlds WHERE id = $1 AND user_id = $2',
      [worldId, userId]
    );
    if (existing) return existing;
  }

  // Check if user already has a world
  const existingWorld = await queryOne<World>(
    'SELECT * FROM worlds WHERE user_id = $1 ORDER BY created_at DESC LIMIT 1',
    [userId]
  );
  if (existingWorld) return existingWorld;

  // Create new world
  const rows = await query<World>(
    'INSERT INTO worlds (id, user_id, name) VALUES (gen_random_uuid(), $1, $2) RETURNING *',
    [userId, 'VirLife World']
  );
  return rows[0];
}

// Get or create world state
export async function getOrCreateWorldState(worldId: string): Promise<HydrationState> {
  const existing = await queryOne<WorldState>(
    'SELECT * FROM world_states WHERE world_id = $1',
    [worldId]
  );
  
  if (existing) {
    return existing.state;
  }

  // Create initial state
  const initialState = getInitialWorldState();
  await query(
    'INSERT INTO world_states (id, world_id, state, updated_at) VALUES (gen_random_uuid(), $1, $2, NOW())',
    [worldId, JSON.stringify(initialState)]
  );
  
  return initialState;
}

// Update world state
export async function updateWorldState(worldId: string, newState: HydrationState): Promise<void> {
  await query(
    'UPDATE world_states SET state = $1, updated_at = NOW() WHERE world_id = $2',
    [JSON.stringify(newState), worldId]
  );
}

// Save message to database
export async function saveMessage(worldId: string, role: 'user' | 'assistant', content: string): Promise<Message> {
  const rows = await query<Message>(
    'INSERT INTO messages (id, world_id, role, content, created_at) VALUES (gen_random_uuid(), $1, $2, $3, NOW()) RETURNING *',
    [worldId, role, content]
  );
  return rows[0];
}

// Get recent messages for a world
export async function getRecentMessages(worldId: string, limit: number = 50): Promise<Message[]> {
  return query<Message>(
    'SELECT * FROM messages WHERE world_id = $1 ORDER BY created_at ASC LIMIT $2',
    [worldId, limit]
  );
}

// Get last N messages (for state endpoint)
export async function getLastMessages(worldId: string, limit: number = 20): Promise<Message[]> {
  const messages = await query<Message>(
    'SELECT * FROM messages WHERE world_id = $1 ORDER BY created_at DESC LIMIT $2',
    [worldId, limit]
  );
  return messages.reverse(); // Return in chronological order
}
