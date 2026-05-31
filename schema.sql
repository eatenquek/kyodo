create extension if not exists "pgcrypto";

-- Trigger function for automatic updated_at
create or replace function update_updated_at_column()
returns trigger as $$
begin
  new.updated_at = now();
  return new;
end;
$$ language plpgsql;

-- Profiles table
create table if not exists profiles (
  id uuid primary key references auth.users(id) on delete cascade,
  full_name text not null,
  university text,
  course text,
  year_of_study int,
  preferred_role text not null,
  bio text,
  onboarding_completed boolean not null default false,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create index if not exists profiles_created_at_idx on profiles(created_at);

create trigger update_profiles_updated_at
before update on profiles
for each row
execute function update_updated_at_column();

-- Questionnaire answers table
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references profiles(id) on delete cascade,
  question_id text not null,
  dimension text not null,
  answer_value int not null check (answer_value between 1 and 5),
  is_reverse_scored boolean not null default false,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  unique (user_id, question_id)
);

create index if not exists questionnaire_answers_user_id_idx on questionnaire_answers(user_id);
create index if not exists questionnaire_answers_dimension_idx on questionnaire_answers(dimension);

create trigger update_questionnaire_answers_updated_at
before update on questionnaire_answers
for each row
execute function update_updated_at_column();

-- Personality results table
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references profiles(id) on delete cascade,
  planning_score int not null check (planning_score between 0 and 100),
  communication_score int not null check (communication_score between 0 and 100),
  leadership_score int not null check (leadership_score between 0 and 100),
  pace_score int not null check (pace_score between 0 and 100),
  conflict_score int not null check (conflict_score between 0 and 100),
  detail_score int not null check (detail_score between 0 and 100),
  collaboration_score int not null check (collaboration_score between 0 and 100),
  result_label text not null,
  summary_text text not null,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create index if not exists personality_results_user_id_idx on personality_results(user_id);
create index if not exists personality_results_created_at_idx on personality_results(created_at);

create trigger update_personality_results_updated_at
before update on personality_results
for each row
execute function update_updated_at_column();

create table if not exists teams (
  id uuid primary key default gen_random_uuid(),
  name text not null,
  project_name text,
  description text,
  join_code text not null unique,
  created_by uuid not null references profiles(id) on delete cascade,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create index if not exists teams_created_by_idx on teams(created_by);
create index if not exists teams_join_code_idx on teams(join_code);
create index if not exists teams_created_at_idx on teams(created_at);

create trigger update_teams_updated_at
before update on teams
for each row
execute function update_updated_at_column();

create table if not exists team_members (
  id uuid primary key default gen_random_uuid(),
  team_id uuid not null references teams(id) on delete cascade,
  user_id uuid not null references profiles(id) on delete cascade,
  role text not null default 'member',
  joined_at timestamptz not null default now(),
  unique (team_id, user_id)
);

create index if not exists team_members_team_id_idx on team_members(team_id);
create index if not exists team_members_user_id_idx on team_members(user_id);

create table if not exists compatibility_results (
  id uuid primary key default gen_random_uuid(),
  team_id uuid not null references teams(id) on delete cascade,
  score int not null check (score between 0 and 100),
  score_label text not null,
  strengths jsonb not null default '[]'::jsonb,
  frictions jsonb not null default '[]'::jsonb,
  tips jsonb not null default '[]'::jsonb,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create index if not exists compatibility_results_team_id_idx on compatibility_results(team_id);
create index if not exists compatibility_results_created_at_idx on compatibility_results(created_at);

create trigger update_compatibility_results_updated_at
before update on compatibility_results
for each row
execute function update_updated_at_column();

-- Enable RLS on all tables
alter table profiles enable row level security;
alter table questionnaire_answers enable row level security;
alter table personality_results enable row level security;
alter table teams enable row level security;
alter table team_members enable row level security;
alter table compatibility_results enable row level security;

-- ============================================================================
-- Row-Level Security Policies
-- ============================================================================

-- Profiles: Users can manage their own profile, authenticated users can view all
create policy "Users manage own profile" on profiles
  for all using (auth.uid() = id) with check (auth.uid() = id);

create policy "Authenticated users can view profiles" on profiles
  for select using (auth.uid() is not null);

-- Questionnaire answers: Users can manage their own answers
create policy "Users manage own answers" on questionnaire_answers
  for all using (auth.uid() = user_id) with check (auth.uid() = user_id);

-- Personality results: Users can manage their own results, authenticated users can view
create policy "Users manage own results" on personality_results
  for all using (auth.uid() = user_id) with check (auth.uid() = user_id);

create policy "Authenticated users can view results" on personality_results
  for select using (auth.uid() is not null);

-- Teams: Authenticated users can view all teams, only creators can insert
create policy "Authenticated users can view teams" on teams
  for select using (auth.uid() is not null);

create policy "Users can create teams" on teams
  for insert with check (auth.uid() = created_by);

-- Team members: Authenticated users can view memberships, users can join/leave
create policy "Authenticated users can view memberships" on team_members
  for select using (auth.uid() is not null);

create policy "Users can join teams" on team_members
  for insert with check (auth.uid() = user_id);

create policy "Users can leave teams" on team_members
  for delete using (auth.uid() = user_id);

-- Compatibility results: Only team members can view and create
create policy "Team members can view compatibility" on compatibility_results
  for select using (
    exists (
      select 1 from team_members
      where team_members.team_id = compatibility_results.team_id
      and team_members.user_id = auth.uid()
    )
  );

create policy "Team members can create compatibility" on compatibility_results
  for insert with check (
    exists (
      select 1 from team_members
      where team_members.team_id = compatibility_results.team_id
      and team_members.user_id = auth.uid()
    )
  );
