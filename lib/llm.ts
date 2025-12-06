import OpenAI from 'openai';
import { HydrationState, Message } from './models';
import fs from 'fs';
import path from 'path';
import { buildIdentityEnforcementPrompt, validateAgentOutput } from './identity';
import { buildWorldContext } from './worldState';

const openai = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY
});

const MODEL = process.env.OPENAI_MODEL || 'gpt-4o';

// Identity enforcement enabled flag
const IDENTITY_ENFORCEMENT_ENABLED = true;

// Maximum number of regeneration attempts for identity enforcement
// If Rebecca's output fails validation, regenerate up to this many times total
const IDENTITY_MAX_ATTEMPTS = 3;

// Get the base directory - handles both dev and production (standalone)
function getBaseDir(): string {
  // In standalone mode, files are relative to the .next/standalone directory
  // Try multiple possible locations
  const possiblePaths = [
    process.cwd(), // Standard location
    path.join(process.cwd(), '..'), // One level up
    '/app', // Docker/Railway common location
  ];
  
  for (const basePath of possiblePaths) {
    const testPath = path.join(basePath, 'prompts', 'SYSTEM_PROMPT_VIRLIFE.md');
    if (fs.existsSync(testPath)) {
      return basePath;
    }
  }
  
  return process.cwd();
}

// Load prompt files
function loadPromptFile(filename: string): string {
  const baseDir = getBaseDir();
  const filePath = path.join(baseDir, 'prompts', filename);
  try {
    console.log(`Loading prompt file from: ${filePath}`);
    const content = fs.readFileSync(filePath, 'utf-8');
    console.log(`Successfully loaded prompt file: ${filename} (${content.length} chars)`);
    return content;
  } catch (err) {
    console.error(`Failed to load prompt file: ${filename} at ${filePath}`, err);
    return '';
  }
}

// Load data files
function loadDataFile(filename: string): string {
  const baseDir = getBaseDir();
  const filePath = path.join(baseDir, 'data', filename);
  try {
    console.log(`Loading data file from: ${filePath}`);
    const content = fs.readFileSync(filePath, 'utf-8');
    console.log(`Successfully loaded data file: ${filename} (${content.length} chars)`);
    return content;
  } catch (err) {
    console.error(`Failed to load data file: ${filename} at ${filePath}`, err);
    return '';
  }
}

// Load logic files (identity files, engines, layers)
function loadLogicFile(relativePath: string): string {
  const baseDir = getBaseDir();
  const filePath = path.join(baseDir, relativePath);
  try {
    console.log(`Loading logic file from: ${filePath}`);
    const content = fs.readFileSync(filePath, 'utf-8');
    console.log(`Successfully loaded logic file: ${relativePath} (${content.length} chars)`);
    return content;
  } catch (err) {
    console.error(`Failed to load logic file: ${relativePath} at ${filePath}`, err);
    return '';
  }
}

