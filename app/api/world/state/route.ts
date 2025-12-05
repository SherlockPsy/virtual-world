import { NextRequest, NextResponse } from 'next/server';
import { StateResponse } from '@/lib/models';
import {
  getOrCreateUser,
  getOrCreateWorld,
  getOrCreateWorldState,
  getLastMessages
} from '@/lib/worldState';

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const userId = searchParams.get('userId') || undefined;
    const worldId = searchParams.get('worldId') || undefined;

    // Get or create user
    const user = await getOrCreateUser(userId);

    // Get or create world
    const world = await getOrCreateWorld(user.id, worldId);

    // Load world state
    const worldState = await getOrCreateWorldState(world.id);

    // Get last N messages
    const messages = await getLastMessages(world.id, 20);

    const response: StateResponse = {
      userId: user.id,
      worldId: world.id,
      messages: messages.map(m => ({
        role: m.role,
        content: m.content,
        created_at: m.created_at.toISOString ? m.created_at.toISOString() : String(m.created_at)
      })),
      worldState
    };

    return NextResponse.json(response);
  } catch (error) {
    console.error('State API error:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}
