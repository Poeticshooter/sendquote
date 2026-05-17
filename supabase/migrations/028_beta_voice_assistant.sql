-- Migration 028: Add beta_voice_assistant flag to profiles
-- Gates the voice assistant behind a beta toggle for controlled rollout

ALTER TABLE profiles ADD COLUMN IF NOT EXISTS beta_voice_assistant boolean NOT NULL DEFAULT false;
