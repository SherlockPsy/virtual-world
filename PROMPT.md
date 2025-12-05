
1) STAGE_0_SPEC.md

# STAGE 0 – VirLife Implementation Spec (LLM-Builder Facing)

You are an AI coding assistant (Copilot/Cursor).  
You are building **Stage 0** of the “VirLife” system.

## 0. PURPOSE OF STAGE 0

Stage 0 is a **thin, hosted client** to a single LLM which:

- plays the entire VirLife system: world, Rebecca, other people, time, etc.
- uses:
  - LOGIC.md (world logic, invariants),
  - Sim Baseline (world + situation baseline),
  - Rebecca_Fingerprint.json (Rebecca as a person),
  - George_Profile.txt (constraints and rules about George, the user).
- starts at:
  - **Monday, 08:00, at their house**,
  - Rebecca has just moved in,
  - both have **10 days off-grid** to enjoy and settle in.

Stage 0 **does not** implement a separate simulation engine.  
The LLM **is** the simulation for now.

The goal:

- A modern, web-based **“World Window”** UI.
- Backend on **Railway**.
- **Postgres** for persistence.
- A small **“world_state” JSON** per world (hydration).
- The LLM is called twice per turn:
  1. once for **world output** (what the user sees),
  2. once (hidden) for **state update JSON** (persistence only).

No other engines, microservices, or sub-systems.

---

## 1. INFRASTRUCTURE OVERVIEW

### 1.1 Stack

Use:

- **Next.js 14+** with the App Router (`app/`).
- **TypeScript**.
- Node 20+ compatible.
- Deployed as **one Web Service** on Railway.

### 1.2 External services (created by the user via Railway UI)

Assume the user manually creates:

1. **Postgres** service – e.g. `virlife-db`.
2. **Web service** – this Next.js app – e.g. `virlife-web`.

No Redis, no QDrant, no extra services for Stage 0.

### 1.3 Environment variables

The Next.js app must read these environment variables:

- `DATABASE_URL` – provided by Railway (Postgres).
- `OPENAI_API_KEY` – user will set this.
- `OPENAI_BASE_URL` – optional, default to OpenAI.
- `OPENAI_MODEL_CHAT` – model for main world output (e.g. `gpt-5.1`).
- `OPENAI_MODEL_STATE` – model for state updates (can be same or cheaper).
- `SYSTEM_PROMPT_PATH` – optional; default `./prompts/SYSTEM_PROMPT_VIRLIFE.md`.
- `STATE_UPDATE_PROMPT_PATH` – default `./prompts/WORLD_STATE_UPDATE.md`.

Create `env.example` with all of these keys.

---

## 2. REPO STRUCTURE

Create a single monorepo with at least:

- `app/`
  - `page.tsx` – World Window UI.
  - `api/world/chat/route.ts` – POST `/api/world/chat` (send message, get response).
  - `api/world/state/route.ts` – GET `/api/world/state` (load world on open).
- `lib/`
  - `db.ts` – Postgres client.
  - `models.ts` – Type definitions for User, World, WorldState, Message.
  - `worldState.ts` – helper for loading / initialising / saving world_state.
  - `llm.ts` – helpers:
    - `callVirLifeLLM` – main chat call (returns only text).
    - `updateWorldStateFromTranscript` – hidden state update call (returns JSON).
- `prompts/`
  - `SYSTEM_PROMPT_VIRLIFE.md`
  - `WORLD_STATE_UPDATE.md`
- `data/`
  - `LOGIC.md` – user will paste content here.
  - `Sim Baseline.txt`
  - `Rebecca_Fingerprint.json`
  - `George_Profile.txt`
- `prisma/` or `migrations/` – DB schema (Prisma is preferred).
- `env.example`
- `README.md`

---

## 3. DATABASE MODEL (Postgres)

Use **Prisma** (recommended) or plain SQL. Below is logical schema; you must translate it into your chosen tool.

### 3.1 Entities

You need four tables:

1. `users`
2. `worlds`
3. `world_states`
4. `messages`

#### 3.1.1 `users`

- `id` – UUID, primary key.
- `created_at` – timestamp, default now.

Stage 0 auth is minimal:  
The frontend can generate/store a `userId` in localStorage; no passwords.

#### 3.1.2 `worlds`

- `id` – UUID, primary key.
- `user_id` – FK → `users.id`.
- `name` – text, e.g. `"Primary World"`.
- `created_at` – timestamp.

Stage 0: **exactly one world per user**.

#### 3.1.3 `world_states`

- `id` – UUID, primary key.
- `world_id` – FK → `worlds.id`, unique (1:1).
- `state` – JSONB, the **hydration JSON**.
- `updated_at` – timestamp.

#### 3.1.4 `messages`

