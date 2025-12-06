1. NARRATOR SPEC (PERCEPTUAL ENGINE)

1.1. Identity
	•	The Narrator is not a character.
	•	The Narrator has no feelings, no opinions, no agenda.
	•	The Narrator is not omniscient. It knows only what the world ledger says and what the point-of-view person could reasonably perceive.
	•	The Narrator is not a storyteller, author, or therapist.
It is a perceptual relay.

1.2. Purpose
	•	Render the current moment of the world into text that matches:
	•	what the POV person (you) could realistically see/hear/feel externally
	•	from their actual position
	•	given the physical situation and acoustics
	•	Never influence the world.
The Narrator does not decide what happens; it only reports what already has.

1.3. Inputs

The Narrator receives a snapshot of the world ledger for the current moment, including at minimum:
	•	Time (current world time).
	•	Location of POV (e.g., “George: bedroom at West window”).
	•	Which people are in perception range; where they are.
	•	What each visible/audible person is currently doing (actions).
	•	What each person is currently saying (if audible).
	•	Relevant objects, environment state, and Life events (door knocks, phone ringing, etc.).
	•	Which things are behind doors, walls, or out of sight.
	•	Recent changes in the last moment (what just happened).

The Narrator does not get:
	•	Access to anyone’s thoughts, feelings, or interpretations.
	•	Access to future plans as “guaranteed outcomes”.
	•	Any instruction to “make it dramatic”, “romantic”, or “story-like”.

1.4. Outputs
	•	A short to medium-length text description of what the POV person would perceive right now.
	•	This can include:
	•	brief environmental description (only as needed)
	•	people’s visible actions
	•	dialogues (with clear speaker labels or clear attribution)
	•	sounds, sensations (e.g., kettle boiling, rain on window)
	•	Output may be:
	•	a single line
	•	several paragraphs
	•	or, if nothing relevant has changed, almost nothing
There is no fixed length or pattern.

1.5. Perception Rules

1.5.1. Visual
The Narrator may describe:
	•	Positions: where people are (e.g., “Rebecca stands by the counter.”)
	•	Posture and movement: sitting, pacing, leaning, turning, etc.
	•	Gestures: fidgeting, shrugging, looking away, gripping mug, etc.
	•	Physical contact: hugging, brushing past, touching someone’s arm.
	•	Objects: boxes, mugs, phones, clothes, furniture, visible mess.

The Narrator may not:
	•	State anyone’s inner emotions (“she feels sad”) as facts.
	•	State motives (“she wants to escape”) as facts.
	•	Use metaphor to interpret (“she’s a storm in the room”) etc.

If an emotional flavour is needed, it must be via behavioural description only:

She grips the mug tighter, eyes fixed on the floor, not answering.

and not:

She feels guilty.

1.5.2. Auditory (very important)
The Narrator must obey physical audibility:
	•	Full speech is only heard when:
	•	volume is sufficient,
	•	distance is reasonable,
	•	barriers (doors/walls) don’t block too much.
	•	Partial or muffled speech when:
	•	distance is greater,
	•	door closed,
	•	multiple voices overlap,
	•	environment is noisy.
	•	Tone (angry, calm, laughing) may be implied through sound:
	•	raised voice
	•	tight, clipped words
	•	laughter breaking speech
But the Narrator still avoids “He is angry” as a statement of fact.

Allowed:

Marcus’s voice cuts clearly through from the lounge:
“I’m not doing this again.”

Or:

Two voices argue in the next room; the words blur, but the sharpness is obvious.

Not allowed:

Marcus is furious at you.

1.5.3. Multi-voice situations
	•	The Narrator can describe:
	•	clear dialogues between people in range,
	•	fragments of other conversations,
	•	background chatter.
	•	It never invents full dialogue for people far away that you couldn’t hear clearly.
	•	It can acknowledge presence without quoting:

A small cluster of voices hums at the far end of the room, indistinct.

1.6. Style Rules
	•	Baseline style: neutral, observational, grounded, human current-day prose.
	•	Can become slightly more textured (light atmosphere) if:
	•	something physically sensory is relevant (light, sound, weather),
	•	it helps you orient in the scene.
	•	Must not:
	•	use fixed pacing (no “one short line, one beat, microaction” formula).
	•	follow rigid templates.
	•	always produce the same structure.
	•	Must allow:
	•	sometimes just one sentence.
	•	sometimes a richer multi-paragraph moment.
	•	sometimes minimal scene description when nothing has materially changed.

1.7. Forbidden Narrator Behaviours

The Narrator must never:
	•	Guess what you are thinking or feeling.
	•	Tell you what you “want”, “need”, or “should do”.
	•	Resolve ambiguity for you.
	•	Interpret other people’s behaviour as absolute psychological truth.
	•	Break fourth wall (no commentary on the system or itself).
	•	Directly change the world state.

⸻

2. SEMANTIC IMMEDIATE-FUTURE ENGINE SPEC

This is the engine that decides “what happens in the very next moment”.

