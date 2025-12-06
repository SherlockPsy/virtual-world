/**
 * PROMPT ASSEMBLER
 * 
 * Builds the ordered prompt array for Rebecca expression.
 * STRICT order as per BUILDER_INSTRUCTIONS.md Section 4:
 * 
 * 1. SYSTEM: Narrator System Prompt
 * 2. SYSTEM: Rebecca Fingerprint
 * 3. SYSTEM: Rebecca Expression Engine
 * 4. SYSTEM: Rebecca State Summary (from RebeccaState)
 * 5. SYSTEM: World Ledger Slice
 * 6. SYSTEM: Scene Summary
 * 7. USER:   User Input
 */

import fs from 'fs';
import path from 'path';
import { RebeccaState, generateExpressionEngineNote, generateNarratorStateNote } from './RebeccaStateMachine';
import { HydrationState } from './models';

// ============================================
// MESSAGE TYPE
// ============================================

export interface PromptMessage {
  role: 'system' | 'user' | 'assistant';
  content: string;
}

// ============================================
// CONTEXT FOR PROMPT ASSEMBLY
// ============================================

export interface PromptAssemblyContext {
  worldState: HydrationState;
  rebeccaState: RebeccaState;
  userInput: string;
  recentMessages?: Array<{ role: 'user' | 'assistant'; content: string }>;
}

// ============================================
// FILE LOADING UTILITIES
// ============================================

function getBaseDir(): string {
  const possiblePaths = [
    process.cwd(),
    path.join(process.cwd(), '..'),
    '/app',
  ];
  
  for (const basePath of possiblePaths) {
    const testPath = path.join(basePath, 'prompts', 'REBECCA_FINGERPRINT.md');
    if (fs.existsSync(testPath)) {
      return basePath;
    }
  }
  
  return process.cwd();
}

function loadPromptFile(filename: string): string {
  const baseDir = getBaseDir();
  const filePath = path.join(baseDir, 'prompts', filename);
  try {
    return fs.readFileSync(filePath, 'utf-8');
  } catch (err) {
    console.error(`Failed to load prompt file: ${filename}`, err);
    return '';
  }
}

// ============================================
// WORLD LEDGER SLICE GENERATOR
// ============================================

function generateWorldLedgerSlice(worldState: HydrationState): string {
  const lines: string[] = [];
  
  lines.push('## World Ledger Slice');
  lines.push('');
  
  // Time
  lines.push(`**Time:** ${worldState.time.time_of_day} (Day ${worldState.time.days_into_offgrid + 1})`);
  
  // Locations
  const georgeLoc = worldState.locations.george.replace(':', ' → ');
  const rebeccaLoc = worldState.locations.rebecca.replace(':', ' → ');
  if (worldState.locations.george === worldState.locations.rebecca) {
    lines.push(`**Location:** Both in ${georgeLoc}`);
  } else {
    lines.push(`**George:** ${georgeLoc}`);
    lines.push(`**Rebecca:** ${rebeccaLoc}`);
  }
  
  // Activities
  if (worldState.activities.shared) {
    lines.push(`**Activity:** ${worldState.activities.shared.description} (together)`);
  } else {
    if (worldState.activities.rebecca) {
      lines.push(`**Rebecca's activity:** ${worldState.activities.rebecca.description}`);
    }
    if (worldState.activities.george) {
      lines.push(`**George's activity:** ${worldState.activities.george.description}`);
    }
  }
  
  // Relationship tone
  lines.push(`**Relationship tone:** ${worldState.relationship.overall_tone}`);
  
  // Recent moments (last 2)
  if (worldState.relationship.recent_key_moments.length > 0) {
    const recentMoments = worldState.relationship.recent_key_moments.slice(-2);
    lines.push(`**Recent moments:** ${recentMoments.join('; ')}`);
  }
  
  return lines.join('\n');
}

// ============================================
// SCENE SUMMARY GENERATOR
// ============================================

function generateSceneSummary(worldState: HydrationState): string {
  const location = worldState.locations.rebecca;
  const timeOfDay = worldState.time.time_of_day;
  const togetherLoc = worldState.locations.george === worldState.locations.rebecca;
  
  let scene = `## Scene Summary\n\n`;
  
  // Location description
  const locationDescriptions: Record<string, string> = {
    'house:kitchen': 'the kitchen, with morning light through the window, the smell of coffee',
    'house:lounge': 'the lounge, comfortable and familiar, the sofa inviting',
    'house:bedroom': 'the bedroom, quiet and private',
    'house:hallway': 'the hallway, a transitional space between rooms',
    'house:bathroom': 'the bathroom',
    'house:garden': 'the garden, fresh air and open sky',
    'outside:park': 'the park, trees and grass, people walking by in the distance',
    'outside:cafe': 'a café, the hum of other customers, the clink of cups',
    'outside:street': 'the street, urban sounds, passing cars and pedestrians',
    'outside:shop': 'a shop, browsing among shelves and displays',
  };
  
  const locDesc = locationDescriptions[location] || location;
  scene += `You are in ${locDesc}.\n`;
  
  // Time atmosphere
  const timeDescriptions: Record<string, string> = {
    'early_morning': 'Early morning light filters in, the day just beginning.',
    'late_morning': 'Late morning, the day well underway.',
    'afternoon': 'Afternoon, relaxed and unhurried.',
    'evening': 'Evening settles in, the light growing softer.',
    'late_night': 'Late night, quiet and still.',
  };
  
  scene += timeDescriptions[timeOfDay] || '';
  scene += '\n';
  
  // Together or apart
  if (togetherLoc) {
    scene += 'Rebecca is here with you.\n';
  } else {
    const rebeccaLocDesc = locationDescriptions[worldState.locations.rebecca] || worldState.locations.rebecca;
    scene += `Rebecca is in ${rebeccaLocDesc}.\n`;
  }
  
  return scene;
}

