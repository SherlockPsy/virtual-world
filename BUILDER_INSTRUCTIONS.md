# BUILDER INTEGRATION SPECIFICATION  
# For integrating:  
#   • Rebecca_Fingerprint (Digital Twin — Option C)  
#   • Rebecca_Expression_Engine (Directive Mode)  
#   • REBECCA_MODULATION_MAP (Semantic State + Narrator Coordination)  
# Into the VirLife Stage-0 system

=====================================================================
SECTION 0 — PURPOSE OF THIS DOCUMENT
=====================================================================

This file tells the LLM builder EXACTLY how to integrate the Rebecca
Expression Engine into the existing VirLife codebase.

It defines:
    • what files must be created or updated,
    • how prompts must be assembled,
    • how the engine, narrator, and world-state modules interact,
    • how Rebecca’s semantic state is represented and updated,
    • how to prevent drift and ensure Rebecca is expressed correctly,
    • how to route inputs/outputs through the existing system,
    • how to enforce psychological and linguistic constraints at runtime.

This is NOT optional guidance.
These are REQUIRED integration steps.

=====================================================================
SECTION 1 — HIGH-LEVEL ARCHITECTURE: WHERE THE ENGINE FITS
=====================================================================

VirLife Stage 0 contains these major components:

1. SceneService  
2. WorldStateService  
3. LLM wrapper (`/lib/llm.ts`)  
4. API route (`/app/api/generate`)  
5. Narrator prompt (system-level)  
6. Character-specific profiles  
7. Character-specific expression engines  
8. Semantic state modules (e.g. Rebecca’s modulation map / state)

Rebecca_Expression_Engine becomes part of:
    • The LLM prompt ASSEMBLY PIPELINE  
    NOT of the narrator.  
    NOT of the world engine.  
    NOT of the scene orchestrator.

It is a **character expression module**.

The narrator describes the world.
The engine describes Rebecca.
The engine does NOT describe the world.

The REBECCA_MODULATION_MAP defines how Rebecca’s semantic state
(RebeccaState) evolves over time and how that state modulates:
    • her expression, and
    • what the narrator chooses to show.

=====================================================================
SECTION 2 — FILES THE BUILDER MUST CREATE OR UPDATE
=====================================================================

The builder MUST ensure these files exist:

1. `/prompts/REBECCA_FINGERPRINT.md`  
   → Contains the full fingerprint (the massive digital-twin profile).
      This is the canonical psychological + behavioural spec.

2. `/prompts/REBECCA_EXPRESSION_ENGINE.md`  
   → Contains ONLY the directive engine for how Rebecca speaks and behaves,
     assuming the fingerprint as ground truth.

3. `/prompts/REBECCA_MODULATION_MAP.md`  
   → Contains the semantic state model (RebeccaState) and modulation rules:
       • how state is represented (mood, energy, trust, etc.),
       • how it updates after events,
       • how it informs both:
            – Rebecca’s expression, and
            – narrator’s focus/level of detail.
     This file MUST be treated as a normative specification for her state.

4. `/prompts/Narrator_System_Prompt.md`  
   → Already exists; must NOT be overwritten, but must be updated so
     it CLEANLY references:
        • Rebecca’s state (from REBECCA_MODULATION_MAP),
        • the fact that the narrator uses state ONLY to decide
          what observable behaviours to highlight, and NEVER to guess
          your inner thoughts or state.

5. `/lib/characters/rebecca.ts`  
   → NEW. A module that:
        • Loads the fingerprint,
        • Loads the expression engine,
        • Loads / uses the modulation map specification,
        • Exposes a single function: `generateRebeccaOutput(context)`.

6. `/lib/RebeccaStateMachine.ts` (or equivalent name)  
   → NEW. A module that:
        • Implements the RebeccaState structure as defined in
          `REBECCA_MODULATION_MAP.md`,
        • Updates RebeccaState after each turn based on:
             – your input,
             – her output,
             – recent event tags,
             – scene transitions,
        • Provides a short textual summary of state for prompt injection.

7. `/lib/PromptAssembler.ts`  
   → NEW OR UPDATED.  
     This module is responsible for assembling:
        • narrator prompt,
        • world ledger snippet,
        • scene context,
        • Rebecca state summary (from modulation map),
        • Rebecca fingerprint,
        • Rebecca expression engine,
        • user input.

8. `/app/api/generate/route.ts` (or JS equivalent)  
   → Must be updated to:
        • call the PromptAssembler,
        • send FULL structured prompt to `llm.complete()`,
        • extract Rebecca’s output from the LLM response.

=====================================================================
SECTION 3 — ABSOLUTE RULES THE BUILDER MUST FOLLOW
=====================================================================

