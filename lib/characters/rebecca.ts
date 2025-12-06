/**
 * REBECCA CHARACTER MODULE
 * 
 * The main interface for generating Rebecca's expression.
 * Implements the pipeline from BUILDER_INSTRUCTIONS.md Section 12:
 * 
 * 1. Load RebeccaState for the current context
 * 2. Assemble prompt with fingerprint, engine, state summary, world ledger, scene
 * 3. Call completeRebeccaExpression()
 * 4. Parse and validate output
 * 5. Update RebeccaState based on the interaction
 * 6. Return the output
 */

import { HydrationState, Message } from '../models';
import {
  RebeccaState,
  getInitialRebeccaState,
  updateRebeccaState,
  StateUpdateContext,
  serializeRebeccaState,
  deserializeRebeccaState,
} from '../RebeccaStateMachine';
import { assembleRebeccaPrompt, PromptMessage } from '../PromptAssembler';
import { completeRebeccaExpression } from '../llm';

// ============================================
// CONTEXT FOR REBECCA OUTPUT GENERATION
// ============================================

export interface RebeccaGenerationContext {
  worldState: HydrationState;
  userInput: string;
  recentMessages: Message[];
  rebeccaStateJson?: string | null; // Serialized RebeccaState from storage
}

// ============================================
// RESULT FROM REBECCA GENERATION
// ============================================

export interface RebeccaGenerationResult {
  output: string;
  updatedState: RebeccaState;
  updatedStateJson: string;
}

// ============================================
// OUTPUT PARSING AND VALIDATION
// ============================================

/**
 * Parse Rebecca's response from the LLM output.
 * Strips any narration, world description, or other character speech.
 */
function parseRebeccaResponse(rawOutput: string): string {
  // The Expression Engine should already produce Rebecca-only content
  // Just do basic cleanup
  return rawOutput.trim();
}

/**
 * Validate that the output is appropriate Rebecca expression.
 * Returns issues if validation fails.
 */
function validateRebeccaOutput(output: string): { valid: boolean; issues: string[] } {
  const issues: string[] = [];
  
  // Only check for the most egregious generic patterns
  const genericPatterns = [
    { pattern: /tell me more about that/i, desc: 'generic therapy prompt' },
    { pattern: /anything for you/i, desc: 'generic romance-bot' },
  ];
  
  for (const { pattern, desc } of genericPatterns) {
    if (pattern.test(output)) {
      issues.push(`Contains generic pattern: ${desc}`);
    }
  }
  
  return {
    valid: issues.length === 0,
    issues,
  };
}

// ============================================
// MAIN GENERATION FUNCTION
// ============================================

/**
 * Generate Rebecca's output for the current turn.
 * This is the main entry point for Rebecca expression.
 */
export async function generateRebeccaOutput(
  context: RebeccaGenerationContext
): Promise<RebeccaGenerationResult> {
  // 1. Load RebeccaState
  const currentState = deserializeRebeccaState(context.rebeccaStateJson || null);
  
  // 2. Convert recent messages to the format needed by PromptAssembler
  const recentMsgs = context.recentMessages.map(m => ({
    role: m.role as 'user' | 'assistant',
    content: m.content,
  }));
  
  // 3. Assemble the prompt
  const prompt = assembleRebeccaPrompt({
    worldState: context.worldState,
    rebeccaState: currentState,
    userInput: context.userInput,
    recentMessages: recentMsgs,
  });
  
  // 4. Call the LLM
  let rawOutput = await completeRebeccaExpression(prompt);
  
  // 5. Parse and validate
  let output = parseRebeccaResponse(rawOutput);
  const validation = validateRebeccaOutput(output);
  
  // 6. If validation fails, retry with stricter instruction
  if (!validation.valid) {
    console.warn('[REBECCA] Output validation failed:', validation.issues);
    
    // Add a stricter instruction and retry
    const stricterPrompt: PromptMessage[] = [
      ...prompt,
      {
        role: 'system',
        content: `CORRECTION REQUIRED: Your previous output had these issues: ${validation.issues.join('; ')}. 
Generate ONLY Rebecca's dialogue and micro-behaviours. 
NO generic phrases. NO world description. NO therapy-speak.
Keep her voice authentic: dry wit, warmth, directness, occasional swearing.`,
      },
    ];
    
    rawOutput = await completeRebeccaExpression(stricterPrompt);
    output = parseRebeccaResponse(rawOutput);
  }
  
  // 7. Update RebeccaState based on the interaction
  const updateContext: StateUpdateContext = {
    userInput: context.userInput,
    rebeccaOutput: output,
    location: context.worldState.locations.rebecca,
    timeOfDay: context.worldState.time.time_of_day,
  };
  
  const updatedState = updateRebeccaState(currentState, updateContext);
  
  // 8. Serialize for storage
  const updatedStateJson = serializeRebeccaState(updatedState);
  
  return {
    output,
    updatedState,
    updatedStateJson,
  };
}

/**
 * Get the current RebeccaState or initialize a new one.
 */
export function getOrInitializeRebeccaState(stateJson?: string | null): RebeccaState {
  if (stateJson) {
    return deserializeRebeccaState(stateJson);
  }
  return getInitialRebeccaState();
}