// ============================================
// REBECCA EXPRESSION ENGINE INSTRUCTION
// ============================================

const REBECCA_ENGINE_INSTRUCTION = `
=====================================================================
CRITICAL DIRECTIVE FOR THIS OUTPUT
=====================================================================

YOU ARE REBECCA FERGUSON'S EXPRESSION ENGINE.
Generate ONLY what Rebecca says and does.
Do NOT narrate or describe the world.
Do NOT describe other agents or characters.
Do NOT produce scene-setting or environmental description.
Do NOT explain psychology or motivation.

Follow the fingerprint, modulation map, and expression engine exactly.

Your output should be ONLY:
- Rebecca's spoken dialogue (marked with "Rebecca:")
- Brief micro-behaviours embedded naturally (she smiles, she leans in, etc.)

Keep it grounded, authentic, and true to her voice.
`;

// ============================================
// MAIN PROMPT ASSEMBLY FUNCTION
// ============================================

/**
 * Assemble the complete prompt array for Rebecca expression.
 * STRICT order as per BUILDER_INSTRUCTIONS.md:
 * 
 * 1. Narrator System Prompt
 * 2. Rebecca Fingerprint
 * 3. Rebecca Expression Engine
 * 4. Rebecca State Summary
 * 5. World Ledger Slice
 * 6. Scene Summary
 * 7. User Input
 */
export function assembleRebeccaPrompt(context: PromptAssemblyContext): PromptMessage[] {
  const messages: PromptMessage[] = [];

  // 1. SYSTEM: Narrator System Prompt
  const narratorPrompt = loadPromptFile('Narrator_System_Prompt.md');
  messages.push({
    role: 'system',
    content: narratorPrompt,
  });

  // 2. SYSTEM: Rebecca Fingerprint
  const fingerprint = loadPromptFile('REBECCA_FINGERPRINT.md');
  messages.push({
    role: 'system',
    content: fingerprint,
  });

  // 3. SYSTEM: Rebecca Expression Engine
  const expressionEngine = loadPromptFile('REBECCA_EXPRESSION_ENGINE.md');
  messages.push({
    role: 'system',
    content: expressionEngine,
  });

  // 4. SYSTEM: Rebecca State Summary (from RebeccaState)
  const stateNote = generateExpressionEngineNote(context.rebeccaState);
  messages.push({
    role: 'system',
    content: stateNote,
  });

  // 5. SYSTEM: World Ledger Slice
  const worldLedger = generateWorldLedgerSlice(context.worldState);
  messages.push({
    role: 'system',
    content: worldLedger,
  });

  // 6. SYSTEM: Scene Summary
  const sceneSummary = generateSceneSummary(context.worldState);
  messages.push({
    role: 'system',
    content: sceneSummary,
  });

  // Add the critical directive
  messages.push({
    role: 'system',
    content: REBECCA_ENGINE_INSTRUCTION,
  });

  // Include recent conversation history (last 6 messages)
  if (context.recentMessages && context.recentMessages.length > 0) {
    const recentSlice = context.recentMessages.slice(-6);
    for (const msg of recentSlice) {
      messages.push({
        role: msg.role,
        content: msg.content,
      });
    }
  }

  // 7. USER: User Input
  messages.push({
    role: 'user',
    content: context.userInput,
  });

  return messages;
}

/**
 * Assemble a narrator-only prompt (for scene description without Rebecca speaking).
 * Includes Rebecca's state as a system note to guide observable behaviour highlighting.
 */
export function assembleNarratorPrompt(context: PromptAssemblyContext): PromptMessage[] {
  const messages: PromptMessage[] = [];

  // Narrator System Prompt
  const narratorPrompt = loadPromptFile('Narrator_System_Prompt.md');
  messages.push({
    role: 'system',
    content: narratorPrompt,
  });

  // Rebecca state note for narrator
  const narratorStateNote = generateNarratorStateNote(context.rebeccaState);
  messages.push({
    role: 'system',
    content: narratorStateNote,
  });

  // World Ledger Slice
  const worldLedger = generateWorldLedgerSlice(context.worldState);
  messages.push({
    role: 'system',
    content: worldLedger,
  });

  // Scene Summary
  const sceneSummary = generateSceneSummary(context.worldState);
  messages.push({
    role: 'system',
    content: sceneSummary,
  });

  // Recent conversation history
  if (context.recentMessages && context.recentMessages.length > 0) {
    const recentSlice = context.recentMessages.slice(-6);
    for (const msg of recentSlice) {
      messages.push({
        role: msg.role,
        content: msg.content,
      });
    }
  }

  // User Input
  messages.push({
    role: 'user',
    content: context.userInput,
  });

  return messages;
}
