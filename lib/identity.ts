import fs from 'fs';
import path from 'path';

/**
 * IDENTITY ENFORCEMENT MODULE
 * 
 * This module implements the Identity Enforcement Layer for all agents.
 * It ensures every agent behaves and speaks strictly according to:
 * - Their identity fingerprint
 * - Their linguistic engine
 * - Their negative-space constraints
 * 
 * Pipeline flow:
 * WORLD + SCENE CONTEXT → AGENT_INTENT_GENERATION → IDENTITY_ENFORCEMENT_LAYER → LINGUISTIC_ENGINE → OUTPUT_RENDER
 */

export interface AgentIdentity {
  agentId: string;
  fingerprintPath: string;
  linguisticEnginePath: string;
  negativeSpacePath?: string;
}

export interface IdentityContext {
  fingerprint: string;
  linguisticEngine: string;
  negativeSpace: string[];
  relationalGrammar: Record<string, unknown>;
}

// Agent registry - maps agent IDs to their identity files
const AGENT_REGISTRY: Record<string, AgentIdentity> = {
  'rebecca': {
    agentId: 'rebecca',
    fingerprintPath: 'logic/identity/Rebecca_Fingerprint_v5.0.json',
    linguisticEnginePath: 'logic/engines/Rebecca_Linguistic_Engine.md',
  }
};

// Get base directory for file loading
function getBaseDir(): string {
  const possiblePaths = [
    process.cwd(),
    path.join(process.cwd(), '..'),
    '/app',
  ];
  
  for (const basePath of possiblePaths) {
    const testPath = path.join(basePath, 'logic', 'LOGIC_BUILDER_CORE.md');
    if (fs.existsSync(testPath)) {
      return basePath;
    }
  }
  
  return process.cwd();
}

// Load a logic file
function loadLogicFile(relativePath: string): string {
  const baseDir = getBaseDir();
  const filePath = path.join(baseDir, relativePath);
  try {
    return fs.readFileSync(filePath, 'utf-8');
  } catch (err) {
    console.error(`Failed to load logic file: ${relativePath}`, err);
    return '';
  }
}

// Load the Identity Enforcement Layer rules
export function loadEnforcementLayer(): string {
  return loadLogicFile('logic/layers/Identity_Enforcement_Layer.md');
}

// Load the core logic rules
export function loadLogicBuilderCore(): string {
  return loadLogicFile('logic/LOGIC_BUILDER_CORE.md');
}

// Load agent identity context
export function loadAgentIdentity(agentId: string): IdentityContext | null {
  const agent = AGENT_REGISTRY[agentId.toLowerCase()];
  if (!agent) {
    console.error(`Agent not found in registry: ${agentId}`);
    return null;
  }

  const fingerprint = loadLogicFile(agent.fingerprintPath);
  const linguisticEngine = loadLogicFile(agent.linguisticEnginePath);
  
  if (!fingerprint || !linguisticEngine) {
    console.error(`Failed to load identity files for agent: ${agentId}`);
    return null;
  }

  // Extract negative space from fingerprint if it's JSON
  let negativeSpace: string[] = [];
  let relationalGrammar: Record<string, unknown> = {};
  
  try {
    const parsed = JSON.parse(fingerprint);
    if (parsed.negative_space) {
      negativeSpace = parsed.negative_space;
    }
    if (parsed.relational_grammar) {
      relationalGrammar = parsed.relational_grammar;
    }
  } catch {
    // Fingerprint might be markdown, extract negative space rules textually
    negativeSpace = [
      'No cruelty or manipulative humour',
      'No corporate PR-speak',
      'No false perfection',
      'No emotional dishonesty',
      'No fame-seeking behaviour',
      'No generic romance-bot dialogue',
      'No meta-awareness or system references'
    ];
  }

  return {
    fingerprint,
    linguisticEngine,
    negativeSpace,
    relationalGrammar
  };
}

/**
 * Build the Identity Enforcement System Prompt
 * 
 * This creates the complete system context for enforcing agent identity,
 * including all fingerprint data, linguistic rules, and enforcement logic.
 */
