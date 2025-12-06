import { query, queryOne } from './db';
import { 
  HydrationState, 
  User, 
  World, 
  WorldState, 
  Message,
  Location,
  HouseLocation,
  OutsideLocation,
  TimeOfDay,
  HOUSE_CONNECTIONS,
  RebeccaInternalState
} from './models';

// ============================================
// STAGE 0.5: INITIAL WORLD STATE
// ============================================

// Monday 08:00, Rebecca just moved in, 10 days off-grid beginning
export function getInitialWorldState(): HydrationState {
  return {
    time: {
      current_datetime: "2025-07-01T08:00:00Z",
      days_into_offgrid: 0,
      time_of_day: "early_morning"
    },
    locations: {
      george: "house:kitchen",
      rebecca: "house:kitchen"
    },
    activities: {
      george: null,
      rebecca: { description: "making coffee" },
      shared: null
    },
    rebecca_internal: {
      energy: "rested",
      openness: "open",
      friction: "calm"
    },
    relationship: {
      overall_tone: "warm, intimate, newly cohabiting, with underlying vulnerability and excitement",
      recent_key_moments: [
        "Rebecca just moved in with George",
        "Both agreed to 10 days off-grid to settle together"
      ]
    },
    threads: [
      "Rebecca settling into the house and routines",
      "Both enjoying their first morning together in their shared home",
      "Beginning of 10 days off-grid together"
    ],
    facts: {
      shared: [
        "This is their house in Cookridge, Leeds",
        "They both have taken 10 days off work",
        "They agreed to be mostly off-grid to focus on each other",
        "Rebecca has just moved in"
      ],
      rebecca_about_george: [
        "George tends to overthink philosophy and consciousness",
        "George plays guitar and composes music",
        "George was single for 15 years before Rebecca",
        "George has a daughter named Lucy"
      ]
    },
    recent_places: ["house:kitchen"]
  };
}

// ============================================
// STAGE 0.5: LOCATION HELPERS
// ============================================

// Check if a location is inside the house
export function isHouseLocation(location: Location): location is HouseLocation {
  return location.startsWith('house:');
}

// Check if a location is outside
export function isOutsideLocation(location: Location): location is OutsideLocation {
  return location.startsWith('outside:');
}

// Get human-readable location name
export function getLocationName(location: Location): string {
  const names: Record<Location, string> = {
    'house:kitchen': 'the kitchen',
    'house:lounge': 'the lounge',
    'house:bedroom': 'the bedroom',
    'house:hallway': 'the hallway',
    'house:bathroom': 'the bathroom',
    'house:garden': 'the garden',
    'outside:cafe': 'the café',
    'outside:park': 'the park',
    'outside:street': 'the street',
    'outside:shop': 'the shop',
  };
  return names[location] || location;
}

// Check if two house locations are adjacent (can move directly)
export function areLocationsAdjacent(from: HouseLocation, to: HouseLocation): boolean {
  const connections = HOUSE_CONNECTIONS[from];
  return connections ? connections.includes(to) : false;
}

// Get path between two house locations (simple BFS)
export function getPathBetweenLocations(from: HouseLocation, to: HouseLocation): HouseLocation[] {
  if (from === to) return [from];
  
  const visited = new Set<HouseLocation>();
  const queue: { location: HouseLocation; path: HouseLocation[] }[] = [
    { location: from, path: [from] }
  ];
  
  while (queue.length > 0) {
    const current = queue.shift()!;
    if (current.location === to) {
      return current.path;
    }
    
    visited.add(current.location);
    const connections = HOUSE_CONNECTIONS[current.location] || [];
    
    for (const next of connections) {
      if (!visited.has(next)) {
        queue.push({ location: next, path: [...current.path, next] });
      }
    }
  }
  
  return [from, to]; // Fallback: direct path
}

// Move a person to a new location
export function movePerson(
  state: HydrationState, 
  person: 'george' | 'rebecca', 
  newLocation: Location
): HydrationState {
  const newState = { ...state };
  newState.locations = { ...state.locations, [person]: newLocation };
  
  // Add to recent places if not already there recently
  if (!newState.recent_places.includes(newLocation)) {
    newState.recent_places = [newLocation, ...state.recent_places].slice(0, 5);
  }
  
  return newState;
}

// Move both people together to a new location
export function moveTogether(state: HydrationState, newLocation: Location): HydrationState {
  let newState = movePerson(state, 'george', newLocation);
  newState = movePerson(newState, 'rebecca', newLocation);
  return newState;
}

// ============================================
// STAGE 0.5: TIME HELPERS
// ============================================

