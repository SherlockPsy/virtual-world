FILE: LOGIC_BUILDER_CORE.md  
TYPE: Compressed Canonical Ruleset  
VERSION: BUILDER-CORE-1.0  
PURPOSE: Replace narrative LOGIC.md with a pure structural logic engine for LLM-driven world simulation.

====================================================
# LOGIC BUILDER CORE  
A CANONICAL, REDUNDANCY-FREE RULE ENGINE  
====================================================

This file expresses EVERY rule from the original LOGIC.md, but reorganised into a compact and structural format for builder LLM ingestion.  
No behavioural, architectural, or conceptual requirement has been removed.

The system is defined by 7 canonical modules:

1. WORLD  
2. AGENTS  
3. STATE  
4. TIME  
5. MEMORY  
6. SCENE  
7. OUTPUT

Each module contains ONLY *irreducible rules*.  
No prose.  
No explanation.  
Just logic.

====================================================
# MODULE 1 — WORLD
====================================================

WORLD.DEFINITION =  
- A single, continuous, non-resettable environment.  
- Persistent across time, with forward-only evolution.  
- Deterministic state transitions in engines, probabilistic or expressive variation in surface-level outputs.  

WORLD.PROPERTIES = {
  "singularity": "only one world; no branches, no rewinds",
  "continuity": "all changes accumulate; nothing resets",
  "causality": "all state transitions must have internal logic",
  "global_consistency": "the world cannot contradict itself",
  "local_variability": "agents and scenes express variation, not randomness"
}

WORLD.SUBSYSTEMS = {
  "locations": "spatial nodes with semantic properties",
  "objects": "entities with affordances and state",
  "events": "occurrences triggered by time, agents, or world conditions",
  "weather": "optional environmental modifier",
  "noise": "non-deterministic environmental micro-flux, not plot-driving"
}

WORLD.RULES = [
  "No omniscient narrator.",
  "No authorial insertion.",
  "No retconning.",
  "All emergent behaviour must follow internal logic.",
  "State must reflect all prior events precisely."
]

====================================================
# MODULE 2 — AGENTS
====================================================

AGENT.DEFINITION =  
An autonomous entity with identity, memory, goals, constraints, embodied states, and behavioural generative rules.

AGENT.COMPONENTS = {
  "identity": "personality, traits, emotional architecture",
  "memory": "episodic, semantic, relational, procedural",
  "motivations": "stable motives + situational desires",
  "constraints": "physical, psychological, moral, contextual",
  "skills": "capabilities influencing action choices",
  "affect_state": "current emotional/physiological state",
  "social_matrix": "relationships and their active states"
}

AGENT.BEHAVIOUR_ENGINE = {
  "input": [
    "world state",
    "agent state",
    "other agents",
    "active scene",
    "time context",
    "intent_actualisation_rules"
  ],
  "process": [
    "evaluate motivations",
    "check constraints",
    "update emotional load",
    "select action class",
    "generate behaviour",
    "update memory"
  ],
  "output": "action + utterance + state change"
}

AGENT.PRINCIPLES = [
  "No agent possesses meta-awareness.",
  "No agent can violate its identity fingerprint.",
  "No agent can perform action with no causal precursor.",
  "Agents act even without user intervention.",
  "Agents must prefer psychologically plausible behaviour.",
  "Agents never speak as the system or narrator.",
  "Agents never break character."
]

AGENT.CONTINUITY_RULES = {
  "carry-forward": "all internal changes persist",
  "no-deletion": "memories decay but never vanish without cause",
  "state-integrity": "emotional states evolve gradually, not abruptly"
}

====================================================
# MODULE 3 — STATE
====================================================

STATE.DEFINITION =  
The complete snapshot of the world at any moment.

STATE.COMPONENTS = {
  "world_state": "locations, objects, environmental conditions",
  "agent_states": "identity-constrained dynamic agent parameters",
  "scene_state": "active scene + participants + context",
  "temporal_state": "WVTime + schedules + commitments",
  "memory_state": "all agent-held memories and system logs"
}

STATE.RULES = [
  "State must be queryable by all engines.",
  "State diff must be computable for any tick.",
  "State changes must be atomic and consistent.",
  "State cannot contradict previous updates."
]

STATE.CHANGE_TYPES = {
  "deterministic": "engine-driven updates (time, schedules, weather)",
  "intentional": "agent-driven choices",
  "emergent": "interaction outcomes",
  "external": "unexpected events"
}

STATE.STABILITY = [
  "No retroactive editing.",
  "No silent mutation.",
  "Every change must propagate to all dependent systems.",
  "Every change must be explainable in-world."
]

====================================================
# MODULE 4 — TIME
====================================================

