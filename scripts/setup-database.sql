-- ============================================================
-- FlowTrack — Supabase Database Setup
-- Run this entire script in the Supabase SQL Editor (one shot).
-- It is safe to re-run: uses IF NOT EXISTS and ON CONFLICT.
-- ============================================================

-- ┌──────────────────────────────────────────────────────────┐
-- │  1. TABLES                                               │
-- └──────────────────────────────────────────────────────────┘

-- Tasks — the SINGLE source of truth for all analytics
CREATE TABLE IF NOT EXISTS tasks (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID,
  title VARCHAR(255) NOT NULL,
  description TEXT,
  status VARCHAR(20) NOT NULL DEFAULT 'todo',
  priority VARCHAR(20) NOT NULL DEFAULT 'medium',
  assignee UUID REFERENCES team_members(id),
  estimated_value INTEGER NOT NULL DEFAULT 10,
  completed_at TIMESTAMP WITH TIME ZONE,
  deleted_at TIMESTAMP WITH TIME ZONE,
  due_date TIMESTAMP WITH TIME ZONE,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Team members
CREATE TABLE IF NOT EXISTS team_members (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES auth.users(id),
  workspace_id UUID,
  name VARCHAR(255) NOT NULL,
  email VARCHAR(255) UNIQUE NOT NULL,
  avatar_url VARCHAR(500),
  avatar_color VARCHAR(20) DEFAULT 'blue',
  phone VARCHAR(50),
  joined_date TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  role VARCHAR(100) NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Activity logs
CREATE TABLE IF NOT EXISTS activity_logs (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID,
  action VARCHAR(100) NOT NULL,
  entity_type VARCHAR(50) NOT NULL,
  entity_id UUID,
  details TEXT,
  resource_type VARCHAR(50),
  resource_id UUID,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- ┌──────────────────────────────────────────────────────────┐
-- │  2. ADD COLUMNS TO EXISTING TABLES (safe migration)     │
-- │     Use this section if tables already exist without     │
-- │     the new columns.                                     │
-- └──────────────────────────────────────────────────────────┘

DO $$
BEGIN
  -- Add estimated_value to tasks if missing
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'tasks' AND column_name = 'estimated_value'
  ) THEN
    ALTER TABLE tasks ADD COLUMN estimated_value INTEGER NOT NULL DEFAULT 10;
  END IF;

  -- Add deleted_at to tasks if missing
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'tasks' AND column_name = 'deleted_at'
  ) THEN
    ALTER TABLE tasks ADD COLUMN deleted_at TIMESTAMP WITH TIME ZONE;
  END IF;

  -- Add assignee to tasks if missing (or try altering it if it exists as VARCHAR)
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'tasks' AND column_name = 'assignee'
  ) THEN
    ALTER TABLE tasks ADD COLUMN assignee UUID REFERENCES team_members(id);
  END IF;

  -- Add user_id to tasks if missing
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'tasks' AND column_name = 'user_id'
  ) THEN
    ALTER TABLE tasks ADD COLUMN user_id UUID;
  END IF;

  -- Add avatar_color to team_members if missing
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'team_members' AND column_name = 'avatar_color'
  ) THEN
    ALTER TABLE team_members ADD COLUMN avatar_color VARCHAR(20) DEFAULT 'blue';
  END IF;

  -- Add phone to team_members if missing
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'team_members' AND column_name = 'phone'
  ) THEN
    ALTER TABLE team_members ADD COLUMN phone VARCHAR(50);
  END IF;

  -- Add joined_date to team_members if missing
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'team_members' AND column_name = 'joined_date'
  ) THEN
    ALTER TABLE team_members ADD COLUMN joined_date TIMESTAMP WITH TIME ZONE DEFAULT NOW();
  END IF;
END
$$;

-- ┌──────────────────────────────────────────────────────────┐
-- │  3. MIGRATE OLD STATUS VALUES                            │
-- │     pending  → todo                                      │
-- │     active   → in_progress                               │
-- │     in-progress → in_progress (hyphen fix)               │
-- └──────────────────────────────────────────────────────────┘