RULE 1 — The fingerprint MUST ALWAYS be included when Rebecca is present.  
RULE 2 — The expression engine MUST ALWAYS be included when Rebecca must speak.  
RULE 3 — The modulation map MUST ALWAYS define the structure and update of
          Rebecca’s internal semantic state (RebeccaState).  
RULE 4 — The narrator MUST NEVER be mixed with the expression engine.  
RULE 5 — The LLM MUST NEVER decide Rebecca’s identity — it is fully defined.  
RULE 6 — The builder must enforce modularity:
            narrator → world description  
            engine → Rebecca’s voice  
            state machine / modulation map → how context and state modulate both  
            user → conversational partner  
            world engine → determines what happens next  

RULE 7 — The engine file must be injected as a SYSTEM or TOOL prompt segment,
          NOT as user text.

RULE 8 — No part of the fingerprint or modulation map may be altered,
          compressed, abbreviated, omitted, or paraphrased by the builder.
          If shorter forms are needed, they MUST be generated from these
          specs, not invented separately.

=====================================================================
SECTION 4 — PROMPT ASSEMBLY MODEL (THE BUILDER MUST IMPLEMENT THIS)
=====================================================================

When generating Rebecca’s output, the builder MUST combine prompts
in the following STRICT order:

1. SYSTEM: Narrator System Prompt  
2. SYSTEM: Rebecca Fingerprint  
3. SYSTEM: Rebecca Expression Engine  
4. SYSTEM: Rebecca State Summary
          (short textual summary generated from RebeccaState as defined
           in REBECCA_MODULATION_MAP.md. This is a “system note”, not
           something that should be narrated or spoken directly.)  