// Build the full system prompt with all injected context
function buildSystemPrompt(worldState: HydrationState): string {
  const basePrompt = loadPromptFile('SYSTEM_PROMPT_VIRLIFE.md');
  const logic = loadDataFile('LOGIC.md');
  const baseline = loadDataFile('Sim Baseline.txt');
  // Load the FULL fingerprint from logic/identity (not the compressed one in data/)
  const rebeccaFingerprint = loadLogicFile('logic/identity/Rebecca_Fingerprint_v5.0.json');
  // Load the linguistic engine (was missing before!)
  const rebeccaLinguisticEngine = loadLogicFile('logic/engines/Rebecca_Linguistic_Engine.md');
  // Load the expression engine (controls HOW Rebecca expresses herself each turn)
  const rebeccaExpressionEngine = loadPromptFile('Rebecca_Expression_Engine.md');
  const georgeProfile = loadDataFile('George_Profile.txt');

  // Replace placeholders in the system prompt
  let fullPrompt = basePrompt;
  
  fullPrompt = fullPrompt.replace(
    '<<PASTE THE FULL CONTENTS OF LOGIC.md HERE>>',
    logic
  );
  
  fullPrompt = fullPrompt.replace(
    '<<PASTE THE FULL CONTENTS OF "Sim Baseline.txt" HERE>>',
    baseline
  );
  
  fullPrompt = fullPrompt.replace(
    '<<PASTE THE FULL CONTENTS OF "Rebecca_Fingerprint.json" HERE>>',
    rebeccaFingerprint
  );

  // Also inject the linguistic engine (critical for Rebecca's speech!)
  fullPrompt = fullPrompt.replace(
    '<<PASTE THE FULL CONTENTS OF "Rebecca_Linguistic_Engine.md" HERE>>',
    rebeccaLinguisticEngine
  );

  // Inject the expression engine (controls HOW Rebecca modulates expression each turn)
  // This goes AFTER the linguistic engine as per integration requirements
  fullPrompt = fullPrompt.replace(
    '<<PASTE THE FULL CONTENTS OF "Rebecca_Expression_Engine.md" HERE>>',
    rebeccaExpressionEngine
  );
  
  fullPrompt = fullPrompt.replace(
    '<<PASTE THE FULL CONTENTS OF "George_Profile.txt" HERE>>',
    georgeProfile
  );

  // Append current world state (hidden from user, used by LLM)
  fullPrompt += `\n\n---\n\n## CURRENT_WORLD_STATE\n\n\`\`\`json\n${JSON.stringify(worldState, null, 2)}\n\`\`\`\n`;

  // STAGE 0.5: Append human-readable world context summary
  const worldContext = buildWorldContext(worldState);
  fullPrompt += `\n\n---\n\n## WORLD CONTEXT SUMMARY\n\n${worldContext}\n`;

  // NOTE: Identity enforcement is now done via validation loop, not prompt injection
  // The fingerprint and linguistic engine are already embedded in the system prompt
  // via the <<PASTE...>> placeholders above

  return fullPrompt;
}

// Convert messages to OpenAI format
function messagesToOpenAI(messages: Message[]): Array<{ role: 'user' | 'assistant'; content: string }> {
  return messages.map(m => ({
    role: m.role,
    content: m.content
  }));
}

// Build retry messages when Rebecca's output fails identity validation.
// This tells the model explicitly what was wrong and asks it to rewrite the reply
// while preserving the scene facts and user input.
function buildRetryMessagesForIdentityFix(
  systemPrompt: string,
  conversationHistory: Message[],
  userMessage: string,
  lastOutput: string,
  issues: string[]
): Array<{ role: 'system' | 'user' | 'assistant'; content: string }> {
  const issuesText = issues.join('; ');

  // Base messages: system + recent conversation history
  const baseMessages: Array<{ role: 'system' | 'user' | 'assistant'; content: string }> = [
    { role: 'system', content: systemPrompt },
    ...messagesToOpenAI(conversationHistory)
  ];

  // Add an explicit system message explaining what was wrong and what must be fixed
  baseMessages.push({
    role: 'system',
    content:
      'IDENTITY ENFORCEMENT RETRY FOR REBECCA.\n' +
      'Your previous reply for Rebecca did NOT satisfy her identity fingerprint, linguistic engine, or negative-space constraints.\n' +
      'Validation issues were: ' + issuesText + '\n' +
      'You MUST now REWRITE ONLY Rebecca\'s reply so that:\n' +
      '  1) It fully matches her personality, humour, bluntness, and relational grammar with George.\n' +
      '  2) It avoids all generic, PR-like, romance-bot, or overly cinematic phrasing.\n' +
      '  3) It obeys her negative-space rules.\n' +
      'Do NOT change the scene facts, world state, or user actions. Keep the same situation and intention, but change HOW she speaks and behaves.\n' +
      'Reply with Rebecca\'s corrected output only.'
  });

  // Provide the previous assistant reply as a sample to fix
  baseMessages.push({
    role: 'assistant',
    content: lastOutput
  });

  // Re-attach the latest user message so the model has immediate conversational context
  baseMessages.push({
    role: 'user',
    content: userMessage
  });

  return baseMessages;
}

