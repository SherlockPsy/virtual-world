import { NextRequest, NextResponse } from 'next/server';
import { ChatRequest, ChatResponse } from '@/lib/models';
import {
  getOrCreateUser,
  getOrCreateWorld,
  getOrCreateWorldState,
  updateWorldState,
  saveMessage,
  getRecentMessages
} from '@/lib/worldState';
import {
  generateWorldOutput,
  generateStateUpdate,
  buildRecentTranscript
} from '@/lib/llm';

export async function POST(request: NextRequest) {
  try {
    const body = await request.json() as ChatRequest;
    const { userId, worldId, message } = body;

    if (!message || message.trim() === '') {
      return NextResponse.json(
        { error: 'Message is required' },
        { status: 400 }
      );
    }

    // Step 1: Get or create user
    const user = await getOrCreateUser(userId);

    // Step 2: Get or create world
    const world = await getOrCreateWorld(user.id, worldId);

    // Step 3: Load current world state
    const worldState = await getOrCreateWorldState(world.id);

    // Step 4: Load conversation history
    const conversationHistory = await getRecentMessages(world.id, 50);

    // Step 5: Run WORLD OUTPUT call (visible to user)
    const worldOutput = await generateWorldOutput(
      worldState,
      conversationHistory,
      message
    );

    // Step 6: Save both messages to database
    await saveMessage(world.id, 'user', message);
    await saveMessage(world.id, 'assistant', worldOutput);

    // Step 7: Run STATE UPDATE call (hidden from user)
    const recentTranscript = buildRecentTranscript(
      conversationHistory,
      message,
      worldOutput
    );
    const updatedState = await generateStateUpdate(worldState, recentTranscript);

    // Step 8: Update world state in database
    await updateWorldState(world.id, updatedState);

    // Step 9: Return response
    const response: ChatResponse = {
      userId: user.id,
      worldId: world.id,
      worldOutput
    };

    return NextResponse.json(response);
  } catch (error) {
    console.error('Chat API error:', error);
    const errorMessage = error instanceof Error ? error.message : 'Unknown error';
    const errorStack = error instanceof Error ? error.stack : '';
    console.error('Error details:', { message: errorMessage, stack: errorStack });
    return NextResponse.json(
      { error: 'Internal server error', details: errorMessage },
      { status: 500 }
    );
  }
}