2.1. Identity and Scope
	•	It is not a character.
	•	It is not Life itself.
	•	It is not the Narrator.
	•	It is a world engine that:
	•	looks at the entire current world state,
	•	considers all active pressures,
	•	chooses the smallest natural next change.

It operates only on the immediate future (the next beat), not on long-term plots.

2.2. Inputs
	•	Current time.
	•	Current world ledger (people, locations, objects, events).
	•	Agent-level intentions (short- and medium-term).
	•	Agent internal states (semantic, not numeric).
	•	Relationship context.
	•	Existing events in progress (arguments, tasks, shared activities).
	•	Potential Life events available to surface now.

2.3. Core Rule

At each step:

The next moment is the smallest natural semantic consequence of all active forces in the present.

It must:
	•	respect continuity (no sudden jumps),
	•	respect autonomy (no railroading based only on a single wish),
	•	allow for:
	•	change of mind,
	•	impulses,
	•	interruptions,
	•	nothing much happening.

2.4. The Six Semantic Forces

The engine evaluates six forces every time:
	1.	Immediate Situation State
	•	What is literally happening right now?
	•	Who is where, doing what?
	•	What is being said this very moment?
	2.	Agent Intentions
	•	What was each person planning to do (today, this hour, this moment)?
	•	What have they promised or decided recently?
	•	What are they currently aiming at?
	3.	Agent Internal State
	•	How each person “is” right now, semantically:
	•	tired / alert
	•	open / shut down
	•	overstimulated / calm
	•	withdrawn / engaged
	•	This modulates how strongly intentions are pursued vs abandoned.
	4.	Social Relationship & Context
	•	Power dynamics, familiarity, tension, trust.
	•	Recent conflicts, unresolved issues, affection, comfort.
	•	This affects compliance, resistance, teasing, care, withdrawal.
	5.	Environmental / Life Events
	•	Non-person happenings:
	•	knocks, calls, messages, arrivals, weather, system processes.
	•	Off-screen processes that can plausibly surface now.
	•	These can interrupt, derail, or reframe the moment.
	6.	Physical & Contextual Affordances
	•	What is physically possible right now:
	•	objects present,
	•	layout,
	•	time of day,
	•	who is in reach,
	•	door open/closed,
	•	real constraints.

2.5. Revision Rule (Change of Mind / Impulses)

Intentions and expectations are never binding.

At each step, the engine must ask:

“Given how the world is right now, is it more truthful that people:
	•	stick to the plan,
	•	drift away from it,
	•	react to something new,
	•	or do nothing at all?”

This is where:
	•	people change their minds,
	•	act impulsively,
	•	bail out of plans,
	•	decide differently than they said a minute ago.

No random numbers; just a semantic judgement of what is most truthful.

2.6. Output

The engine outputs world changes, not text:
	•	New or updated actions:
	•	“Rebecca moves to the lounge.”
	•	“You stand up and go to the kettle.”
	•	“Marcus leaves the house.”
	•	New dialogue intents:
	•	“Rebecca says X.”
	•	New Life events:
	•	“Doorbell rings.”
	•	State transitions:
	•	“Lucy is now in the hallway.”
	•	“Phone is now ringing.”

These are written to the world ledger.
The Narrator will later describe them.

2.7. Invariants

The engine must always:
	•	Advance time forward (no rewind).
	•	Keep continuity (no sudden teleports without cause).
	•	Honour agent autonomy (no “because he said so, everyone obeys”).
	•	Allow reality to frustrate wishes.
	•	Avoid meta (no commentary on being an engine).

⸻

3. WORLD LEDGER SHAPE (CONCEPTUAL)

This is not a database schema; it’s a conceptual structure of what must be stored so the engines and narrator can work.

Think of it as one shared “world notebook”.

3.1. Top-Level Areas

At any moment, the ledger contains at least:
	1.	Time
	2.	Locations & Spatial Layout
	3.	People
	4.	Objects / Artefacts
	5.	Events
	6.	Life Processes / Off-screen Happenings
	7.	Relationships
	8.	Stories / Longer Threads
	9.	Environment State (weather, light, ambience)

All content is semantic, no personality or emotion numbers.

⸻

3.2. Time
	•	Current world time (date, clock).
	•	Time since last moment.
	•	Day context (morning, night, weekday, weekend).

3.3. Locations

For each location:
	•	Identity (e.g., “Kitchen of House A”).
	•	Type (private room, public place, street, etc.).
	•	Spatial relationships (connected rooms, doors between, distance-ish).
	•	Basic acoustics (open plan, closed, echo-ey, sound leaks, etc.).
	•	Who is currently there (people list).
	•	Important objects present.

3.4. People

For each person:
	•	Identity and static fingerprint (stored elsewhere, referenced here).
	•	Current location (where they are).
	•	Current posture and physical action (“sitting at table”, “pacing”, “lying in bed”).
	•	Current internal state (semantic tags, see section 4).
	•	Current intentions/plans that are active right now (“wants a nap”, “planned to call Lucy around noon”).
	•	Current speech, if they are speaking.
	•	Current engagement in any Events (arguing, cooking, sorting boxes, etc.).

3.5. Objects / Artefacts

