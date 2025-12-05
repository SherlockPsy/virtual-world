// Type definitions for VirLife Stage 0

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

// Hydration JSON schema (exact structure as per spec)
export interface HydrationState {
  time: {
    current_datetime: string;
    days_into_offgrid: number;
  };
  locations: {
    george: string;
    rebecca: string;
  };
  relationship: {
    overall_tone: string;
    recent_key_moments: string[];
  };
  threads: string[];
  facts: {
    shared: string[];
    rebecca_about_george: string[];
  };
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
