-- USERS
create table if not exists users (
  id uuid references auth.users not null primary key,
  email text
);

-- STRATEGY (The Brain)
create table if not exists strategy (
  user_id uuid references users(id),
  objectives jsonb -- [{'title': 'Launch LLC', 'value': 10000}]
);

-- TASKS
create table if not exists tasks (
  id uuid default gen_random_uuid() primary key,
  user_id uuid references users(id),
  title text not null,
  status text check (status in ('todo', 'done', 'snooze', 'conflict')),
  
  -- T.I.D.E. Data
  impact_score int default 1, -- 1-10
  financial_value float default 0, -- Virtual Dollar Value
  deadline timestamptz,
  effort_hours float default 1.0,
  urgency float default 1.0, -- Added explicitly for the generated column
  
  -- Generates ROI Score automatically
  roi_score float generated always as ((power(impact_score, 2) * urgency) / effort_hours) stored,
  
  -- Context
  context_tags text[], -- ['tax', 'llc', 'personal']
  evidence_required boolean default false, -- True if Impact > $1000

  -- Execution State
  is_focus boolean default false,
  completed_at timestamptz
);
