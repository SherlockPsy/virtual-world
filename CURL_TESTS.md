All tests must hit your production Railway URL, never localhost.

# CURL_TESTS.md

All testing MUST be performed using `curl` against the production URL:

https://virtual-world-production.up.railway.app

No localhost.
No Postman or GUI tools.
No other hosts.

---

## 1. Test: GET /api/world/state (initial load)

This call:
- creates a new user + world + initial state if none exist,
- or loads the last known world for that user/world if IDs are provided.

### 1.1 First-time call (no IDs)

```bash
curl -X GET "https://virtual-world-production.up.railway.app/api/world/state" \
  -H "Content-Type: application/json" \
  -d '{"userId": null, "worldId": null}'

Expected:
	•	200 OK
	•	JSON response containing:
	•	userId
	•	worldId
	•	messages (may be empty or contain initial assistant content depending on implementation)

Example shape:

{
  "userId": "some-uuid",
  "worldId": "some-uuid",
  "messages": []
}

1.2 Subsequent calls (with IDs)

Replace USER_ID_HERE and WORLD_ID_HERE with actual values from previous responses:

curl -X GET "https://virtual-world-production.up.railway.app/api/world/state" \
  -H "Content-Type: application/json" \
  -d '{"userId": "USER_ID_HERE", "worldId": "WORLD_ID_HERE"}'


⸻

2. Test: POST /api/world/chat (send a message to the world)

This call:
	•	sends a new user message,
	•	triggers world-output LLM call,
	•	triggers state-update LLM call (hidden),
	•	persists updated messages & world_state,
	•	returns the world’s response.

2.1 First message (no IDs yet)

curl -X POST "https://virtual-world-production.up.railway.app/api/world/chat" \
  -H "Content-Type: application/json" \
  -d '{
    "userId": null,
    "worldId": null,
    "message": "Good morning. I could not sleep last night, my head is full of this consciousness debate."
  }'

Expected:
	•	200 OK
	•	JSON response containing:
	•	userId
	•	worldId
	•	worldOutput (rich text representing the present moment with Rebecca / the house)

Example shape:

{
  "userId": "some-uuid",
  "worldId": "some-uuid",
  "worldOutput": "Kitchen — Early Morning\n\nRebecca stands by the counter..."
}

Store userId and worldId from this response for subsequent calls.

2.2 Subsequent messages (with IDs)

Use the IDs returned from a previous response:

curl -X POST "https://virtual-world-production.up.railway.app/api/world/chat" \
  -H "Content-Type: application/json" \
  -d '{
    "userId": "USER_ID_HERE",
    "worldId": "WORLD_ID_HERE",
    "message": "I walk over to you and hug you from behind."
  }'

Expected:
	•	200 OK
	•	Updated worldOutput continuing the same world and moment.

⸻

3. Test: continuity across calls
	1.	Call POST /api/world/chat with a message.
	2.	Call GET /api/world/state with the same userId and worldId.
	3.	Confirm that:
	•	the latest assistant and user messages are present,
	•	the world’s response is continuous (no reset of context),
	•	time/location/relationship behaviour feels consistent over multiple calls.

⸻

4. Notes
	•	All calls must use https://virtual-world-production.up.railway.app.
	•	Do NOT use localhost, 127.0.0.1, or any other domain.
	•	These curl commands are the only approved testing method in Stage 0.