// Generate Rebecca/world output with HARD identity enforcement.
// If Rebecca's reply fails identity validation, we regenerate up to IDENTITY_MAX_ATTEMPTS times.
export async function generateWorldOutput(
  worldState: HydrationState,
  conversationHistory: Message[],
  userMessage: string
): Promise<string> {
  const systemPrompt = buildSystemPrompt(worldState);

  // Initial messages for the first attempt
  let messages: Array<{ role: 'system' | 'user' | 'assistant'; content: string }> = [
    { role: 'system', content: systemPrompt },
    ...messagesToOpenAI(conversationHistory),
    { role: 'user', content: userMessage }
  ];

  let output = '';
  let lastIssues: string[] | null = null;

  for (let attempt = 1; attempt <= IDENTITY_MAX_ATTEMPTS; attempt++) {
    const response = await openai.chat.completions.create({
      model: MODEL,
      messages,
      temperature: 0.85,
      max_tokens: 2000,
    });

    output = response.choices[0]?.message?.content || '';

    // If identity enforcement is off, accept the first attempt and exit.
    if (!IDENTITY_ENFORCEMENT_ENABLED) {
      break;
    }

    const validation = validateAgentOutput('rebecca', output);
    lastIssues = validation.issues;

    if (validation.valid) {
      console.log(
        `[IDENTITY] Rebecca output passed validation on attempt ${attempt}/${IDENTITY_MAX_ATTEMPTS}`
      );
      break;
    }

    console.warn(
      `[IDENTITY] Rebecca output failed validation on attempt ${attempt}/${IDENTITY_MAX_ATTEMPTS}. Issues:`,
      validation.issues
    );

    // If we still have attempts left, rebuild messages to explicitly fix the identity problems
    if (attempt < IDENTITY_MAX_ATTEMPTS) {
      messages = buildRetryMessagesForIdentityFix(
        systemPrompt,
        conversationHistory,
        userMessage,
        output,
        validation.issues
      );
      continue;
    } else {
      // Last attempt failed; log and accept the final output anyway
      console.error(
        '[IDENTITY] Rebecca output failed validation after max attempts. Using last attempt with issues:',
        validation.issues
      );
    }
  }

  return output;
}

/**
 * CALL 2 — STATE UPDATE (HIDDEN)
 * Updates the world state JSON based on what just happened
 * User never sees this output
 */
export async function generateStateUpdate(
  currentState: HydrationState,
  recentTranscript: string
): Promise<HydrationState> {
  const stateUpdatePrompt = loadPromptFile('WORLD_STATE_UPDATE.md');
  
  const userContent = `
CURRENT WORLD STATE:
\`\`\`json
${JSON.stringify(currentState, null, 2)}
\`\`\`

RECENT CONVERSATION:
${recentTranscript}
`;

  const response = await openai.chat.completions.create({
    model: MODEL,
    messages: [
      { role: 'system', content: stateUpdatePrompt },
      { role: 'user', content: userContent }
    ],
    temperature: 0.3,
    max_tokens: 1500,
  });

  const content = response.choices[0]?.message?.content || '';
  
  try {
    // Clean up the response - remove markdown code blocks if present
    let jsonContent = content.trim();
    
    // Remove ```json ... ``` or ``` ... ``` wrapper if present
    if (jsonContent.startsWith('```')) {
      const lines = jsonContent.split('\n');
      // Remove first line (```json or ```)
      lines.shift();
      // Remove last line (```)
      if (lines[lines.length - 1]?.trim() === '```') {
        lines.pop();
      }
      jsonContent = lines.join('\n');
    }
    
    // Parse the JSON response
    const parsed = JSON.parse(jsonContent);
    console.log('[STATE UPDATE] Successfully parsed updated state');
    return parsed as HydrationState;
  } catch (parseError) {
    console.error('Failed to parse state update JSON, returning current state');
    console.error('Parse error:', parseError);
    console.error('Raw response:', content);
    return currentState;
  }
}

// Build transcript from recent messages for state update call
export function buildRecentTranscript(
  messages: Message[],
  userMessage: string,
  worldOutput: string
): string {
  // Take last 10 messages plus the new exchange
  const recentMessages = messages.slice(-10);
  
  let transcript = '';
  for (const msg of recentMessages) {
    const label = msg.role === 'user' ? 'George' : 'World';
    transcript += `${label}: ${msg.content}\n\n`;
  }
  
  // Add the new exchange
  transcript += `George: ${userMessage}\n\n`;
  transcript += `World: ${worldOutput}\n`;
  
  return transcript;
}