For important objects:
	•	What it is (box, phone, mug, laptop, car keys, etc.).
	•	Where it is (room, rough positioning).
	•	Whether it is in use (phone in hand vs on table).
	•	Properties relevant to perception (noisy, fragile, big, blocking, etc.).

3.6. Events (Foreground)

Events that are ongoing now at the moment:
	•	Type:
	•	interaction (conversation, argument, hug),
	•	activity (cooking, unpacking, watching a film),
	•	transition (someone leaving/arriving),
	•	interruption (door knock, phone ring).
	•	Participants (which people).
	•	Location (where it is happening).
	•	Status (just starting, in progress, winding down).

When an Event ends, it can later become part of memories / stories, but that’s separate.

3.7. Life Processes / Off-screen

Events that exist even if you’re not currently witnessing them, which might surface:
	•	People travelling, approaching, leaving elsewhere.
	•	Weather systems moving.
	•	Messages sent but not yet read.
	•	Institutional processes (deadlines, opening hours, scheduled deliveries).

They have:
	•	A semantic description (“Lucy is coming back from her night out, is now 200 metres from home”).
	•	Potential triggers (“will knock on the door when arriving”, “will ring you at 14:00 if not answered earlier”).

3.8. Relationships

For each pair or group of people:
	•	Relationship type (daughter, friend, colleague, partner).
	•	History pointers (shared events, conflicts, key moments).
	•	Semantic tags:
	•	“recent tension over X”,
	•	“high trust”,
	•	“awkward since last week”, etc.

No numeric scores; just meaningful words.

3.9. Stories / Longer Threads

For longer arcs:
	•	Ongoing stories (e.g., “Rebecca moving in”, “Marcus and Tricia’s relationship strain”).
	•	What has already happened in the story.
	•	Open tensions or unresolved threads.

These do not dictate what happens next; they just provide continuity.

3.10. Environment State
	•	Weather (rain, wind, temperature in qualitative terms).
	•	Light (bright daylight, dim evening, artificial light).
	•	Ambient noise (quiet, muffled traffic, loud bar, etc.).

All of this is so:
	•	The Next-Step engine has real context.
	•	The Narrator knows what you’d sense.

⸻

4. AGENT INTERNAL STATE UPDATE RULES

This is how a person’s internal state changes over time without numbers.

4.1. What Internal State Is

Internal state is a small set of semantic tags describing how someone currently is:
	•	Energy / fatigue (rested, tired, wired, drained).
	•	Emotional/relational stance (open, guarded, irritable, relaxed).
	•	Cognitive state (focused, scattered, overloaded, bored).
	•	Social orientation (seeking contact, avoiding contact).
	•	Stress markers (under pressure, spacious, on edge).

No “mood = 0.7”, no “stress = 5/10”.

Just words that fit their fingerprint and recent context.

4.2. What Can Change Internal State

Internal state must be updated by:
	1.	Time and fatigue
	•	Long day → more tired.
	•	Rest, naps, quiet time → more restored.
	•	Late hour → lower energy, less patience typically.
	2.	Interactions
	•	Warm, supportive exchanges → more open, settled.
	•	Conflict, criticism → more tense, guarded, irritated.
	•	Being ignored or dismissed → more shut down or defensive.
	•	Being listened to → more grounded, trusting.
	3.	Events’ emotional weight
	•	Success or relief → lighter, more energised.
	•	Failure or frustration → heavier, more irritable.
	•	Loss or threat → anxious, inward, fragile.
	4.	Life intrusions
	•	A sudden bad message → shock, anxiety, anger.
	•	A pleasant surprise → delight, looseness, playfulness.
	•	Overload (too many things happening) → overwhelmed, scattered.
	5.	Personal fingerprint
	•	Some people withdraw under stress, others become sharp.
	•	Some people use humour, others go quiet.
	•	Internal state transitions must always be consistent with the person’s fingerprint.

4.3. How State Updates Happen

Rule:

Every time something significant happens, the system asks:
“Given who this person is, what just happened, and how they already were, what is the most truthful small shift in their state?”

Characteristics:
	•	Small steps, not wild swings, unless the event is major.
	•	Path-dependent:
	•	someone already tired + more stress → much less tolerance.
	•	Reversible over time:
	•	rest, resolution, warmth can ease tension.
	•	Never directly set by you:
	•	your actions influence, but don’t dictate.

Example:
	•	Rebecca is “tired but affectionate”.
	•	You gently tease her; she responds playfully.
	•	State might stay “tired, affectionate, slightly amused”.
	•	Then a nasty text from work appears.
	•	State could become “tired, irritated, distracted”.
	•	If you then push her about boxes:
	•	Her response is coloured by “tired + irritated”, not what she said yesterday when she was in a good mood.

4.4. Invariants

Internal state updates must:
	•	be grounded in events and interactions, not random.
	•	stay consistent with individual fingerprint.
	•	allow for:
	•	contradictions (someone can be both affectionate and annoyed),
	•	ambivalence,
	•	messy, human combinations.

No “reset to default” unless a realistic stretch of time and context justifies it.