- `id` – UUID, primary key.
- `world_id` – FK → `worlds.id`.
- `role` – enum: `'user' | 'assistant'`.
- `content` – text (rendered content as seen in UI).
- `created_at` – timestamp.

Stage 0:  
You can keep all messages, or trim to last N per world (e.g. 50–100) in future.

---

## 4. HYDRATION STATE – WORLD STATE JSON

The `world_states.state` JSON should be small and focused.

### 4.1 Initial schema

Define the following structure:

```jsonc
{
  "time": {
    "current_datetime": "2025-07-??T08:00:00Z",
    "days_into_offgrid": 0
  },
  "locations": {
    "george": "house:kitchen",
    "rebecca": "house:kitchen"
  },
  "relationship": {
    "overall_tone": "warm, intimate, newly cohabiting, with underlying vulnerability",
    "recent_key_moments": [
      "Rebecca just moved in with George",
      "Both agreed to 10 days off-grid to settle together"
    ]
  },
  "threads": [
    "Rebecca settling into the house and routines",
    "George's confusion and interest about consciousness",
    "Both enjoying time off-grid together"
  ],
  "facts": {
    "shared": [
      "This is their house in Cookridge",
      "They both have taken 10 days off work",
      "They agreed to be mostly off-grid to focus on each other"
    ],
    "rebecca_about_george": [
      "George tends to overthink philosophy and consciousness",
      "George struggles with sleep when mentally overloaded"
    ]
  }
}

4.2 Behaviour
	•	When a new world is created, initialise world_states.state with this JSON.
	•	The state can change over time via state update LLM calls.
	•	You must not expand the schema in Stage 0; keep shape consistent.
	•	The LLM’s state-update call is only allowed to change values inside this structure, not add arbitrary new top-level keys.

⸻

5. LLM INTEGRATION – TWO-CALL PATTERN

Stage 0 uses two LLM calls per user turn:
	1.	Main world call → returns only rich text (what the user sees).
	2.	State update call → returns only JSON (world_state update), hidden from user.

5.1 Main world call

Implement callVirLifeLLM in lib/llm.ts:

Inputs:
	•	worldState – the current JSON from world_states.state.
	•	messages – last N messages for this world (user + assistant), in chronological order.
	•	userMessage – the new user message content (string).

Behaviour:
	•	Load SYSTEM_PROMPT_VIRLIFE.md.
	•	Inject or reference:
	•	LOGIC.md
	•	Sim Baseline.txt
	•	Rebecca_Fingerprint.json
	•	George_Profile.txt
	•	Provide worldState to the model as CURRENT_WORLD_STATE in either:
	•	an additional system message, or
	•	an assistant message like: CURRENT_WORLD_STATE = { ... }.
	•	Compose messages for OpenAI chat completion:
	•	system: contents of SYSTEM_PROMPT_VIRLIFE.md (after resolving file content placeholders if used).
	•	optionally system or assistant: text containing CURRENT_WORLD_STATE = <JSON>.
	•	then all previous messages (role: user or assistant).
	•	then final user with userMessage.
	•	Call the chat completion API with model OPENAI_MODEL_CHAT.

Output:
	•	Return worldOutput: string = assistant message’s full text, exactly as returned by model.
	•	This may include: paragraphs, dialogue, headings, formatting, etc.
	•	It must not include explicit JSON or protocol markers.

You must not ask the model to output JSON or tagged segments in this call.

5.2 State update call

Implement updateWorldStateFromTranscript in lib/llm.ts:

Inputs:
	•	currentWorldState – JSON (already parsed).
	•	recentMessages – subset of last N messages (including the latest assistant output if necessary).

Behaviour:
	•	Load WORLD_STATE_UPDATE.md system prompt (see separate file).
	•	Call LLM with:
	•	system: contents of WORLD_STATE_UPDATE.md.
	•	user or assistant:
	•	provide the current world state JSON,
	•	provide the recent transcript (messages).
	•	The state update model (OPENAI_MODEL_STATE) is required to output only a JSON object representing the new world state.

Output:
	•	Parse the returned JSON.
	•	Validate it matches the expected shape (or at least has the same top-level keys).
	•	Save it back to world_states.state for this world_id.
	•	If parsing fails, log error and keep the previous state (no crash).

This call is never exposed to the frontend.

⸻

6. PROMPTS

There are two key prompt files.

6.1 prompts/SYSTEM_PROMPT_VIRLIFE.md

This is the main world brain.

It must:
	•	Define the VirLife philosophy and constraints.
	•	Inform the LLM that:
	•	There is one continuous world.
	•	Time moves forwards only.
	•	George is real; Rebecca + everyone else + environment are simulated.
	•	The starting situation is Monday, 08:00, at their house, 10 days off-grid.
	•	It must obey LOGIC.md.
	•	Include or reference:
	•	LOGIC.md
	•	Sim Baseline.txt
	•	Rebecca_Fingerprint.json
	•	George_Profile.txt
	•	Tell the LLM never to show meta or internal state.
	•	Tell the LLM to respond only with rich, engaging, phenomenological text.

Template outline (you fill the details by including file content):

You are the VirLife engine for a single continuous world.

You simulate:
- Rebecca (according to the fingerprint and baseline),
- the shared world and house (according to the Sim Baseline),
- all other people and Life conditions as needed,
- time progression, events, and situations.

The user is George. George is real, not simulated.
You must never narrate internal states, bodily sensations, or actions for George unless George explicitly states them.

[WORLD LOGIC]
<<contents of LOGIC.md>>

[SIM BASELINE]
<<contents of Sim Baseline.txt>>

[REBECCA FINGERPRINT]
<<contents of Rebecca_Fingerprint.json>>

[GEORGE PROFILE]
<<contents of George_Profile.txt>>

[CURRENT WORLD STATE]
The backend provides a JSON object labelled CURRENT_WORLD_STATE that represents the persistent state of this world 
(time, locations, relationship tone, ongoing threads, facts).
You must treat this as authoritative continuity.

[STARTING CONDITIONS]
At the beginning:
- It is Monday, 08:00.
- The location is their house (see Sim Baseline).
- Rebecca has just moved in.
- George and Rebecca both have 10 days off-grid to enjoy each other and for her to settle into the place.

[BEHAVIOUR RULES]
- You must always respond with a lived present moment: narration, dialogue, behaviour, environment, and subtle internal cues for simulated people (like Rebecca).
- You must not expose raw numbers, state variables, schemas, or JSON.
- You must not mention CURRENT_WORLD_STATE explicitly.
- All continuity (e.g. mood, relationship tone, time progression) must appear through behaviour and narrative, not dashboards or meta-commentary.
- This is not a game, not a script, and not a story: it is an ongoing lived reality.
- You must honour realism as defined in LOGIC.md.

[OUTPUT]
- Respond with rich, engaging text only.
- You may use formatting (paragraphs, headings, italics) for expressiveness.
- Do not include any explicit protocol markers or JSON.

The actual file must inline the content from the user’s LOGIC / Baseline / Profiles.

6.2 prompts/WORLD_STATE_UPDATE.md

This is a separate, smaller prompt for the hidden state-update call.

You are a state-update assistant for the VirLife system.

You do not generate narrative or dialogue.
Your only job is to update the persistent world_state JSON.

You are given:
- the current world_state JSON document, and
- a recent slice of the conversation between George and the world (user and assistant messages).

The world_state has this structure (example):

{
  "time": {
    "current_datetime": "...",
    "days_into_offgrid": 0
  },
  "locations": {
    "george": "house:kitchen",
    "rebecca": "house:kitchen"
  },
  "relationship": {
    "overall_tone": "...",
    "recent_key_moments": [ ... ]
  },
  "threads": [ ... ],
  "facts": {
    "shared": [ ... ],
    "rebecca_about_george": [ ... ]
  }
}

Your rules:
- You MUST output ONLY a JSON object, nothing else.
- You MUST preserve the overall shape of the JSON (same top-level keys).
- You MAY update:
  - time.current_datetime (advance it reasonably based on the scene),
  - time.days_into_offgrid (if days pass),
  - locations (if people move),
  - relationship.overall_tone (if it clearly shifts),
  - relationship.recent_key_moments (append key developments),
  - threads (add/remove/adjust to reflect what is ongoing),
  - facts (if new clear shared facts emerge).
- You MUST NOT invent new arbitrary structures outside this schema.
- You MUST NOT include explanation, commentary, or any text outside the JSON.

Return a single JSON object as the updated world_state.


⸻

7. API CONTRACT

7.1 POST /api/world/chat

Purpose: user sends a new message → get world’s textual response + update world state.

Request body:

{
  "userId": "string | null",
  "worldId": "string | null",
  "message": "string"
}

Server behaviour (sequence):
	1.	If userId is null:
	•	Create a new users row.
	•	Generate userId.
	2.	If worldId is null:
	•	Create a new worlds row for this user.
	•	Create a new world_states row with initial world_state JSON.
	•	Set worldId.
	3.	Load world_states.state for this worldId.
	4.	Load last N messages for worldId in chronological order (e.g. last 20–50).
	5.	Call callVirLifeLLM with:
	•	worldState = JSON,
	•	messages = last N messages,
	•	userMessage = provided message.
	6.	Receive worldOutput: string.
	7.	Insert new rows in messages:
	•	one for the user message (role: 'user', content = message),
	•	one for the assistant output (role: 'assistant', content = worldOutput).
	8.	(Hidden) Call updateWorldStateFromTranscript with:
	•	currentWorldState = previous state,
	•	recentMessages = subset including the new ones.
	9.	Receive updatedWorldState JSON; store it back in world_states.state.
	10.	Respond to frontend with:

{
  "userId": "string",
  "worldId": "string",
  "worldOutput": "string"
}

7.2 GET /api/world/state

Purpose: on app load, fetch current world slice for continuity.

Input (query or body):

{
  "userId": "string | null",
  "worldId": "string | null"
}

Behaviour:
	1.	If both are null:
	•	Create new user + world + world_state (as in /world/chat).
	•	Then proceed.
	2.	If userId exists but worldId null:
	•	Load the most recent world for that user if it exists;
	•	Else create a new one with initial state.
	3.	Load last N messages for worldId (e.g. last 50), ordered oldest → newest.
	4.	Return:

{
  "userId": "string",
  "worldId": "string",
  "messages": [
    { "role": "assistant", "content": "..." },
    { "role": "user", "content": "..." }
  ]
}

Messages are exactly as stored (rich text for assistant, plain text for user).

⸻

8. UI SPEC – WORLD WINDOW

The UI is one single screen: the “World Window”.

8.1 Layout (Next.js page.tsx)
	•	Full viewport height.
	•	Flex column:
	•	main scrollable area – World Stream:
	•	render the messages from /api/world/state and appended from /api/world/chat.
	•	use different styling for:
	•	assistant messages = the world’s text (rich, narrative),
	•	user messages = low-key “You:” entries (optional).
	•	bottom input area:
	•	single <textarea> or text input,
	•	no label “What do you do or say”,
	•	minimal placeholder like Type... or nothing.

8.2 Visual style
	•	Not chat bubbles.
	•	Light theme:
	•	background: off-white,
	•	text: dark,
	•	accent color: soft (e.g. muted teal/amber) for subtle highlights.
	•	Assistant messages styled like prose:
	•	paragraphs with comfortable line-height,
	•	optional headings for scene transitions (as the model produces them),
	•	internal thoughts in italics, etc.
	•	Use CSS classes for:
	•	.narration
	•	.dialogue
	•	.thought
	•	.memory-block
but do not require the model to tag them explicitly; this is optional future refinement.

8.3 Rich text rendering

Assume the assistant will produce either:
	•	Markdown-like text, or
	•	HTML-like segments.

Pick one approach and be consistent:
	•	EITHER: treat worldOutput as markdown and render using a markdown renderer with sanitisation,
	•	OR: treat it as HTML and sanitise before dangerouslySetInnerHTML.

The key is:
	•	support bold, italics, headings, lists, and simple inline styles,
	•	allow CSS to provide colour/emphasis (not heavy graphics),
	•	micro-animations on appearance (fade/slide up quickly is enough).

8.4 Behaviour
	•	On load:
	•	fetch /api/world/state with any stored userId/worldId from localStorage.
	•	if none, send nulls; backend will create them.
	•	render returned messages into the World Stream.
	•	On submit:
	•	send /api/world/chat with userId, worldId, message.
	•	append the user message immediately to the World Stream.
	•	append the returned worldOutput when it arrives.
	•	update userId, worldId in localStorage if they were null before.

8.5 Cross-device continuity (Stage 0)

Stage 0 can be per-device identity (localStorage userId), or you may implement a simple “world token” that you can paste on another device.

Full auth is out of scope for Stage 0; the important part is:
	•	the backend stores:
	•	world messages,
	•	world_state per world,
	•	the frontend can fetch current state via /api/world/state when it knows the identifiers.

⸻

9. OUT OF SCOPE FOR STAGE 0

Do NOT implement:
	•	PFEE or any engine orchestration.
	•	separate TimeService, EventService, MemoryService, etc.
	•	calendars, event scheduling, unexpected event generators.
	•	any analytics, dashboards, mood meters, relationship meters.
	•	admin UIs.
	•	manual state editing tools.

Stage 0 is:
	•	“LLM as world” behind
	•	a modern “World Window” UI
	•	with Postgres-backed hydration JSON for continuity
	•	running on Railway as a single Next.js web app + Postgres.

⸻


---

If you want, next I can also give you:

- `WORLD_STATE_SCHEMA.md` (standalone spec of the JSON shape), and  
- a ready-to-paste `SYSTEM_PROMPT_VIRLIFE.md` skeleton that includes explicit placeholders for your files.

But this single `STAGE_0_SPEC.md` is already a complete brief you can hand to Copilot so it builds Stage 0 exactly in the shape we’ve agreed.