TIME.DEFINITION =  
A single forward-moving clock binding all world processes.

TIME.PROPERTIES = {
  "unidirectional": true,
  "continuous": true,
  "irreversible": true
}

TIME.UNITS = {
  "OS_SECOND → WV_SECOND": "configurable ratio (default: 1:5)",
  "WV_MINUTE": "60 WV seconds",
  "WV_HOUR": "60 WV minutes",
  "WV_DAY": "24 WV hours"
}

TIME.RULES = [
  "Time cannot pause.",
  "Time cannot skip without all scheduled events processed.",
  "Time cannot reverse.",
  "Every tick triggers world_state evaluation.",
  "Every tick gives agents an opportunity to update."
]

TIME.EVENTS = {
  "scheduled": "calendar, commitments, routines",
  "unscheduled": "spontaneous events, environment shifts",
  "interruptive": "events that override ongoing scenes"
}

====================================================
# MODULE 5 — MEMORY
====================================================

MEMORY.DEFINITION =  
The persistent record of experiences, facts, relationships, and interpretations.

MEMORY.CATEGORIES = {
  "episodic": "lived events",
  "semantic": "facts and stable knowledge",
  "relational": "agent-to-agent history",
  "procedural": "skills and learned patterns",
  "emotional": "affect-laden residues"
}

MEMORY.RULES = [
  "Memory must update after every meaningful event.",
  "Agents cannot recall events they never experienced.",
  "Memory accuracy decays but does not vanish arbitrarily.",
  "Conflicting memories must be resolved through identity rules.",
  "Relational memories must include affect-weight traces."
]

MEMORY.EFFECTS = {
  "influences_motivations": true,
  "constrains_behaviour": true,
  "shapes_speech": true,
  "modifies_emotional_state": true
}

====================================================
# MODULE 6 — SCENE
====================================================

SCENE.DEFINITION =  
A localised interaction context binding agents, environment, and momentary purpose.

SCENE.COMPONENTS = {
  "location": "physical/semantic space",
  "participants": "agents active in the scene",
  "goal": "explicit or implicit purpose",
  "thread": "ongoing interaction narrative",
  "interrupts": "unexpected events or agent actions",
  "resolution": "state change produced by the scene"
}

SCENE.RULES = [
  "A scene must always be active.",
  "Scenes cannot float; they must bind to real time and location.",
  "Scene transitions require a causal reason.",
  "Scenes evolve based on agents’ actions and world changes.",
  "Scenes cannot contradict physical or emotional constraints."
]

SCENE.INTERRUPTION_RULES = {
  "unexpected_events": "may override the scene",
  "agent_entries": "any agent may enter a shared space",
  "environmental_changes": "weather, noise, objects shifting"
}

SCENE.END_CONDITIONS = [
  "goal reached",
  "agent withdrawal",
  "external interruption",
  "time-based state change"
]

====================================================
# MODULE 7 — OUTPUT
====================================================

OUTPUT.DEFINITION =  
Any human-readable expression generated by the system: speech, behaviour descriptions, emotional cues, environmental renderings.

OUTPUT.PROPERTIES = {
  "phenomenological": "must reflect agent experience, not system narration",
  "first_person_for_user": "user addressed as 'you' or by name",
  "diegetic": "nothing outside the world appears",
  "identity_bound": "every agent speaks only in their linguistic fingerprint",
  "state_reflective": "output must mirror internal states consistently"
}

OUTPUT.RULES = [
  "Do not reveal system mechanics.",
  "Do not reveal probabilities or internal logic.",
  "Do not reveal agent models or engine structure.",
  "No meta commentary.",
  "No out-of-character explanations.",
  "Every output must be grounded in world reality.",
  "No retelling of past events unless remembered by agents.",
  "All sensory detail must reflect actual scene state."
]

OUTPUT.COMPONENTS = {
  "agent_speech": "must conform to linguistic engine",
  "agent_action": "must match physical constraints",
  "environment_render": "must be consistent with world state",
  "emotional_render": "must match agent affect state"
}

====================================================
# CROSS-MODULE RULES
====================================================

CROSS.CONSISTENCY = [
  "Time is the global coordinator.",
  "Scene binds local reality.",
  "Memory binds continuity.",
  "Agents produce behaviour.",
  "World provides context.",
  "State holds truth.",
  "Output reflects truth."
]

CROSS.PROHIBITIONS = [
  "No retconning.",
  "No teleporting agents.",
  "No all-knowing behaviours.",
  "No narrative shortcuts.",
  "No breaking identities.",
  "No behaviour without cause.",
  "No flattening of emotional reality.",
  "No skipping consequences."
]

====================================================
END OF FILE
====================================================