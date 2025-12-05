import OpenAI from 'openai';
import { HydrationState, Message } from './models';
import fs from 'fs';
import path from 'path';
import { buildIdentityEnforcementPrompt, validateAgentOutput } from './identity';

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

  // IDENTITY ENFORCEMENT LAYER - Inject identity enforcement context
  if (IDENTITY_ENFORCEMENT_ENABLED) {
    const identityEnforcement = buildIdentityEnforcementPrompt('rebecca');
    if (identityEnforcement) {
      fullPrompt += `\n\n${identityEnforcement}`;
      console.log('Identity Enforcement Layer ACTIVE');
    }
  }

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
 * Build retry messages for identity enforcement fix.
 * 
 * When Rebecca's output fails identity validation, this function constructs
 * new messages that explicitly tell the model WHAT was wrong (the validation issues)
 * and HOW to fix it (by respecting fingerprint, linguistic engine, negative space).
 * 
 * The previous invalid output is included so the model can rewrite it.
 */
function buildRetryMessagesForIdentityFix(
  previousMessages: Array<{ role: 'system' | 'user' | 'assistant'; content: string }>,
  lastOutput: string,
  issues: string[]
): Array<{ role: 'system' | 'user' | 'assistant'; content: string }> {
  const issuesText = issues.join('; ');

  return [
    ...previousMessages,
    {
      role: 'system',
      content:
        'IDENTITY ENFORCEMENT: Your previous reply for Rebecca did not respect her identity, fingerprint, or linguistic engine. ' +
        'You MUST now rewrite ONLY Rebecca\'s next reply so that it fully obeys: ' +
        '1) her identity fingerprint, 2) her linguistic rules, 3) her negative-space constraints. ' +
        'Do NOT change the scene facts, only how she speaks and behaves. ' +
        'The validation issues were: ' +
        issuesText +
        '. Produce a new reply that would pass identity validation.'
    },
    {
      role: 'assistant',
      content: lastOutput
    }
  ];
}

/**
 * CALL 1 — WORLD OUTPUT (VISIBLE)
 * Generates the narrative world response that the user sees
 * 
 * IDENTITY ENFORCEMENT PIPELINE:
 * WORLD + SCENE CONTEXT → AGENT_INTENT_GENERATION → IDENTITY_ENFORCEMENT_LAYER → LINGUISTIC_ENGINE → OUTPUT_RENDER
 * 
 * HARD IDENTITY ENFORCEMENT GATE:
 * When IDENTITY_ENFORCEMENT_ENABLED is true, Rebecca's output is validated against her
 * identity fingerprint, linguistic engine, and negative-space constraints. If validation
 * fails, the model is explicitly instructed to regenerate the output up to IDENTITY_MAX_ATTEMPTS
 * times. Each retry includes the validation issues so the model knows exactly what to fix.
 * Only after all attempts are exhausted (or validation passes) does the function return.
 */
export async function generateWorldOutput(
  worldState: HydrationState,
  conversationHistory: Message[],
  userMessage: string
): Promise<string> {
  const systemPrompt = buildSystemPrompt(worldState);
  
  // Initial messages for the first generation attempt
  let messages: Array<{ role: 'system' | 'user' | 'assistant'; content: string }> = [
    { role: 'system', content: systemPrompt },
    ...messagesToOpenAI(conversationHistory),
    { role: 'user', content: userMessage }
  ];

  // If identity enforcement is disabled, do a single generation and return
  if (!IDENTITY_ENFORCEMENT_ENABLED) {
    const response = await openai.chat.completions.create({
      model: MODEL,
      messages,
      temperature: 0.85,
      max_tokens: 2000,
    });
    return response.choices[0]?.message?.content || '';
  }

  // HARD IDENTITY ENFORCEMENT LOOP:
  // Generate Rebecca's reply, validate it, and regenerate if it fails validation.
  // Up to IDENTITY_MAX_ATTEMPTS total attempts before accepting the output.
  let finalOutput = '';
  let lastValidation: { valid: boolean; issues: string[] } | null = null;

  for (let attempt = 1; attempt <= IDENTITY_MAX_ATTEMPTS; attempt++) {
    try {
      const response = await openai.chat.completions.create({
        model: MODEL,
        messages,
        temperature: 0.85,
        max_tokens: 2000,
      });

      const output = response.choices[0]?.message?.content || '';

      // Validate the output against Rebecca's identity
      let validation: { valid: boolean; issues: string[] };
      try {
        validation = validateAgentOutput('rebecca', output);
      } catch (validationError) {
        // If validation itself throws, log error and accept the output
        console.error('[IDENTITY] Validation threw an error, accepting output:', validationError);
        finalOutput = output;
        break;
      }

      lastValidation = validation;

      if (validation.valid) {
        console.log(`[IDENTITY] Rebecca output passed validation (attempt ${attempt}/${IDENTITY_MAX_ATTEMPTS})`);
        finalOutput = output;
        break;
      }

      // If invalid and attempts remain, prepare for regeneration
      if (attempt < IDENTITY_MAX_ATTEMPTS) {
        console.warn(
          `[IDENTITY] Rebecca output failed validation (attempt ${attempt}/${IDENTITY_MAX_ATTEMPTS}). Issues:`,
          validation.issues
        );

        // Modify the messages for the next attempt so the model REWRITES the reply
        messages = buildRetryMessagesForIdentityFix(messages, output, validation.issues);
        continue;
      }

      // Last attempt and still invalid - accept it but log error
      console.error(
        `[IDENTITY] Rebecca output failed validation after ${IDENTITY_MAX_ATTEMPTS} attempts. Using last attempt with issues:`,
        validation.issues
      );
      finalOutput = output;

    } catch (generationError) {
      // If generation itself fails, log and rethrow (don't mask API errors)
      console.error(`[IDENTITY] Generation failed on attempt ${attempt}:`, generationError);
      throw generationError;
    }
  }

  return finalOutput;
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
