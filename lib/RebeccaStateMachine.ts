/**
 * REBECCA STATE MACHINE
 * 
 * Implements the RebeccaState structure as defined in REBECCA_MODULATION_MAP.md.
 * Provides functions to:
 * - Load/initialize RebeccaState
 * - Update RebeccaState after each turn
 * - Generate a short textual summary for prompt injection
 * 
 * All state values are SEMANTIC (categorical labels), NOT numeric.
 */

// ============================================
// REBECCA STATE TYPE (FROM MODULATION MAP)
// ============================================

export type MoodLabel = 
  | 'calm' 
  | 'playful' 
  | 'tired' 
  | 'stressed' 
  | 'annoyed' 
  | 'vulnerable' 
  | 'focused' 
  | 'overwhelmed';

export type EnergyLabel = 'low' | 'medium' | 'high';

export type TrustLevel = 'growing' | 'steady' | 'strained' | 'repairing';

export type ComfortLevel = 'safe' | 'slightly_on_guard' | 'alert' | 'uncomfortable';

export type IntimacyBand = 'ordinary' | 'warm' | 'intimate' | 'post_intimacy';

export type SocialContext = 
  | 'alone_together' 
  | 'public_low_noise' 
  | 'public_busy' 
  | 'group_small' 
  | 'group_large';

export type CognitiveLoad = 'light' | 'moderate' | 'heavy';

export type HumourChannel = 'off' | 'light' | 'playful' | 'chaotic';

export type FearChannel = 'idle' | 'background' | 'active';

export type ClaustrophobiaFlag = 'none' | 'subtle' | 'triggered';

export interface RebeccaState {
  mood_label: MoodLabel;
  energy_label: EnergyLabel;
  trust_with_you: TrustLevel;
  comfort_with_context: ComfortLevel;
  intimacy_band: IntimacyBand;
  social_context: SocialContext;
  cognitive_load: CognitiveLoad;
  humour_channel: HumourChannel;
  recent_event_tags: string[];
  physical_state: string[];
  fear_channel: FearChannel;
  claustrophobia_flag: ClaustrophobiaFlag;
}

// ============================================
// DEFAULT / INITIAL STATE
// ============================================

export function getInitialRebeccaState(): RebeccaState {
  return {
    mood_label: 'calm',
    energy_label: 'medium',
    trust_with_you: 'steady',
    comfort_with_context: 'safe',
    intimacy_band: 'warm',
    social_context: 'alone_together',
    cognitive_load: 'light',
    humour_channel: 'light',
    recent_event_tags: [],
    physical_state: ['well_rested'],
    fear_channel: 'idle',
    claustrophobia_flag: 'none',
  };
}

// ============================================
// STATE UPDATE CONTEXT
// ============================================

export interface StateUpdateContext {
  userInput: string;
  rebeccaOutput: string;
  location: string;
  timeOfDay: string;
  recentEvents?: string[];
}

// ============================================
// STATE UPDATE FUNCTIONS
// ============================================

/**
 * Update RebeccaState based on the latest interaction.
 * Applies semantic rules from REBECCA_MODULATION_MAP.md Section 6.
 */