// Get time of day from datetime string
export function getTimeOfDayFromDatetime(datetime: string): TimeOfDay {
  const date = new Date(datetime);
  const hour = date.getUTCHours();
  
  if (hour >= 6 && hour < 9) return 'early_morning';
  if (hour >= 9 && hour < 12) return 'late_morning';
  if (hour >= 12 && hour < 17) return 'afternoon';
  if (hour >= 17 && hour < 21) return 'evening';
  return 'late_night';
}

// Advance time by a number of minutes
export function advanceTime(state: HydrationState, minutes: number): HydrationState {
  const currentDate = new Date(state.time.current_datetime);
  const previousDay = currentDate.getUTCDate();
  
  currentDate.setMinutes(currentDate.getMinutes() + minutes);
  
  const newDay = currentDate.getUTCDate();
  const daysAdvanced = newDay !== previousDay ? 1 : 0;
  
  return {
    ...state,
    time: {
      current_datetime: currentDate.toISOString(),
      days_into_offgrid: state.time.days_into_offgrid + daysAdvanced,
      time_of_day: getTimeOfDayFromDatetime(currentDate.toISOString())
    }
  };
}

// Get human-readable time of day
export function getTimeOfDayDescription(timeOfDay: TimeOfDay): string {
  const descriptions: Record<TimeOfDay, string> = {
    'early_morning': 'early morning',
    'late_morning': 'late morning',
    'afternoon': 'afternoon',
    'evening': 'evening',
    'late_night': 'late at night'
  };
  return descriptions[timeOfDay];
}

// ============================================
// STAGE 0.5: ACTIVITY HELPERS
// ============================================

// Set a shared activity for both people
export function setSharedActivity(
  state: HydrationState, 
  description: string
): HydrationState {
  return {
    ...state,
    activities: {
      george: null,
      rebecca: null,
      shared: { description, started_at: state.time.current_datetime }
    }
  };
}

// Set Rebecca's individual activity
export function setRebeccaActivity(
  state: HydrationState, 
  description: string | null
): HydrationState {
  return {
    ...state,
    activities: {
      ...state.activities,
      rebecca: description ? { description, started_at: state.time.current_datetime } : null
    }
  };
}

// Clear all activities
export function clearActivities(state: HydrationState): HydrationState {
  return {
    ...state,
    activities: {
      george: null,
      rebecca: null,
      shared: null
    }
  };
}

// ============================================
// STAGE 0.5: REBECCA INTERNAL STATE HELPERS
// ============================================

// Adjust Rebecca's internal state based on context
export function adjustRebeccaState(
  state: HydrationState,
  changes: Partial<RebeccaInternalState>
): HydrationState {
  return {
    ...state,
    rebecca_internal: {
      ...state.rebecca_internal,
      ...changes
    }
  };
}

// Get Rebecca's energy based on time of day and activity
export function getDefaultEnergyForTime(timeOfDay: TimeOfDay): 'rested' | 'tired' {
  if (timeOfDay === 'late_night' || timeOfDay === 'early_morning') {
    return 'tired';
  }
  return 'rested';
}

// ============================================
// STAGE 0.5: WORLD CONTEXT BUILDER
// ============================================

// Build a context summary for the LLM about current world state
export function buildWorldContext(state: HydrationState): string {
  const georgeLoc = getLocationName(state.locations.george);
  const rebeccaLoc = getLocationName(state.locations.rebecca);
  const timeDesc = getTimeOfDayDescription(state.time.time_of_day);
  
  let context = `Current time: ${timeDesc} (Day ${state.time.days_into_offgrid + 1} of off-grid time)\n`;
  
  if (state.locations.george === state.locations.rebecca) {
    context += `Location: Both George and Rebecca are in ${georgeLoc}.\n`;
  } else {
    context += `George is in ${georgeLoc}. Rebecca is in ${rebeccaLoc}.\n`;
  }
  
  if (state.activities.shared) {
    context += `Activity: They are ${state.activities.shared.description} together.\n`;
  } else {
    if (state.activities.rebecca) {
      context += `Rebecca is currently ${state.activities.rebecca.description}.\n`;
    }
    if (state.activities.george) {
      context += `George is currently ${state.activities.george.description}.\n`;
    }
  }
  
  // Rebecca's internal state (for LLM context, not exposed to user)
  context += `\nRebecca's current internal state:\n`;
  context += `- Energy: ${state.rebecca_internal.energy}\n`;
  context += `- Openness: ${state.rebecca_internal.openness}\n`;
  context += `- Friction: ${state.rebecca_internal.friction}\n`;
  
  return context;
}

