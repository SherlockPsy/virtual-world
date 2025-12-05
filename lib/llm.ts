import OpenAI from 'openai';
import { HydrationState, Message } from './models';
import fs from 'fs';
import path from 'path';

const openai = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY
});

const MODEL = process.env.OPENAI_MODEL || 'gpt-4o';

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

// Build the full system prompt with all injected context
function buildSystemPrompt(worldState: HydrationState): string {
  const basePrompt = loadPromptFile('SYSTEM_PROMPT_VIRLIFE.md');
  const logic = loadDataFile('LOGIC.md');
  const baseline = loadDataFile('Sim Baseline.txt');
  const rebeccaFingerprint = loadDataFile('Rebecca_Fingerprint.json');
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
  
  fullPrompt = fullPrompt.replace(
    '<<PASTE THE FULL CONTENTS OF "George_Profile.txt" HERE>>',
    georgeProfile
  );

  // Append current world state (hidden from user, used by LLM)
  fullPrompt += `\n\n---\n\n## CURRENT_WORLD_STATE\n\n\`\`\`json\n${JSON.stringify(worldState, null, 2)}\n\`\`\`\n`;

  return fullPrompt;
}

// Convert messages to OpenAI format
function messagesToOpenAI(messages: Message[]): Array<{ role: 'user' | 'assistant'; content: string }> {
  return messages.map(m => ({
    role: m.role,
    content: m.content
  }));
}

/**
 * CALL 1 — WORLD OUTPUT (VISIBLE)
 * Generates the narrative world response that the user sees
 */
export async function generateWorldOutput(
  worldState: HydrationState,
  conversationHistory: Message[],
  userMessage: string
): Promise<string> {
  const systemPrompt = buildSystemPrompt(worldState);
  
  const messages: Array<{ role: 'system' | 'user' | 'assistant'; content: string }> = [
    { role: 'system', content: systemPrompt },
    ...messagesToOpenAI(conversationHistory),
    { role: 'user', content: userMessage }
  ];

  const response = await openai.chat.completions.create({
    model: MODEL,
    messages,
    temperature: 0.85,
    max_tokens: 2000,
  });

  return response.choices[0]?.message?.content || '';
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
    // Parse the JSON response
    const parsed = JSON.parse(content);
    return parsed as HydrationState;
  } catch {
    console.error('Failed to parse state update JSON, returning current state');
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
