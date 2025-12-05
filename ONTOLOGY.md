# ONTOLOGY

This document defines the conceptual ontology of the world.  
It includes all entities that exist, the conditions under which they exist,  
and the relationships required to maintain continuity, realism, and coherence.

The ontology intentionally avoids implementation details.  
It defines **what exists** in the world, not how it is handled technically.

====================================================================
1. FOUNDATIONAL DIMENSIONS
====================================================================

1.1 TIME  
- Time is the only universal dimension.  
- It moves forward only, never backward, never paused.  
- There are no gaps in time; experience is continuous.  
- Local time representations may vary (e.g., time zones),  
  but the underlying moment is universal.

1.2 LOCATION  
- Nothing in the world can exist without a Location.  
- Every Person, Object, Event, Memory (via its originating event),  
  Story (via its events), and Artefact is ultimately somewhere.  
- A Location is a fixed spatial entity that cannot be carried.  
  You can own a Location, but you cannot take it with you.  
- Locations may exist without People present.  
- Locations can be:
  - nested (room → house → city → region → country)
  - linked (hallway ↔ kitchen, café ↔ street)
  - proxied (“the Louvre” → Paris, “Cookridge” → home in Cookridge)
- Locations define:
  - where a Person is  
  - who is near whom  
  - what actions are possible  
  - what can be perceived  
  - environmental conditions  
- Location is part of Context (not a Person property).


====================================================================
2. OWNERS (ACTIVE ENTITIES)
====================================================================

2.1 PEOPLE  
A Person is an autonomous, embodied agent with identity, internal state,  
knowledge, relationships, location, and behaviour.

A Person always has a Location.

2.2 LIFE  
A non-person source of happenings that affect the world  
(weather, accidents, global conditions, institutional schedules).

Life does not have agency like a Person.  
Life does not own world state.  
Life can initiate Events.

====================================================================
3. PERSON — WHAT A PERSON IS
====================================================================

A Person consists of stable identity layers, dynamic internal state,  
knowledge, relationships, stories, intentions/plans, and contextual embedding.


3.1 IDENTITY (STABLE COMPONENTS)

- Personality Patterns  
- Values  
- Biographical Experiences  
- Preferences  
- Strengths  
- Flaws  
- Aspirations  
- Non-negotiables / Boundaries  
- Relational Style  
- Emotional Signature  
- Physical Profile  
- Abilities / Capabilities  
- Skills


3.2 INTERNAL STATE (VARIABLE COMPONENTS)

- Affective State (current emotions)  
- Mood  
- Stress / Pressure  
- Physiological State (hunger, fatigue, etc.)  
- Immediate Needs  
- Attention / Focus  


3.3 KNOWLEDGE

- Semantic Knowledge (facts about world, people, places)  
- Episodic Memories (subjective lived experiences with locations)  
- Procedural Knowledge (skills)  
- Inferred Beliefs (subjective interpretations)  


3.4 RELATIONSHIPS (PERSON ↔ PERSON)

- Dyadic structures between two People.  
- A pair may have multiple independent relationship types (e.g., colleague + rival).  
- A relationship has tone, dynamics, roles, and history.  
- Relationships do not belong to a Person; they are shared constructs.  
- Relationships evolve over time.  


3.5 STORIES

- Long-running organising constructs involving People (and potentially Life).  
- Not events, not memories, not identity.  
- May have goals but do not require completion.  
- May expand, contract, merge, split, or end.  
- May span multiple domains.  
- A Story is composed of Events, and therefore inherits their Locations.  


3.6 INTENTIONS, PLANS, PROMISES

- Intentions: commitments toward future actions.  
- Promises / Plans: concrete future commitments with time/location.  
- Goals: near-term desired outcomes.  
- These structures guide future expectations but are not Events.  


3.7 CONTEXTUAL EMBEDDING

Context includes:
- current Location  
- current time  
- who is present  
- active Objects  
- active Events  
- environmental conditions  
- Story involvement  

Context is an input to behaviour, not a Person property.


3.8 BEHAVIOUR

- Behaviour is what the Person does in the present moment.  
- Behaviour itself is not stored; it produces consequences.  

Consequences:
- new Memories  
- updates to Internal State  
- relationship changes  
- Story progression  
- new Events  
- changes in intentions  
- biographical updates  
- occasional identity shifts  


====================================================================
4. EVENTS
====================================================================

