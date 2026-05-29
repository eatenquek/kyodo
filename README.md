# KyodoAI

KyodoAI helps university students form better project teams through a work-style check-in, saved mock compatibility insights, and practical collaboration tips.

## Project Overview

This repository contains the Milestone 1 proof of concept. The current app is an Expo React Native prototype with Supabase-backed auth/data when credentials are present, plus a local fallback demo when they are not.

Core Milestone 1 loop:

- Sign up or log in
- Create a student profile
- Complete a 21-question work-style check-in
- Generate a deterministic mock work-style result
- Create or join a team with a code
- View team compatibility, strengths, friction points, and tips

## Problem Motivation

Student teams are often formed by friendship, availability, or random allocation, while project success depends on expectations, planning, communication, pace, and conflict habits. KyodoAI gives teams a structured way to discuss those habits early.

## Target Users

University project teams, Orbital teams, hackathon groups, module project groups, and student club project teams.

## Core Features

- Email/password auth screens backed by Supabase when configured
- Profile setup with name, university, course, year, role, and bio
- 21-question questionnaire across seven dimensions
- Mock scoring engine with reverse scoring and result labels
- Team creation and join-code flow
- Multiple teams per user, with Home showing all joined/created teams
- Leave-team action from Home or the selected Team screen
- Compatibility scoring with constructive insight rules
- Home, Team, Compatibility, Tips, and Profile screens

## Tech Stack

- Expo React Native
- Expo Router
- TypeScript
- Supabase client, backend adapter, and SQL schema
- AsyncStorage for local fallback demo persistence

## System Architecture

Expo app screens call a shared app state layer. When Supabase environment variables are present, that layer uses Supabase Auth and database tables. Without those variables, it uses local demo state. The scoring services are pure TypeScript functions.

Planned data flow:

Profile setup -> `profiles`
Questionnaire -> `questionnaire_answers`
Scoring service -> `personality_results`
Create/join team -> `teams` and `team_members`
Compatibility service -> `compatibility_results`

## Database Schema

The Supabase schema is in [supabase/schema.sql](/Users/quekee/Desktop/repos/KyodoAI/supabase/schema.sql).

Tables:

- `profiles`
- `questionnaire_answers`
- `personality_results`
- `teams`
- `team_members`
- `compatibility_results`

## UI Design Direction

The UI follows the Milestone 1 blueprint: calm off-white background, white and muted cards, green accent actions, compact forms, horizontal score bars, and constructive copy for friction points.

## Milestone 1 Progress

Implemented:

- App scaffold and Expo Router route groups
- Auth, onboarding, questionnaire, result, tabs, team, compatibility, tips, and profile screens
- Local persistence with AsyncStorage
- Questionnaire and compatibility scoring services
- Supabase Auth and CRUD wiring for profile, answers, results, teams, memberships, and compatibility
- Supabase SQL schema


## Setup Instructions

1. Install dependencies: `npm install`
2. Copy `.env.example` to `.env.local`
3. Add Supabase values if using a real backend
4. Run the app: `npm run start`