export function buildIdentityEnforcementPrompt(agentId: string = 'rebecca'): string {
  const identity = loadAgentIdentity(agentId);
  const enforcementLayer = loadEnforcementLayer();
  const logicCore = loadLogicBuilderCore();
  
  if (!identity) {
    console.error(`Could not load identity for agent: ${agentId}`);
    return '';
  }

  return `
====================================================
IDENTITY ENFORCEMENT SYSTEM - ACTIVE
====================================================

You are generating output for agent: ${agentId.toUpperCase()}

CRITICAL: Before generating ANY speech or action, you MUST:
1. Check intent consistency with identity fingerprint
2. Check tone/form consistency with linguistic engine  
3. Verify NO violations of negative-space rules
4. Only then generate the final output

====================================================
AGENT IDENTITY FINGERPRINT
====================================================

${identity.fingerprint}

====================================================
AGENT LINGUISTIC ENGINE
====================================================

${identity.linguisticEngine}

====================================================
NEGATIVE SPACE RULES (WHAT ${agentId.toUpperCase()} WOULD NEVER DO)
====================================================

${identity.negativeSpace.map((rule, i) => `${i + 1}. ${rule}`).join('\n')}

====================================================
IDENTITY ENFORCEMENT LAYER (RUNTIME LOGIC)
====================================================

${enforcementLayer}

====================================================
CORE WORLD LOGIC
====================================================

${logicCore}

====================================================
ENFORCEMENT PIPELINE (MANDATORY ON EVERY OUTPUT)
====================================================

Before outputting, run this mental check:

1. INTENT CHECK:
   - Does this action align with ${agentId}'s core values?
   - Does it match their motivations and emotional architecture?
   - Is it consistent with their relational grammar toward George?

2. FORM CHECK:
   - Does the speech match ${agentId}'s linguistic signature?
   - Are humour patterns correct (dry irony, absurdist, self-deprecating)?
   - Is the cadence and register appropriate to emotional state?
   - Are there signature self-interruptions or phrase patterns?

3. SAFETY CHECK:
   - Does this violate ANY negative-space rule?
   - Is there ANY generic/PR-like/romance-bot phrasing?
   - Would this sound like a "generic character" rather than THIS specific person?

If ANY check fails → REWRITE the output to be identity-consistent.

====================================================
GENERIC OUTPUT DETECTION (AUTO-REJECT THESE PATTERNS)
====================================================

REJECT outputs containing:
- "It feels like home already" (generic)
- "What's on your mind?" (generic therapy-speak)
- "I'm here for you" (generic reassurance)
- Smooth, polished, PR-ready phrasing
- Emotionally flat responses
- Missing humour when context allows it
- Missing physicality/embodiment
- Missing Rebecca's blunt directness

INSTEAD generate:
- Specific, character-authentic reactions
- Rebecca's dry wit and teasing
- Moments of self-interruption or blurted truth
- Physical presence (hip bumps, mug cradling, squinting)
- Posh British + Swedish directness blend

====================================================
END ENFORCEMENT CONTEXT
====================================================
`;
}

/**
 * Validate output against identity rules
 * Returns true if output passes, false if it needs rewriting
 */
export function validateAgentOutput(agentId: string, output: string): { valid: boolean; issues: string[] } {
  const identity = loadAgentIdentity(agentId);
  const issues: string[] = [];

  if (!identity) {
    return { valid: false, issues: ['Agent identity not found'] };
  }

  // Check for generic patterns that should be rejected
  const genericPatterns = [
    /it feels like home already/i,
    /what's on your mind\??/i,
    /i'm here for you/i,
    /anything you want to talk about\??/i,
    /how are you feeling\??$/i,
    /tell me more about that/i,
  ];

  for (const pattern of genericPatterns) {
    if (pattern.test(output)) {
      issues.push(`Contains generic pattern: ${pattern.source}`);
    }
  }

  // Check for Rebecca-specific requirements (if agent is Rebecca)
  if (agentId.toLowerCase() === 'rebecca') {
    // Check for lack of personality markers
    const hasHumour = /squint|brow|corner of.*mouth|teasing|bloody|fucking|damn|christ/i.test(output);
    const hasPhysicality = /lean|step|bump|touch|hand|shoulder|hip|mug|coffee|kitchen/i.test(output);
    const hasDirectness = /look,|here's the|the thing is|actually|honestly|truth is/i.test(output);

    if (!hasHumour && !hasPhysicality && !hasDirectness) {
      issues.push('Output lacks Rebecca signature markers (humour, physicality, or directness)');
    }
  }

  // Check against negative space rules
  for (const rule of identity.negativeSpace) {
    if (rule.toLowerCase().includes('cruelty') && /humiliat|mock|demean/i.test(output)) {
      issues.push(`Violates negative space: ${rule}`);
    }
    if (rule.toLowerCase().includes('generic') && issues.length > 0) {
      issues.push(`Violates negative space: ${rule}`);
    }
  }

  return {
    valid: issues.length === 0,
    issues
  };
}
