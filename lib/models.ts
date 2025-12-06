// Type definitions for VirLife Stage 0.5

export interface User {
  id: string;
  created_at: Date;
}

export interface World {
  id: string;
  user_id: string;
  name: string;
  created_at: Date;
}

export interface WorldState {
  id: string;
  world_id: string;
  state: HydrationState;
  updated_at: Date;
}

export interface Message {
  id: string;
  world_id: string;
  role: 'user' | 'assistant';
  content: string;
  created_at: Date;
}

// ============================================
// STAGE 0.5: LOCATIONS
// ============================================

// House locations (indoor)
export type HouseLocation = 
  | 'house:kitchen'
  | 'house:lounge'
  | 'house:bedroom'
  | 'house:hallway'
  | 'house:bathroom'
  | 'house:garden';

// Outside locations (loose, semantic)
export type OutsideLocation =
  | 'outside:cafe'
  | 'outside:park'
  | 'outside:street'
  | 'outside:shop';

export type Location = HouseLocation | OutsideLocation;

// House layout graph: which rooms connect to which
export const HOUSE_CONNECTIONS: Record<HouseLocation, HouseLocation[]> = {
  'house:kitchen': ['house:hallway', 'house:garden'],
  'house:lounge': ['house:hallway'],
  'house:bedroom': ['house:hallway', 'house:bathroom'],
  'house:hallway': ['house:kitchen', 'house:lounge', 'house:bedroom', 'house:bathroom'],
  'house:bathroom': ['house:hallway', 'house:bedroom'],
  'house:garden': ['house:kitchen'],
};

// ============================================
// STAGE 0.5: TIME OF DAY
// ============================================

export type TimeOfDay = 
  | 'early_morning'   // ~6-9am
  | 'late_morning'    // ~9am-12pm
  | 'afternoon'       // ~12-5pm
  | 'evening'         // ~5-9pm
  | 'late_night';     // ~9pm-6am

// ============================================
// STAGE 0.5: REBECCA'S INTERNAL STATE (LIGHT)
// ============================================

export type EnergyLevel = 'rested' | 'tired';
export type OpennessLevel = 'open' | 'reserved';
export type FrictionLevel = 'calm' | 'slightly_tense';

export interface RebeccaInternalState {
  energy: EnergyLevel;
  openness: OpennessLevel;
  friction: FrictionLevel;
}

// ============================================
// STAGE 0.5: CURRENT ACTIVITY
// ============================================

export interface CurrentActivity {
  description: string;      // e.g., "making tea", "watching a film", "walking"
  started_at?: string;      // optional timestamp when activity started
}

// ============================================
// HYDRATION STATE (STAGE 0.5 EXTENDED)
// ============================================

export interface HydrationState {
  // Time tracking
  time: {
    current_datetime: string;
    days_into_offgrid: number;
    time_of_day: TimeOfDay;
  };
  
  // Location tracking
  locations: {
    george: Location;
    rebecca: Location;
  };
  
  // Current activities
  activities: {
    george: CurrentActivity | null;
    rebecca: CurrentActivity | null;
    shared: CurrentActivity | null;  // activity they're doing together
  };
  
  // Rebecca's internal state (not exposed to user)
  rebecca_internal: RebeccaInternalState;
  
  // NEW: Rebecca Expression Engine state (serialized JSON string)
  // This is the full semantic state from RebeccaStateMachine.ts
  // Stores: mood_label, energy_label, trust_with_you, comfort_with_context,
  //         intimacy_band, social_context, cognitive_load, humour_channel,
  //         recent_event_tags, physical_state, fear_channel, claustrophobia_flag
  rebecca_state?: string;
  
  // Relationship dynamics
  relationship: {
    overall_tone: string;
    recent_key_moments: string[];
  };
  
  // Ongoing narrative threads
  threads: string[];
  
  // Accumulated facts
  facts: {
    shared: string[];
    rebecca_about_george: string[];
  };
  
  // Recent places visited (semantic, for continuity)
  recent_places: Location[];
}

// API request/response types
export interface ChatRequest {
  userId?: string;
  worldId?: string;
  message: string;
}

export interface ChatResponse {
  userId: string;
  worldId: string;
  worldOutput: string;
}

export interface StateResponse {
  userId: string;
  worldId: string;
  messages: Array<{
    role: 'user' | 'assistant';
    content: string;
    created_at: string;
  }>;
  worldState: HydrationState;
}