UPDATE tasks SET status = 'todo' WHERE status = 'pending';
UPDATE tasks SET status = 'in_progress' WHERE status IN ('active', 'in-progress');

-- ┌──────────────────────────────────────────────────────────┐
-- │  4. SET estimated_value FOR EXISTING TASKS               │
-- └──────────────────────────────────────────────────────────┘

UPDATE tasks SET estimated_value = 10 WHERE estimated_value IS NULL;

-- Set completed_at for tasks already marked completed (approximate with updated_at)
UPDATE tasks SET completed_at = COALESCE(updated_at, created_at)
WHERE status = 'completed' AND completed_at IS NULL;

-- ┌──────────────────────────────────────────────────────────┐
-- │  5. AUTO-CREATE TEAM MEMBER TRIGGER LOGIC                │
-- └──────────────────────────────────────────────────────────┘

-- Automatically insert a row into team_members when a new user signs up in auth.users
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS trigger AS $$
BEGIN
  INSERT INTO public.team_members (user_id, email, name, role)
  VALUES (
    new.id,
    new.email,
    COALESCE(new.raw_user_meta_data->>'full_name', split_part(new.email, '@', 1)),
    'member'
  );
  RETURN new;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Create the trigger if it doesn't exist
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_trigger WHERE tgname = 'on_auth_user_created'
  ) THEN
    CREATE TRIGGER on_auth_user_created
      AFTER INSERT ON auth.users
      FOR EACH ROW EXECUTE FUNCTION public.handle_new_user();
  END IF;
END
$$;

-- ┌──────────────────────────────────────────────────────────┐
-- │  6. ROW LEVEL SECURITY                                   │
-- └──────────────────────────────────────────────────────────┘

ALTER TABLE tasks ENABLE ROW LEVEL SECURITY;
ALTER TABLE team_members ENABLE ROW LEVEL SECURITY;
ALTER TABLE activity_logs ENABLE ROW LEVEL SECURITY;

-- Allow authenticated users full access (adjust for your needs)
DO $$
BEGIN
  -- Tasks policies
  IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE tablename = 'tasks' AND policyname = 'tasks_select_auth') THEN
    CREATE POLICY tasks_select_auth ON tasks FOR SELECT TO authenticated USING (true);
  END IF;
  IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE tablename = 'tasks' AND policyname = 'tasks_insert_auth') THEN
    CREATE POLICY tasks_insert_auth ON tasks FOR INSERT TO authenticated WITH CHECK (true);
  END IF;
  IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE tablename = 'tasks' AND policyname = 'tasks_update_auth') THEN
    CREATE POLICY tasks_update_auth ON tasks FOR UPDATE TO authenticated USING (true) WITH CHECK (true);
  END IF;
  IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE tablename = 'tasks' AND policyname = 'tasks_delete_auth') THEN
    CREATE POLICY tasks_delete_auth ON tasks FOR DELETE TO authenticated USING (true);
  END IF;

  -- Team members policies
  IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE tablename = 'team_members' AND policyname = 'team_select_auth') THEN
    CREATE POLICY team_select_auth ON team_members FOR SELECT TO authenticated USING (true);
  END IF;

  -- Activity logs policies
  IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE tablename = 'activity_logs' AND policyname = 'logs_select_auth') THEN
    CREATE POLICY logs_select_auth ON activity_logs FOR SELECT TO authenticated USING (true);
  END IF;
  IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE tablename = 'activity_logs' AND policyname = 'logs_insert_auth') THEN
    CREATE POLICY logs_insert_auth ON activity_logs FOR INSERT TO authenticated WITH CHECK (true);
  END IF;
END
$$;

-- ============================================================
-- Done! Your FlowTrack database is ready.
-- Tables: tasks, team_members, activity_logs
-- Productivity value is derived from tasks.
-- ============================================================