5. SYSTEM: World Ledger (recent state slice)  
6. SYSTEM: Scene Summary  
7. USER:   User input (“George's line or action”)  
8. ASSISTANT: Rebecca’s output ONLY (no narration)

These MUST be isolated in the LLM call and separated clearly.

The builder MUST NOT let prompts bleed into each other.

=====================================================================
SECTION 5 — HOW TO ENFORCE REBECCA’S VOICE MODULE
=====================================================================

When Rebecca speaks, the LLM call MUST be constrained by:

    • Rebecca_Fingerprint  
    • Rebecca_Expression_Engine  
    • Rebecca State Summary (from the modulation map)

The builder MUST wrap Rebecca’s speaking task as:

> You are Rebecca Ferguson’s Expression Engine.  
> Generate ONLY what Rebecca says and does.  
> Do NOT describe the world.  
> Do NOT describe other agents.  
> Do NOT produce narration.  
> Follow the fingerprint, modulation map, and expression engine exactly.

This MUST be added to the prompt before sending to the LLM.

=====================================================================
SECTION 6 — MODIFYING SceneService
=====================================================================

SceneService MUST be updated so that:

1. When Rebecca is the responding agent, SceneService requests:
       `characters/rebecca.generateOutput(context)`

2. It does NOT call the narrator for Rebecca’s dialogue.

3. It ONLY calls the narrator when describing:
       • scene changes,
       • environmental updates,
       • other agents’ behaviours,
       • the world around you.

4. SceneService MUST ensure Rebecca’s module receives:
       • your last message,
       • the scene location,
       • world ledger slice,
       • Rebecca’s internal state object (RebeccaState, as defined in
         `REBECCA_MODULATION_MAP.md`),
       • any relevant recent event tags,
       • the narrator’s scene summary.

=====================================================================
SECTION 7 — MODIFYING /lib/llm.ts
=====================================================================

The builder MUST:

1. Add a helper function:

```ts
export async function completeRebeccaExpression(prompt) {
  return complete({
    model: "gpt-5.1",
    messages: prompt,
    maxTokens: 500,
    temperature: 0.85,
    top_p: 1
  });
}

	2.	The function MUST:
• not use narrator temperature,
• not use system temperature,
• allow expressive variety.
	3.	It MUST NEVER override the fingerprint, modulation map, or engine.

=====================================================================
SECTION 8 — HOW THE BUILDER MUST HANDLE EXPRESSION ENGINE OUTPUT

Rebecca’s output MUST be:
• ONLY her dialogue,
• optionally with micro-behaviours,
• formatted naturally,
• no narration,
• no world description,
• no scene framing.

The builder MUST enforce:

If LLM outputs narration → strip and retry with stricter instruction.
If LLM outputs other characters → strip and retry.
If LLM outputs analysis → error, retry.
If LLM outputs inconsistent voice → include fingerprint, modulation map
and engine again and retry.

=====================================================================
SECTION 9 — PROTECTING AGAINST DRIFT

The builder MUST add these safeguards:
	1.	Every LLM call for Rebecca MUST include the fingerprint + engine +
state summary derived from the modulation map.
	2.	Fingerprint and modulation map MUST never be compressed or summarised
by the builder directly.
	3.	The engine MUST always be loaded from disk verbatim.
	4.	The builder MUST include anti-drift metadata:
“Rebecca must remain consistent with the fingerprint,
modulation map, and expression engine.
Do not soften, simplify, or alter her voice or core traits.”
	5.	If the model begins drifting, the builder MUST:
• reload the engine, fingerprint, and modulation map,
• issue a self-correction prompt:
“Correct the previous output to align with the fingerprint,
modulation map, and expression engine.”

=====================================================================
SECTION 10 — INTERNAL STATE FLOW (MANDATORY)

Rebecca’s internal state (RebeccaState) MUST be updated AFTER each
interaction, according to the rules in REBECCA_MODULATION_MAP.md.

The builder MUST update, semantically (no numbers):

• mood_label,
• energy_label,
• comfort_with_context,
• trust_with_you,
• intimacy_band,
• social_context,
• cognitive_load,
• humour_channel,
• recent_event_tags,
• physical_state,
• fear_channel,
• claustrophobia_flag.

This state is fed BACK into the next Rebecca expression call AND into the
narrator (as a non-narrated system note that only affects what details
the narrator chooses to show).

=====================================================================
SECTION 11 — FULL RUNTIME PIPELINE (MANDATORY)

The builder MUST implement the following pipeline:
	1.	User says something.
	2.	SceneService determines:
• which agent responds,
• whether narrator or Rebecca is speaking.
	3.	If Rebecca → go to Rebecca pipeline:
a. Use RebeccaStateMachine to:
• load current RebeccaState,
• update RebeccaState from last turn if needed.
b. Collect:
• Rebecca_Fingerprint,
• Rebecca_Expression_Engine,
• short Rebecca State Summary (from RebeccaState),
• world ledger slice,
• scene context,
• user message.
c. Assemble prompt EXACTLY as specified in SECTION 4.
d. Call:
completeRebeccaExpression()
e. Parse output:
• extract ONLY her spoken line + micro-behaviour.
f. Use RebeccaStateMachine to update RebeccaState based on:
• your latest input,
• her latest output,
• any new event tags.
g. Save:
• RebeccaState to world ledger / state store,
• the conversational turn to history.
h. Return output to UI.
	4.	If narrator → follow narrator pipeline (unchanged), but the narrator
MAY receive a RebeccaState summary to decide what to highlight
behaviourally, as defined in REBECCA_MODULATION_MAP.md.

=====================================================================
SECTION 12 — REQUIRED NEW MODULE: /lib/characters/rebecca.ts

The builder MUST create:

export async function generateRebeccaOutput(context) {
  const state = await loadRebeccaState(context);          // RebeccaState
  const prompt = assembleRebeccaPrompt(context, state);
  const response = await completeRebeccaExpression(prompt);
  const parsed = parseRebeccaResponse(response);
  const newState = updateRebeccaState(state, context, parsed); // via modulation map rules
  await saveRebeccaState(newState, context);
  return parsed;
}

Where assembleRebeccaPrompt MUST load:
• Rebecca_Fingerprint.md
• Rebecca_Expression_Engine.md
• a short textual summary of RebeccaState (from modulation map)
• Scene Summary
• World Ledger
• User input

=====================================================================
SECTION 13 — REQUIRED NEW MODULE: /lib/PromptAssembler.ts

The builder MUST create a shared component that builds the ordered
prompt for Rebecca.

STRICT order:

[
  { role: "system", content: Narrator_System_Prompt },
  { role: "system", content: Rebecca_Fingerprint },
  { role: "system", content: Rebecca_Expression_Engine },
  { role: "system", content: Rebecca_State_Summary },   // from modulation map
  { role: "system", content: World_Ledger_Slice },
  { role: "system", content: Scene_Summary },
  { role: "user",   content: User_Input }
]

The builder MUST NOT deviate from this order.

=====================================================================
SECTION 14 — TESTING THE INTEGRATION

The builder MUST test:
	1.	Rebecca outputs with humour → matches fingerprint + expression engine
	2.	Rebecca outputs with vulnerability → matches fingerprint + state
	3.	Rebecca outputs in public → discreet, contextual, per modulation map
	4.	Rebecca outputs in intimacy → grounded, sensual, not pornographic,
per fingerprint and expression engine
	5.	Rebecca outputs under stress → concise, present, honest, with fear
channel used correctly.
	6.	Rebecca never produces narrator lines
	7.	Rebecca never describes the world
	8.	Rebecca never breaks boundaries or personality
	9.	Rebecca never becomes generic girlfriend
	10.	Rebecca responds dynamically to context changes as defined in
REBECCA_MODULATION_MAP.md.

=====================================================================
END OF BUILDER INTEGRATION SPECIFICATION