4.1 NATURE OF EVENTS  
- Events exist only in the present.  
- When an event ends, it becomes a Memory (for someone who experienced it).  
- Future “events” do not exist; they are either Plans or Promises.  

4.2 LOCATION OF EVENTS  
- Every Event must have one or more Locations.  
- An Event may unfold across several Locations  
  (e.g., ceremony in Location A, after-party in Location B).  

4.3 TYPES OF EVENTS  
- Person-initiated  
- Life-initiated  
- Expected (aligned with plans/promises)  
- Unexpected (not scheduled, not predicted)  


====================================================================
5. MEMORIES
====================================================================

5.1 DEFINITION  
- A Memory always belongs to exactly one Person.  
- Memories are subjective; no two People have identical memories of the same event.  

5.2 LOCATION IN MEMORIES  
- Memories reference the Location(s) of the originating Event.  
- A Person may recall the location inaccurately or vaguely.  

5.3 CHARACTERISTICS  
- Memories can change (reinterpretation).  
- Memories may form without direct experience (heard, imagined).  
- Creating ≠ recalling a Memory.  


====================================================================
6. RELATIONSHIPS
====================================================================

- Relationship = Person ↔ Person.  
- Multiple types may coexist between the same two People.  
- Dominant relationship type is context-dependent.  
- Relationships evolve through Events (which are located).  


====================================================================
7. STORIES
====================================================================

- Stories are long-running organising constructs.  
- They include People and are shaped by Events.  
- A Story has no inherent Location but inherits locations via Events.  
- Stories may be owned by People or influenced by Life.  
- People may be in multiple Stories simultaneously.  


====================================================================
8. ARTEFACTS
====================================================================

Artefacts are passive entities.  
They do not act.  
They may be physical or conceptual.


8.1 PHYSICAL ARTEFACTS (OBJECTS & PLACES)

Objects:
- Can be owned.  
- Cannot exist without a Location.  
- May move via People or events.  

Locations:
- Cannot be carried.  
- May be owned.  
- Can be nested, linked, proxied.  
- Define space where events occur and people exist.  


8.2 CONCEPTUAL ARTEFACTS

These include constructs that organise experience but do not act.

Examples:
- Stories (already defined)  
- Calendars (see below)  
- Plans / Promises (already defined)  
- Knowledge structures (facts, semantics)  


8.3 CALENDARS (NEW — ORGANISING ARTEFACTS)

- A Calendar is a conceptual artefact owned by a Person or by Life.  
- It contains Calendar Entries, which are simple application-like records:  
  - start_time  
  - end_time  
  - location  
  - participants  
  - title  
  - notes  
- Calendar Entries do not create Events.  
- Calendars merely organise future time for their owner.  
- When world time reaches an entry, the system may generate a Scene or Event  
  depending on logic, but the Calendar itself is passive.  


====================================================================
9. OBJECTS (OWNABLE ARTEFACTS)
====================================================================

- Objects always have Locations.  
- Objects may have owners.  
- Objects may move via People or events.  
- Objects do not act.  
- Objects may appear in stories, events, and memories.  


====================================================================
10. LIFE
====================================================================

- Life is a non-person source of happenings.  
- Life does not have identity or internal state.  
- Life may generate events (weather, system-wide conditions).  
- Life may have Calendars for public schedules.  
- Life is not physical but manifests physically through Events.  


====================================================================
11. SPATIAL AND RELATIONAL RULES
====================================================================

11.1 NOTHING EXISTS WITHOUT LOCATION  
- Every entity is directly or indirectly located.  
- Internal processes occur where the Person is.  

11.2 RELATIVE LOCATIONS  
- Locations may relate via containment, adjacency, direction, and proxy.  
- “At Cookridge” may mean a specific home.  
- “At the Louvre” means in Paris.  

11.3 LOCATION IS PART OF CONTEXT  
- It affects perception, action possibilities, behaviour, emotional tone.  


====================================================================
12. SUMMARY OF ACTIVE VS CONCEPTUAL ENTITIES
====================================================================

ACTIVE (require structure, drive behaviour):  
- Time  
- Location  
- Person  
- Internal State  
- Objects  
- Events  
- Memories  
- Relationships  
- Stories  
- Intentions / Plans  
- Calendars (simple, application-like)

CONCEPTUAL (exist but do not require full implementation yet):  
- strengths/flaws as separate schema  
- emotional maps of locations  
- complex group structures  
- background world modelling  
- detailed Life categories  

====================================================================
END OF ONTOLOGY
====================================================================