export function updateRebeccaState(
  currentState: RebeccaState,
  context: StateUpdateContext
): RebeccaState {
  const newState = { ...currentState };
  const userInput = context.userInput.toLowerCase();
  const rebeccaOutput = context.rebeccaOutput.toLowerCase();
  
  // Track new event tags
  const newEventTags: string[] = [];

  // ============================================
  // DETECT WARMTH / INTIMACY RAISING EVENTS
  // ============================================
  
  // Shared laughter detection
  if (rebeccaOutput.includes('laugh') || rebeccaOutput.includes('chuckle') || 
      rebeccaOutput.includes('grin') || userInput.includes('haha') ||
      userInput.includes('lol') || userInput.includes('funny')) {
    newEventTags.push('shared_laughter');
    if (newState.humour_channel === 'off' || newState.humour_channel === 'light') {
      newState.humour_channel = 'playful';
    }
  }

  // Sincere disclosure / vulnerability
  if (userInput.includes('i love you') || userInput.includes('love you') ||
      rebeccaOutput.includes('i love you') || rebeccaOutput.includes('love you')) {
    newEventTags.push('sincere_disclosure');
    if (newState.trust_with_you !== 'strained') {
      newState.trust_with_you = 'steady';
    }
    if (newState.intimacy_band === 'ordinary' || newState.intimacy_band === 'warm') {
      newState.intimacy_band = 'warm';
    }
  }

  // Physical affection cues
  if (userInput.includes('kiss') || userInput.includes('hug') || 
      userInput.includes('hold') || userInput.includes('touch') ||
      rebeccaOutput.includes('leans') || rebeccaOutput.includes('brushes') ||
      rebeccaOutput.includes('reaches') || rebeccaOutput.includes('kisses')) {
    newEventTags.push('physical_intimacy');
    if (newState.comfort_with_context === 'safe') {
      newState.intimacy_band = 'intimate';
    }
  }

  // ============================================
  // DETECT TRUST-STRAINING EVENTS
  // ============================================

  // Harsh or dismissive input
  if (userInput.includes('shut up') || userInput.includes('whatever') ||
      userInput.includes('i don\'t care') || userInput.includes('leave me alone')) {
    newEventTags.push('dismissive_input');
    newState.trust_with_you = 'strained';
    newState.mood_label = 'annoyed';
    newState.comfort_with_context = 'slightly_on_guard';
  }

  // ============================================
  // DETECT STRESS RELIEF EVENTS
  // ============================================

  // Apology and reconciliation
  if (userInput.includes('sorry') || userInput.includes('apologize') ||
      userInput.includes('my fault') || userInput.includes('forgive')) {
    if (newState.trust_with_you === 'strained') {
      newState.trust_with_you = 'repairing';
      newState.mood_label = 'calm';
    }
    newEventTags.push('reconciliation');
  }

  // Supportive response
  if (userInput.includes('it\'s okay') || userInput.includes('i understand') ||
      userInput.includes('i\'m here') || userInput.includes('take your time')) {
    newEventTags.push('supportive_response');
    if (newState.mood_label === 'stressed' || newState.mood_label === 'vulnerable') {
      newState.cognitive_load = 'moderate';
    }
  }

  // ============================================
  // DETECT FEAR CHANNEL TRIGGERS
  // ============================================

  // Claustrophobic cues
  if (context.location.includes('bathroom') && userInput.includes('close') ||
      userInput.includes('lift') || userInput.includes('elevator') ||
      userInput.includes('confined') || userInput.includes('stuck')) {
    newEventTags.push('claustrophobic_trigger');
    newState.fear_channel = 'active';
    newState.claustrophobia_flag = 'subtle';
  }

  // ============================================
  // LOCATION-BASED CONTEXT UPDATES
  // ============================================

  // Update social context based on location
  if (context.location.includes('house:')) {
    newState.social_context = 'alone_together';
    newState.comfort_with_context = 'safe';
  } else if (context.location.includes('outside:park')) {
    newState.social_context = 'public_low_noise';
  } else if (context.location.includes('outside:cafe') || 
             context.location.includes('outside:shop')) {
    newState.social_context = 'public_busy';
    if (newState.mood_label === 'playful') {
      // Slightly more reserved in public
      newState.humour_channel = 'light';
    }
  }

  // ============================================
  // TIME-BASED ENERGY UPDATES
  // ============================================

  if (context.timeOfDay === 'late_night' || context.timeOfDay === 'early_morning') {
    if (newState.energy_label === 'high') {
      newState.energy_label = 'medium';
    } else if (newState.energy_label === 'medium') {
      newState.energy_label = 'low';
    }
    if (newState.energy_label === 'low') {
      newState.mood_label = 'tired';
    }
  }

  // ============================================
  // PLAYFULNESS DETECTION
  // ============================================

  if (userInput.includes('tease') || userInput.includes('joke') ||
      userInput.includes('play') || userInput.includes('silly') ||
      rebeccaOutput.includes('teasing') || rebeccaOutput.includes('winks') ||
      rebeccaOutput.includes('mischief')) {
    newEventTags.push('playful_moment');
    if (newState.comfort_with_context === 'safe') {
      newState.mood_label = 'playful';
      newState.humour_channel = 'playful';
    }
  }

  // Update recent event tags (keep last 10)
  newState.recent_event_tags = [...newEventTags, ...currentState.recent_event_tags].slice(0, 10);

  return newState;
}

