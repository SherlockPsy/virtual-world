-- db/schema.sql
-- Direct SQL schema for VirLife Stage 0
-- Run this against the Railway Postgres instance using the provided connection string.
-- No local DB, no migrations framework.

-- Enable UUID generation extension (if not already enabled).
-- If "uuid-ossp" is not available, "pgcrypto" + gen_random_uuid() may be used instead.
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- USERS TABLE
CREATE TABLE IF NOT EXISTS users (
    id          UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    created_at  TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- WORLDS TABLE
CREATE TABLE IF NOT EXISTS worlds (
    id          UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    user_id     UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    name        TEXT NOT NULL,
    created_at  TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- WORLD STATES TABLE
CREATE TABLE IF NOT EXISTS world_states (
    id          UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    world_id    UUID NOT NULL UNIQUE REFERENCES worlds(id) ON DELETE CASCADE,
    state       JSONB NOT NULL,
    updated_at  TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- MESSAGES TABLE
CREATE TABLE IF NOT EXISTS messages (
    id          UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    world_id    UUID NOT NULL REFERENCES worlds(id) ON DELETE CASCADE,
    role        TEXT NOT NULL CHECK (role IN ('user', 'assistant')),
    content     TEXT NOT NULL,
    created_at  TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- OPTIONAL INDEXES FOR PERFORMANCE

-- Messages lookup by world and time
CREATE INDEX IF NOT EXISTS idx_messages_world_id_created_at
ON messages (world_id, created_at);

-- World states lookup by world
CREATE INDEX IF NOT EXISTS idx_world_states_world_id
ON world_states (world_id);