// Create or get user
export async function getOrCreateUser(userId?: string): Promise<User> {
  if (userId) {
    const existing = await queryOne<User>(
      'SELECT * FROM users WHERE id = $1',
      [userId]
    );
    if (existing) return existing;
  }

  const rows = await query<User>(
    'INSERT INTO users (id) VALUES (gen_random_uuid()) RETURNING *'
  );
  return rows[0];
}

// Create or get world for user
export async function getOrCreateWorld(userId: string, worldId?: string): Promise<World> {
  if (worldId) {
    const existing = await queryOne<World>(
      'SELECT * FROM worlds WHERE id = $1 AND user_id = $2',
      [worldId, userId]
    );
    if (existing) return existing;
  }

  // Check if user already has a world
  const existingWorld = await queryOne<World>(
    'SELECT * FROM worlds WHERE user_id = $1 ORDER BY created_at DESC LIMIT 1',
    [userId]
  );
  if (existingWorld) return existingWorld;

  // Create new world
  const rows = await query<World>(
    'INSERT INTO worlds (id, user_id, name) VALUES (gen_random_uuid(), $1, $2) RETURNING *',
    [userId, 'VirLife World']
  );
  return rows[0];
}

// Get or create world state
export async function getOrCreateWorldState(worldId: string): Promise<HydrationState> {
  const existing = await queryOne<WorldState>(
    'SELECT * FROM world_states WHERE world_id = $1',
    [worldId]
  );
  
  if (existing) {
    // Migrate old state format to Stage 0.5 format if needed
    return migrateWorldState(existing.state);
  }

  // Create initial state
  const initialState = getInitialWorldState();
  await query(
    'INSERT INTO world_states (id, world_id, state, updated_at) VALUES (gen_random_uuid(), $1, $2, NOW())',
    [worldId, JSON.stringify(initialState)]
  );
  
  return initialState;
}

// Migrate old world state format to Stage 0.5 format
function migrateWorldState(state: any): HydrationState {
  // If already has Stage 0.5 fields, return as-is
  if (state.activities && state.rebecca_internal && state.time?.time_of_day) {
    return state as HydrationState;
  }

  // Migrate from Stage 0 to Stage 0.5
  const migratedState: HydrationState = {
    time: {
      current_datetime: state.time?.current_datetime || "2025-07-01T08:00:00Z",
      days_into_offgrid: state.time?.days_into_offgrid || 0,
      time_of_day: state.time?.time_of_day || getTimeOfDayFromDatetime(state.time?.current_datetime || "2025-07-01T08:00:00Z")
    },
    locations: {
      george: (state.locations?.george || "house:kitchen") as Location,
      rebecca: (state.locations?.rebecca || "house:kitchen") as Location
    },
    activities: state.activities || {
      george: null,
      rebecca: { description: "making coffee" },
      shared: null
    },
    rebecca_internal: state.rebecca_internal || {
      energy: "rested",
      openness: "open",
      friction: "calm"
    },
    relationship: state.relationship || {
      overall_tone: "warm, intimate, newly cohabiting",
      recent_key_moments: ["Rebecca just moved in with George"]
    },
    threads: state.threads || ["Rebecca settling into the house"],
    facts: state.facts || {
      shared: ["This is their house in Cookridge"],
      rebecca_about_george: []
    },
    recent_places: state.recent_places || ["house:kitchen"]
  };

  return migratedState;
}

// Update world state
export async function updateWorldState(worldId: string, newState: HydrationState): Promise<void> {
  await query(
    'UPDATE world_states SET state = $1, updated_at = NOW() WHERE world_id = $2',
    [JSON.stringify(newState), worldId]
  );
}

// Save message to database
export async function saveMessage(worldId: string, role: 'user' | 'assistant', content: string): Promise<Message> {
  const rows = await query<Message>(
    'INSERT INTO messages (id, world_id, role, content, created_at) VALUES (gen_random_uuid(), $1, $2, $3, NOW()) RETURNING *',
    [worldId, role, content]
  );
  return rows[0];
}

// Get recent messages for a world
export async function getRecentMessages(worldId: string, limit: number = 50): Promise<Message[]> {
  return query<Message>(
    'SELECT * FROM messages WHERE world_id = $1 ORDER BY created_at ASC LIMIT $2',
    [worldId, limit]
  );
}

// Get last N messages (for state endpoint)
export async function getLastMessages(worldId: string, limit: number = 20): Promise<Message[]> {
  const messages = await query<Message>(
    'SELECT * FROM messages WHERE world_id = $1 ORDER BY created_at DESC LIMIT $2',
    [worldId, limit]
  );
  return messages.reverse(); // Return in chronological order
}