// ============================================
// STATE SUMMARY GENERATION
// ============================================

/**
 * Generate a short textual summary of RebeccaState for prompt injection.
 * This is a "system note" that guides the expression engine without
 * being narrated or spoken directly.
 */
export function generateRebeccaStateSummary(state: RebeccaState): string {
  const parts: string[] = [];

  // Mood and energy
  parts.push(`mood: ${state.mood_label}`);
  parts.push(`energy: ${state.energy_label}`);

  // Trust and comfort
  parts.push(`trust with George: ${state.trust_with_you}`);
  parts.push(`comfort: ${state.comfort_with_context}`);

  // Intimacy and social context
  parts.push(`intimacy band: ${state.intimacy_band}`);
  parts.push(`social context: ${state.social_context}`);

  // Cognitive and humour
  parts.push(`cognitive load: ${state.cognitive_load}`);
  parts.push(`humour channel: ${state.humour_channel}`);

  // Fear and claustrophobia
  if (state.fear_channel !== 'idle') {
    parts.push(`fear channel: ${state.fear_channel}`);
  }
  if (state.claustrophobia_flag !== 'none') {
    parts.push(`claustrophobia: ${state.claustrophobia_flag}`);
  }

  // Physical state
  if (state.physical_state.length > 0) {
    parts.push(`physical: ${state.physical_state.join(', ')}`);
  }

  // Recent events (last 3)
  if (state.recent_event_tags.length > 0) {
    parts.push(`recent events: ${state.recent_event_tags.slice(0, 3).join(', ')}`);
  }

  return parts.join('; ');
}

/**
 * Generate the system note for Rebecca's Expression Engine.
 * This is injected as a system message to guide tone/rhythm/humour.
 */
export function generateExpressionEngineNote(state: RebeccaState): string {
  const summary = generateRebeccaStateSummary(state);
  
  return `System note for Rebecca's Expression Engine:
Rebecca currently feels/behaves in a way consistent with: ${summary}.
Adjust tone, humour, and rhythm accordingly, without explaining the state.`;
}

/**
 * Generate the system note for the Narrator.
 * This guides what observable behaviours to highlight.
 */
export function generateNarratorStateNote(state: RebeccaState): string {
  const summary = generateRebeccaStateSummary(state);
  
  return `System note (not to be narrated):
Rebecca's current state: ${summary}.
Use this only to decide which observable behaviours to highlight, not to state feelings as facts.`;
}

// ============================================
// STATE SERIALIZATION FOR STORAGE
// ============================================

/**
 * Serialize RebeccaState for database storage.
 */
export function serializeRebeccaState(state: RebeccaState): string {
  return JSON.stringify(state);
}

/**
 * Deserialize RebeccaState from database storage.
 * Returns initial state if parsing fails.
 */
export function deserializeRebeccaState(json: string | null): RebeccaState {
  if (!json) {
    return getInitialRebeccaState();
  }
  
  try {
    const parsed = JSON.parse(json);
    // Validate that all required fields exist
    if (parsed.mood_label && parsed.energy_label && parsed.trust_with_you) {
      return parsed as RebeccaState;
    }
    return getInitialRebeccaState();
  } catch {
    return getInitialRebeccaState();
  }
}
