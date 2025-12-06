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
import { generateRebeccaOutput, RebeccaGenerationContext } from '@/lib/characters/rebecca';

// Feature flag to enable the new Rebecca Expression Engine
// When true, uses the new architecture; when false, uses the legacy combined output
const USE_REBECCA_EXPRESSION_ENGINE = process.env.USE_REBECCA_EXPRESSION_ENGINE === 'true';

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

    let worldOutput: string;
    let updatedRebeccaStateJson: string | undefined;

    if (USE_REBECCA_EXPRESSION_ENGINE) {
      // ============================================
      // NEW ARCHITECTURE: Rebecca Expression Only
      // Per BUILDER_INSTRUCTIONS.md Section 6:
      // "It does NOT call the narrator for Rebecca's dialogue"
      // ============================================
      console.log('[CHAT] Using Rebecca Expression Engine');
      
      // Run REBECCA EXPRESSION output (her dialogue + micro-behaviours)
      // The Expression Engine prompt already includes narrator instructions
      // for scene context, so we don't need a separate narrator call
      const rebeccaContext: RebeccaGenerationContext = {
        worldState: worldState,
        userInput: message,
        recentMessages: conversationHistory,
        rebeccaStateJson: worldState.rebecca_state,
      };
      
      const rebeccaResult = await generateRebeccaOutput(rebeccaContext);
      
      // Rebecca's output IS the world output
      worldOutput = rebeccaResult.output;
      updatedRebeccaStateJson = rebeccaResult.updatedStateJson;

    } else {
      // ============================================
      // LEGACY ARCHITECTURE: Combined Output
      // ============================================
      console.log('[CHAT] Using legacy combined output');
      
      // Step 5: Run WORLD OUTPUT call (visible to user)
      worldOutput = await generateWorldOutput(
        worldState,
        conversationHistory,
        message
      );
    }

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

    // Step 7b: If using Rebecca Expression Engine, also save Rebecca's state
    if (updatedRebeccaStateJson) {
      updatedState.rebecca_state = updatedRebeccaStateJson;
    }

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
