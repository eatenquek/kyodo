# KyodoAI — Project Gemini Milestone 2 README

## Project title, team members, and target LOA

**Project title:** KyodoAI

**Team members:** Malvika and Ethan

**Target LOA:** Project Gemini

**Milestone:** Milestone 2

**Project type:** Mobile-first team formation and compatibility application

**Primary platform:** Expo React Native

**Primary stack:** TypeScript, Expo Router, React Native, Supabase

KyodoAI is our attempt to make team formation feel less like guesswork. It is a student-focused teammate matching and team-awareness app that helps university students complete a work-style questionnaire, understand how they usually work with others, create or join project teams, and view compatibility insights before problems appear.



---

## What to look for in the demo

For Milestone 2, the main demo flow is:

1. Register or log in.
2. Complete the user profile.
3. Complete the 15-question work-style questionnaire.
4. View the generated work-style profile.
5. Create or join a team.
6. Generate compatibility insights.
7. View the best group split suggestion for a chosen team size.

This is the core pushed app flow. The AI coach is listed later as a Milestone 3 extension, not as part of the current demo.

---

# Notes (post-milestone 2)

Quick notes on stuff added after the milestone 2 write-up below — the sections
numbered 1-22 further down are the original submission doc.

One thing to keep in mind with compatibility results: treat them as a
conversation starter, not a diagnosis. Don't use language that says a team or
person is "incompatible" or "toxic" or "scientifically matched" — it's just
self-reported work-style preferences, not a real measurement of anyone.

**Running it**
- No backend: `npm run web:local`
- With Supabase: copy `.env.example` to `.env.local`, fill in the URL/anon key, then `npm run web`
- Tests: `npm test` / `npm run typecheck`

**What's working:** auth, profile, questionnaire, scoring, teams, compatibility
report (full record now, not just a summary), group split, the onboarding tracker
on Home, teammate work-style notes, rotating a team's join code.

**AI coach:** needs the edge function deployed and `OPENAI_API_KEY` set, otherwise
it just shows an error instead of crashing.

**Not built yet:** instructor/cohort mode, availability matching, push
notifications, live/realtime updates.

Compatibility scores now show as a band + range (e.g. "Workable · 59-73") instead
of a bare percentage, since a 15-item questionnaire isn't precise enough to justify
one.

**Known gaps**
- questionnaire is self-reported, not a validated instrument
- group split search caps out above ~50k combinations, exact below that
- local (no-backend) mode is single device, "auth" just checks a known email,
  and only holds one profile at a time (switching accounts on the same device
  wipes the previous one's local data)
- no realtime — refresh to see teammate updates
- no component/e2e tests, backend query layer only manually tested
- a join code still works for anyone who has it until it's rotated

**Todo**
- a11y roles on remaining buttons
- per-account local storage (currently just one slot)
- refetch team data when a screen comes back into focus
- instructor/cohort mode for splitting a whole class into teams
- availability as a matching input alongside work style


# Table of contents

1. [Problem motivation](#1-problem-motivation)
2. [Target users](#2-target-users)
3. [User stories and use cases](#3-user-stories-and-use-cases)
4. [Features implemented for Milestone 2](#4-features-implemented-for-milestone-2)
5. [What changed from Milestone 1](#5-what-changed-from-milestone-1)
6. [Tech stack](#6-tech-stack)
7. [System architecture](#7-system-architecture)
8. [Database schema](#8-database-schema)
9. [Authentication flow](#9-authentication-flow)
10. [Questionnaire scoring logic](#10-questionnaire-scoring-logic)
11. [Work-style profile generation](#11-work-style-profile-generation)
12. [Team compatibility logic](#12-team-compatibility-logic)
13. [Best-team-matching logic](#13-best-team-matching-logic)
14. [Frontend walkthrough and commit evidence](#14-frontend-walkthrough-and-commit-evidence)
15. [Testing strategy](#15-testing-strategy)
16. [System test cases and results](#16-system-test-cases-and-results)
17. [Bugs encountered and fixes](#17-bugs-encountered-and-fixes)
18. [SWE and design principles](#18-swe-and-design-principles)
19. [Project management and GitHub usage](#19-project-management-and-github-usage)
20. [Limitations](#20-limitations)
21. [Milestone 3 plan](#21-milestone-3-plan)
22. [Setup and run instructions](#22-setup-and-run-instructions)


---

# 1. Problem motivation

University students spend a lot of time working in teams, whether it is for module projects, Orbital, hackathons, clubs, or short-term assignments. In many cases, teams are formed through friendship, convenience, availability, or random allocation. Those methods are easy, but they do not really tell us how people will work together once deadlines, decisions, and stress enter the picture.

Many team problems do not happen because students are incapable. They happen because students discover their differences too late. One person may want to plan early, while another is comfortable starting before every detail is clear. One person may expect frequent check-ins, while another prefers long stretches of independent work. Two people may both naturally step into coordination roles without realising that they are about to clash. None of these differences are “bad”, but they can become stressful when teams only notice them near the deadline.

Common collaboration problems include:

- uneven workload distribution;
- unclear ownership of tasks;
- missed or rushed deadlines;
- mismatched communication expectations;
- different quality standards;
- uncertainty about who should coordinate;
- discomfort raising disagreement;
- confusion over how fast the team should move;
- lack of early conversation about working habits.

KyodoAI is designed to bring these hidden expectations into the open earlier. Instead of judging whether someone is a “good” or “bad” teammate, the app turns questionnaire answers into work-style signals and team-level compatibility explanations. The goal is simple: help teams have better conversations before the project becomes messy.

We intentionally treat compatibility as a discussion aid, not a final verdict. A lower score does not mean a team cannot succeed, and a higher score does not guarantee that everything will be smooth. What the app does is point students toward the things worth clarifying early, such as pace, role ownership, coordination style, and communication rhythm.

---

# 2. Target users

KyodoAI is built mainly for university students who need to form, join, or manage project teams.

Primary target users:

- students forming Orbital teams;
- students working on module projects;
- students joining project groups with people they do not know well;
- students who want to understand their own teamwork preferences;
- students who want a structured way to discuss team expectations;
- student clubs or informal project teams that need quick team formation.

Secondary future users:

- teaching assistants or instructors who want to support healthier group formation;
- student leaders organising cohorts or project teams;
- mentors who want a quick view of team risks and strengths.

For Milestone 2, we focused on the student-facing experience. Instructor dashboards and admin matching tools are possible future extensions, but they are not part of the current build.

---

# 3. User stories and use cases

## 3.1 Individual student user stories

As a student, I want to create an account so that my profile, questionnaire answers, teams, and results are associated with me.

As a student, I want to complete a short profile so that teammates can see basic information such as my name, course, year, and preferred role.

As a student, I want to complete a work-style questionnaire so that I can understand how I tend to work in teams.

As a student, I want to see my work-style result in simple language so that I can understand my strengths and watch-outs without reading raw scores only.

As a student, I want to retake or resume the questionnaire so that my result can be updated if my answers are incomplete or no longer accurate.

## 3.2 Team use cases

As a student, I want to create a team so that my project group has a shared space inside KyodoAI.

As a student, I want to join a team using a join code so that I can enter a teammate’s project group easily.

As a team member, I want to view all members in a team so that I can see who is profile-ready and who still needs to complete the questionnaire.

As a team member, I want to generate compatibility insights so that the team can discuss strengths, possible friction, and next steps.

As a team member, I want to leave a team if I joined the wrong group or am no longer participating.

## 3.3 Matching use cases

As a group organiser, I want to see the best way to split a larger pool into smaller teams so that groups are more balanced.

As a project team, I want to choose a target team size so that the app can suggest groups of 2, 3, 4, or another practical size.

As a team member, I want the app to handle remainders fairly so that one smaller or larger team is still optimised instead of being treated as leftover.

---

# 4. Features implemented for Milestone 2

Milestone 2 is where KyodoAI becomes much more than a login screen. A student can now go through the main journey: create an account, set up a profile, answer the questionnaire, receive a work-style result, create or join a team, generate compatibility insights, and explore suggested group splits.

## 4.1 Authentication

What we added:

- email/password registration;
- email/password login;
- Supabase Auth integration;
- session persistence through Supabase client and AsyncStorage;
- sign-out flow;
- handling for email confirmation when Supabase requires confirmation;
- fallback local state behaviour when Supabase is not configured.

## 4.2 Profile setup and editing

What we added:

- editable profile modal;
- full name;
- university;
- course;
- year of study;
- preferred role;
- short bio;
- profile completion state;
- profile values displayed on the Profile tab.

## 4.3 Questionnaire flow

What we added:

- dedicated `/questionnaire` route;
- 15 work-style questions;
- 5-point Likert answer options;
- progress indicator;
- back and next navigation;
- resume from first unanswered question;
- validation that all questions must be answered before generating a result.

## 4.4 Work-style result generation

What we added:

- deterministic scoring from questionnaire answers;
- ten work-style signals:
  - planning;
  - communication;
  - leadership;
  - pace;
  - conflict;
  - detail;
  - initiative;
  - flexibility;
  - accountability;
  - decision comfort;
- primary and secondary work-style tendencies;
- strengths;
- watch-outs;
- teammate notes;
- collapsible score details in Profile.

## 4.5 Team management

What we added:

- create team;
- join team with code;
- display joined teams;
- select active team;
- display team details;
- show member readiness status;
- leave team modal and leave-team flow;
- Supabase-backed team persistence when configured.

## 4.6 Team compatibility insights

What we added:

- compatibility score for existing teams;
- pair fit score;
- role coverage score;
- coordination health score;
- suggested coordinator;
- role coverage cards;
- strengths;
- watch-outs;
- next steps;
- ability to refresh insights.

## 4.7 Best team matching

What we added:

- best group split card;
- target team size selector;
- exact search over possible valid groupings within a safety cap;
- support for remainders;
- example split handling:
  - 8 users with target 3 → `3 / 3 / 2`;
  - 10 users with target 3 → `4 / 3 / 3`;
  - 11 users with target 4 → `4 / 4 / 3`;
- grouping output with:
  - overall score;
  - average team score;
  - weakest team score;
  - balance score;
  - suggested groups;
  - suggested coordinator and strengths per group.

---

# 5. What changed from Milestone 1

Milestone 1 was mainly our foundation stage. We had authentication, navigation, theming, and basic tabs, but the app was still closer to a shell than a complete teammate-matching product. Milestone 2 is where we built the core product logic.

## 5.1 Milestone 1 state

Milestone 1 included:

- Expo React Native setup;
- TypeScript setup;
- Expo Router navigation;
- Supabase Auth setup;
- welcome screen;
- register screen;
- login screen;
- signed-in home screen;
- placeholder Teams and Profile tabs;
- reusable UI theme.

At that point, the app could prove that users could enter the system, but it could not yet answer the main product question: “Would this help students form better teams?”

## 5.2 Milestone 2 additions

Milestone 2 adds:

- functional profile screen and edit modal;
- questionnaire screen;
- 15-question work-style questionnaire;
- strict scoring model;
- work-style result cards;
- team creation and joining;
- team member display;
- leave-team flow;
- compatibility scoring;
- role coverage and coordination analysis;
- best-team-matching suggestions;
- richer Supabase integration for profiles, answers, results, teams, team memberships, and compatibility.

## 5.3 Why we prioritised scoring before AI

During Milestone 2, we deliberately prioritised the questionnaire → result → team compatibility flow before building the AI coach. The reason was that we wanted the core matching system to be deterministic first.

If the scoring model was unclear, an AI explanation layer would only make the app sound more polished without making it more trustworthy. By building the scoring model first, we made sure that the app could produce repeatable results before adding any future natural-language coaching.

## 5.4 Product maturity improvement

The app is no longer just a prototype shell. A user can now complete the core journey:

1. sign up or sign in;
2. complete a profile;
3. answer the questionnaire;
4. view their work-style result;
5. create or join a team;
6. generate team compatibility insights;
7. use best-team-matching suggestions for larger groups.

This is the main Milestone 2 product value.

---

# 6. Tech stack

## 6.1 Frontend

- **Expo React Native** for cross-platform mobile-first development.
- **React Native Web** for web preview.
- **TypeScript** for type safety.
- **Expo Router** for file-based navigation.
- **React hooks and context** for app state.
- **Ionicons** for icons.

## 6.2 Backend and data

- **Supabase Auth** for email/password authentication.
- **Supabase database** for persisted profiles, questionnaire answers, results, teams, memberships, and compatibility data.
- **Supabase JavaScript client** for frontend-to-backend interaction.
- **AsyncStorage** for local persistence fallback and session storage support.

## 6.3 Development tooling

- `npm` for dependency management.
- `tsc --noEmit` for TypeScript checks.
- Expo CLI through `npx expo`.
- Git and GitHub for version control.

## 6.4 Not included as implemented in this README

The pushed Milestone 2 app does not include deployed OpenAI functionality. We have thought through the AI coach direction, but it is treated as future work in this README rather than a completed feature.

---

# 7. System architecture

KyodoAI is organised as a mobile-first application with the main responsibilities kept separate: screens handle interaction, reusable components handle repeated UI, app state keeps the experience consistent, Supabase helpers talk to the backend, and scoring services handle the matching logic.

## 7.1 High-level architecture

```text
User
  ↓
Expo React Native app
  ↓
Expo Router screens
  ↓
App state context
  ↓
Scoring services + Supabase backend helpers
  ↓
Supabase Auth and database
```

## 7.2 Main frontend layers

### Routes and screens

The `app/` directory contains file-based routes:

- authentication screens under `app/(auth)/`;
- signed-in tabs under `app/(tabs)/`;
- questionnaire route at `app/questionnaire.tsx`;
- root routing in `app/_layout.tsx` and `app/index.tsx`.

### Components

The `components/` directory contains shared UI and team/profile-specific components:

- reusable UI primitives in `components/ui.tsx`;
- profile modal in `components/profile/ProfileFormModal.tsx`;
- team detail card in `components/teams/TeamDetails.tsx`;
- team creation/join modal in `components/teams/TeamFormModal.tsx`;
- leave confirmation modal in `components/teams/LeaveTeamModal.tsx`.

### App state

`lib/appState.tsx` provides the main app context. It manages:

- current user;
- registered local emails fallback;
- profile;
- questionnaire answers;
- personality result;
- teams;
- active team;
- compatibility results;
- actions such as sign in, sign up, save profile, save answer, complete questionnaire, create team, join team, leave team, and generate compatibility.

### Backend helpers

`lib/supabase/backend.ts` maps frontend domain models to Supabase rows. It handles:

- loading a complete backend snapshot;
- saving profiles;
- saving answers;
- saving questionnaire results;
- creating teams;
- joining teams;
- leaving teams;
- saving compatibility results.

### Scoring services

The `services/scoring/` directory contains deterministic logic:

- `questionnaireScoring.ts` converts answers into work-style scores;
- `workstyleProfile.ts` turns scores into readable profile tendencies;
- `compatibilityScoring.ts` scores existing teams;
- `teamFormation.ts` searches for best group splits.

## 7.3 Why deterministic logic is used

Compatibility and matching logic is deterministic. This means the same profiles and answers will produce the same team score and grouping suggestions. We chose this because team matching should be explainable, repeatable, and fair. Natural language AI can be added later to make explanations friendlier, but the actual matching decision should remain controlled by the app’s scoring algorithm.

---

# 8. Database schema

The current app expects a Supabase project with tables for users’ profiles, questionnaire data, results, teams, team memberships, and compatibility results.

The important tables are:

```text
profiles
questionnaire_answers
personality_results
teams
team_members
compatibility_results
```

## 8.1 `profiles`

Stores user profile data.

Expected fields include:

- `id` — user id, matching the Supabase Auth user id;
- `full_name`;
- `university`;
- `course`;
- `year_of_study`;
- `preferred_role`;
- `bio`;
- `onboarding_completed`;
- `updated_at`.

The app reads this table to show the Profile tab and member names inside teams.

## 8.2 `questionnaire_answers`

Stores each answer a user gives in the questionnaire.

Expected fields include:

- `user_id`;
- `question_id`;
- `dimension`;
- `answer_value`;
- `is_reverse_scored`;
- `updated_at`.

The app upserts answers by `user_id` and `question_id`, allowing users to resume the questionnaire without losing progress.

## 8.3 `personality_results`

Stores generated work-style results.

Expected score fields include:

- `planning_score`;
- `communication_score`;
- `leadership_score`;
- `pace_score`;
- `conflict_score`;
- `detail_score`;
- `initiative_score`;
- `flexibility_score`;
- `accountability_score`;
- `decision_comfort_score`;
- `questionnaire_version`;
- `result_label`;
- `summary_text`;
- `created_at`.

The app only treats a result as current when it matches the current questionnaire version and includes the newer Milestone 2 scoring fields.

## 8.4 `teams`

Stores team metadata.

Expected fields include:

- `id`;
- `name`;
- `project_name`;
- `description`;
- `join_code`;
- `created_by`.

Each team has a join code so other users can join through the Teams screen.

## 8.5 `team_members`

Stores team membership.

Expected fields include:

- `team_id`;
- `user_id`;
- `role`.

The app uses this table to load all teams a user belongs to and all members in each team.

## 8.6 `compatibility_results`

Stores compatibility snapshots.

Expected fields include:

- `team_id`;
- `score`;
- `score_label`;
- `strengths`;
- `frictions`;
- `tips`;
- `created_at`.

The app can also recalculate richer Milestone 2 compatibility fields in memory, such as pair fit, role coverage, and coordination health.

## 8.7 Schema note for this README

This README is intentionally scoped to the pushed Milestone 2 app. The later AI coach table and Edge Function are not listed as current database requirements because they are part of the future AI plan, not the pre-AI implementation.

---

# 9. Authentication flow

KyodoAI uses Supabase Auth when Supabase environment variables are configured.

## 9.1 Registration flow

1. User opens the register screen.
2. User enters email and password.
3. App calls `supabase.auth.signUp`.
4. If Supabase requires email confirmation, the app shows a notice asking the user to confirm their email.
5. If a session is returned immediately, the app stores the user in app state and routes into the signed-in app.
6. New users begin with no profile, no answers, no result, and no teams.

## 9.2 Login flow

1. User opens the login screen.
2. User enters email and password.
3. App calls `supabase.auth.signInWithPassword`.
4. On success, the app loads the user’s backend snapshot:
   - profile;
   - questionnaire answers;
   - latest current result;
   - teams;
   - compatibility insights.
5. The user is routed into the signed-in app.

## 9.3 Session persistence

The Supabase client is configured with AsyncStorage. This allows the app to persist auth sessions locally and reload the user state when the app starts.

## 9.4 Local fallback

If Supabase environment variables are missing, the app can use local state fallback for basic development. However, the intended POC flow uses Supabase because teams and users need shared data.

---

# 10. Questionnaire scoring logic

The Milestone 2 questionnaire is a 15-question work-style questionnaire. Each answer uses a 1–5 scale:

1. Strongly disagree
2. Disagree
3. Neutral
4. Agree
5. Strongly agree

Each answer is normalised onto a 0–100 scale:

```text
score = (answer_value - 1) * 25
```

For reverse-scored questions:

```text
score = 100 - normalised_score
```

## 10.1 Dimensions

The questionnaire produces these core dimensions:

- planning;
- communication;
- leadership;
- pace;
- conflict;
- detail;
- initiative;
- flexibility.

It also derives:

- accountability;
- decision comfort.

## 10.2 Question mapping

The scoring logic maps questions as follows:

| Signal | Questions |
| --- | --- |
| Planning | Q1, Q2 |
| Communication | Q3, Q4, Q15 |
| Initiative | Q5 |
| Accountability | Q6 |
| Pace | Q6, Q9 |
| Decision comfort | Q7 |
| Leadership | Q7, Q8 |
| Flexibility | Q10 |
| Detail | Q11, Q12 |
| Conflict | Q13, Q14 |

Some questions are reverse-scored. For example, “I would rather work independently and only update when needed” contributes to communication in reverse. “I would rather support a coordinator than be the coordinator” contributes to leadership in reverse. “When time is tight, I am happy to ship something good enough” contributes to detail in reverse.

## 10.3 Strict completion

The app requires all 15 questions before generating a result. This prevents incomplete profiles from producing misleading team scores.

## 10.4 Questionnaire versioning

The current questionnaire version is:

```text
kyodo-15-v1
```

The app filters out older result shapes that do not include the current fields. This was added to prevent stale local or backend data from breaking the newer scoring model.

---

# 11. Work-style profile generation

After questionnaire scoring, KyodoAI turns raw scores into a readable work-style profile.

## 11.1 Work-style tendencies

The app currently supports these tendencies:

- Coordinator-Minded Planner;
- Reliable Builder;
- Quality Guard;
- Connector;
- Adaptive Explorer;
- Quiet Specialist.

Each tendency is chosen using deterministic rules over the user’s scores. For example:

- a high planning, initiative, and communication score can support a Coordinator-Minded Planner label;
- a high pace and accountability score can support a Reliable Builder label;
- a high detail score can support a Quality Guard label;
- high communication and conflict scores can support a Connector label.

The app selects a primary tendency and a secondary tendency.

## 11.2 Strengths

The Profile screen shows possible strengths in a team, such as:

- helping turn broad goals into visible milestones;
- keeping updates and next steps clear;
- bringing steady delivery rhythm;
- surfacing concerns early;
- catching gaps and protecting quality.

## 11.3 Watch-outs

The app also shows possible watch-outs. These are not personality judgments. They are teamwork prompts. Examples include:

- strong structure preferences may make unclear starts frustrating;
- frequent updates may feel heavy to teammates who prefer independence;
- moving quickly can create pressure for slower teammates;
- polish can compete with speed if the team has not agreed on “good enough.”

## 11.4 Teammate notes

The app generates “what teammates should know” notes. These are phrased as collaboration preferences, for example:

- “I work best when goals, owners, and milestones are visible early.”
- “Regular, concise updates help me stay aligned with the team.”
- “I may take time to raise disagreements, so invite me into the conversation before issues grow.”

This makes the result practical instead of only numerical.

---

# 12. Team compatibility logic

Team compatibility is calculated only when at least two team members have completed work-style results.

The current model has three major parts:

```text
Final team score =
  60% pair fit
  + 25% role coverage
  + 15% coordinator health
```

## 12.1 Pair fit

Pair fit compares each pair of completed profiles. It uses weighted similarity across the ten work-style signals:

- communication;
- planning;
- pace;
- conflict;
- detail;
- leadership;
- initiative;
- flexibility;
- accountability;
- decision comfort.

For each signal, the app calculates:

```text
fit = 100 - absolute_difference_between_members
```

The weighted average becomes the work-style fit score.

## 12.2 Pair complementarity

Pair compatibility is not only about being similar. Teams can benefit from complementary roles. The pair score therefore combines:

```text
pair compatibility =
  70% work-style fit
  + 30% role complementarity
```

Complementarity considers whether members cover different role strengths, such as coordination, building, quality, and connecting.

## 12.3 Role coverage

The app evaluates four team role coverage areas:

| Role | What it represents |
| --- | --- |
| Coordinator | Planning, communication, leadership, decision comfort |
| Builder | Pace, accountability, initiative |
| Quality guard | Detail and conflict readiness |
| Connector | Communication, conflict, flexibility |

For each role, the app identifies the strongest members and calculates how well the team covers that responsibility.

## 12.4 Coordinator health

Coordinator health checks whether the team has a clear coordination anchor. It considers:

- the strongest coordination score;
- second strongest coordination score;
- average communication;
- average decision comfort;
- whether too many people may try to coordinate at once;
- whether no one clearly anchors coordination.

This is important because student teams often fail when nobody owns deadlines, notes, and final decisions.

## 12.5 Generated insights

Compatibility output includes:

- overall score;
- score label;
- pair fit score;
- role coverage score;
- coordinator health score;
- suggested coordinator;
- role coverage cards;
- strengths;
- frictions;
- gaps;
- overlap risks;
- tips.

The Teams screen displays these insights as a practical report.

---

# 13. Best-team-matching logic

Milestone 2 adds best-team-matching suggestions for larger groups. This feature helps users split a pool of completed profiles into smaller teams.

## 13.1 Target team size

The UI allows a user to select a target team size. Depending on the number of completed profiles, the options may include:

- 2;
- 3;
- 4;
- 5;
- larger sizes when enough members exist.

The target size is not fixed. This means the app is not limited to groups of 3.

## 13.2 Remainder handling

If the number of people does not divide evenly, the app includes the remainder group in the optimisation.

Examples:

| Members | Target size | Actual split |
| --- | ---: | --- |
| 8 | 3 | 3 / 3 / 2 |
| 10 | 3 | 4 / 3 / 3 |
| 11 | 4 | 4 / 4 / 3 |
| 12 | 5 | 5 / 5 / 2 |

The smaller or larger group is not treated as leftover. It is scored and optimised together with the rest of the grouping.

## 13.3 Exact search

For practical group sizes, the app performs exact search over possible groupings. It avoids greedy matching where the first good pair may block a better full-group solution.

The app evaluates each valid partition, scores each proposed team with the compatibility model, and picks the formation with the best overall balance.

## 13.4 Formation score

A formation is scored using:

```text
overall formation score =
  70% average team score
  + 20% weakest team score
  + 10% balance score
```

This prevents the app from creating one excellent team while leaving one very weak team.

## 13.5 Safety cap

The app has a maximum exact grouping cap to avoid freezing on very large cohorts. If the search space is too large, the UI asks users to split into smaller pools first.

This is appropriate for the current POC because the expected usage is small-to-medium student project groups.

---

# 14. Frontend walkthrough and commit evidence

## 14.1 Welcome, register, and login

What to check in the app:

- the welcome screen introduces KyodoAI and routes users to registration or login;
- the register screen allows a new user to create an account;
- the login screen signs in an existing user and loads the saved app data.

Commit evidence:

- [Login and register page UI update](https://github.com/eatenquek/kyodo/commit/545f45c31321712b0ad28f19337817751c427130)
- [Fix sign up and login](https://github.com/eatenquek/kyodo/commit/73bc0369060f714a2f0ce94c85722ba1e2ea759d)

## 14.2 Home and profile setup

What to check in the app:

- the signed-in user reaches the main app tabs;
- the Profile tab shows the user’s details;
- the profile modal lets the user edit name, university, course, year, preferred role, and bio;
- the profile state is reused when showing team members.

Commit evidence:

- [Build profile page](https://github.com/eatenquek/kyodo/commit/69fa1871eb2371ae153703e83f912c194086762c)

## 14.3 Questionnaire flow

What to check in the app:

- the user can answer the 15-question work-style questionnaire;
- selected answers remain highlighted;
- the user can move back and forward;
- incomplete questionnaires do not generate misleading results.

Commit evidence:

- [Add questionnaire flow](https://github.com/eatenquek/kyodo/commit/21b2f1203f763c9d2791ae88dd1bd78597c1779e)

## 14.4 Work-style profile result

What to check in the app:

- completing the questionnaire creates a readable work-style result;
- the result includes primary and secondary tendencies;
- the profile shows strengths, watch-outs, teammate notes, and score details.

Commit evidence:

- [Finalised personality scoring](https://github.com/eatenquek/kyodo/commit/d39588e84c537411b2288ac0e831c5cdc021090b)

## 14.5 Team creation, joining, and leaving

What to check in the app:

- the user can create a team with a name, project name, description, and join code;
- another user can join using the team code;
- team members appear inside the active team card;
- the user can leave a team through a confirmation flow.

Commit evidence:

- [Working on team page](https://github.com/eatenquek/kyodo/commit/d875fdc88aaa4751f3854910e24953d701353d9a)
- [Update to teams again](https://github.com/eatenquek/kyodo/commit/889443888ef4b9ca5b6ef32c8eaaf0d9c470125d)
- [Fixed the leaving function](https://github.com/eatenquek/kyodo/commit/683074aa2961b6ec960060fa9011a1569fc1bdf9)

## 14.6 Compatibility insight report

What to check in the app:

- once at least two team members have completed questionnaires, the team can generate compatibility insights;
- the report shows total compatibility, pair fit, role coverage, and coordination health;
- the report gives strengths, watch-outs, and next steps.

Commit evidence:

- [Update compatibility scoring model](https://github.com/eatenquek/kyodo/commit/9b321cbad53e9231062aa20c87c473cd96814c29)

## 14.7 Best group split suggestion

What to check in the app:

- the user can choose a target team size;
- the app suggests balanced groupings using the completed profiles;
- the app handles remainders instead of treating leftover members as an afterthought;
- the app shows average team score, weakest team score, balance score, and suggested teams.

Commit evidence:

- [Update flexible team formation optimizer](https://github.com/eatenquek/kyodo/commit/c01b3ccaa690913e105a6ec865b372dbc191ce3a)
- [Allow for best team matching](https://github.com/eatenquek/kyodo/commit/8b5cbaaf9fae13eed0b06f1c416e206b61a7a42e)

---

# 15. Testing strategy

Testing for Milestone 2 focuses on functional correctness, deterministic scoring, data persistence, and UI flow stability.

> **Updated since Milestone 2.** This section described a manual-only strategy. An
> automated Vitest suite now covers the scoring, matching and coach-gating logic
> (`npm test` — 45 tests across 9 files), and `npm run typecheck` runs `tsc --noEmit`
> in strict mode. See the [Developer guide](#developer-guide-current-state) for the
> current strategy and [`docs/TESTING.md`](docs/TESTING.md) for the latest
> system-test and user-test results. The manual procedures below remain valid.

## 15.1 Static checks

The main static check is:

```bash
npm run typecheck
```

This runs:

```bash
tsc --noEmit
```

The goal is to catch TypeScript errors across screens, state, backend helpers, scoring services, and domain types.

## 15.2 Build/export check

The app has also been validated using Expo web export:

```bash
npx expo export --platform web --output-dir /tmp/kyodo-web
```

This checks that imports, routes, and bundling work for the web target.

## 15.3 Manual flow testing

The main manual flows are:

- register;
- login;
- edit profile;
- answer questionnaire;
- view work-style result;
- create team;
- join team;
- generate compatibility;
- view best team matching;
- leave team.

## 15.4 Data testing

Data testing focuses on:

- saved profile appears after reload;
- saved answers remain after navigating away;
- completed result appears after reload;
- created team appears in Teams tab;
- joined member appears in team details;
- compatibility can be generated after at least two members complete results.

## 15.5 Algorithm testing

Algorithm testing focuses on:

- answer normalisation;
- reverse scoring;
- strict completion validation;
- work-style profile tendency selection;
- compatibility scoring;
- role coverage calculation;
- formation optimiser handling of remainders.

---

# 16. System test cases and results

The following test cases describe the expected Milestone 2 system behaviour. These tests were manually run on Expo Web and Expo Go on 28 June using two Supabase test accounts. The main demo recording follows the same flow.

## 16.1 Authentication tests

| Test case | Steps | Expected result | Result |
| --- | --- | --- | --- |
| Register new account | Enter new email and password, press register | Account is created or email confirmation notice appears | Passed in local/Supabase-connected flow |
| Duplicate registration | Register with existing email | App shows account already exists message | Passed |
| Login valid account | Enter valid email and password | User reaches signed-in app | Passed |
| Login invalid account | Enter wrong credentials | App shows login failure message | Passed |
| Sign out | Press sign out in Profile | User returns to welcome/auth flow | Passed |

## 16.2 Profile tests

| Test case | Steps | Expected result | Result |
| --- | --- | --- | --- |
| Save profile | Fill profile modal and save | Profile card updates | Passed |
| Preferred role display | Choose role in profile | Teams member role displays chosen role | Passed |
| Missing optional fields | Leave some optional fields blank | Profile still saves without crashing | Passed |

## 16.3 Questionnaire tests

| Test case | Steps | Expected result | Result |
| --- | --- | --- | --- |
| Answer one question | Select an answer | Answer is highlighted and saved | Passed |
| Navigate back | Press Back | Previous question appears with saved answer | Passed |
| Incomplete completion | Try to finish with missing answer | App jumps to missing question and shows error | Passed |
| Complete all answers | Answer all 15 questions | Result generated and Profile tab opens | Passed |
| Retake/resume | Reopen questionnaire | Existing answers are shown and can be changed | Passed |

## 16.4 Work-style result tests

| Test case | Steps | Expected result | Result |
| --- | --- | --- | --- |
| Generate result | Complete questionnaire | Primary and secondary tendency appear | Passed |
| Score details toggle | Open score details | Ten signals are displayed | Passed |
| Result persistence | Reload app after result | Current result appears if Supabase/local state has it | Passed |

## 16.5 Team tests

| Test case | Steps | Expected result | Result |
| --- | --- | --- | --- |
| Create team | Enter team details | Team appears with join code | Passed |
| Join team | Enter valid code | User joins target team | Passed |
| Duplicate join | Join a team already joined | App prevents duplicate membership | Passed |
| Leave team | Confirm leave | User is removed from team | Passed |

## 16.6 Compatibility and matching tests

| Test case | Steps | Expected result | Result |
| --- | --- | --- | --- |
| One completed member | Generate compatibility with fewer than two results | No compatibility report generated | Passed |
| Two completed members | Generate compatibility | Score and insight report appear | Passed |
| Role coverage | Generate compatibility for completed team | Coordinator/builder/quality/connector coverage appears | Passed |
| Best split exact multiple | Use 9 completed members, target 3 | App can suggest 3 / 3 / 3 split | Implemented; pending full manual test with seeded profiles |
| Best split with remainder | Use 8 completed members, target 3 | App can suggest 3 / 3 / 2 split | Implemented; pending full manual test with seeded profiles |
| Too-large search | Use cohort above exact-search cap | App returns unavailable guidance instead of freezing | Implemented; pending larger-cohort stress test |

---

# 17. Bugs encountered and fixes

## 17.1 Supabase schema cache missing columns

Bug:

During questionnaire completion, Supabase returned an error similar to:

```text
Could not find the 'accountability_score' column of 'personality_results' in the schema cache
```

Cause:

The frontend scoring model had been updated to include new fields, but the Supabase table did not yet include those columns or the PostgREST schema cache had not been refreshed.

Fix:

- Added app-side error messaging that makes the missing migration clearer.
- Updated result mapping to require current questionnaire version and new scoring fields.
- Documented that the Supabase schema must include Milestone 2 result fields.

## 17.2 Old local fixture data interfering with current results

Bug:

Older demo accounts and local fixture data could appear in local state and conflict with the new scoring model.

Cause:

Local AsyncStorage still contained older sample users, teams, and results.

Fix:

- Added cleanup logic that removes known legacy fixture users and teams.
- Added result validation so outdated results missing current fields are ignored.

## 17.3 Questionnaire result generated from incomplete data

Bug:

Earlier scoring logic could be too forgiving if answers were incomplete.

Fix:

- Scoring now checks that all 15 questions are answered.
- The questionnaire screen redirects the user to the first missing answer before completion.

## 17.4 Compatibility insights becoming stale

Bug:

When a user retook the questionnaire, old team compatibility results could remain visible.

Fix:

- Completing a questionnaire clears compatibility results in app state.
- Backend-loaded compatibility is enriched/recalculated in memory using current team member results.

## 17.5 Team leave edge cases

Bug:

Leaving a team could leave the active team id pointing at a removed team.

Fix:

- Leave flow now selects the next available team when the active team is removed.
- Compatibility entries for the left team are removed from local state.

## 17.6 Exact team matching can become expensive

Bug:

Exact grouping search grows quickly as the number of members increases.

Fix:

- Added a maximum exact grouping cap.
- If the number of possible groupings is too high, the app avoids running the search and asks users to split into smaller pools.

---

# 18. SWE and design principles

These are the main engineering and design choices that shaped the Milestone 2 build.

## 18.1 Deterministic core logic

The app uses deterministic scoring for questionnaire results, compatibility, and team matching. This keeps the output repeatable and easier to explain to users.

## 18.2 Separation of concerns

Screens focus on user interaction. Scoring services focus on algorithms. Supabase helpers focus on backend mapping. Domain types define shared data shapes.

This separation makes the code easier to maintain and reduces the chance that UI changes accidentally alter scoring behaviour.

## 18.3 Progressive disclosure

The UI avoids overwhelming users with every score immediately. For example, Profile first shows the main tendency and readable insights, then lets the user expand score details. Team compatibility first shows the main score, then reveals more detailed role and risk information.

## 18.4 Discussion aid, not judgment

The product language avoids saying that a person or team is simply good or bad. Results are framed as tendencies, signals, strengths, watch-outs, and next steps.

## 18.5 Mobile-first design

The app uses card-based layouts, compact typography, rounded controls, and clear primary actions. This makes the experience suitable for phone screens and quick student usage.

## 18.6 Graceful fallback

The app includes a local state fallback when Supabase is not configured. This makes development and quick demos easier, although the intended POC flow uses Supabase.

## 18.7 Safety around data freshness

The app version-checks questionnaire results and filters outdated local results. This prevents old data from silently producing incorrect compatibility insights.

---

# 19. Project management and GitHub usage

We used GitHub to keep implementation progress organised.

Recent pushed milestones include:

- [add questionnaire flow](https://github.com/eatenquek/kyodo/commit/21b2f1203f763c9d2791ae88dd1bd78597c1779e);
- [Finalised personality scoring](https://github.com/eatenquek/kyodo/commit/d39588e84c537411b2288ac0e831c5cdc021090b);
- [Update compatibility scoring model](https://github.com/eatenquek/kyodo/commit/9b321cbad53e9231062aa20c87c473cd96814c29);
- [Update flexible team formation optimizer](https://github.com/eatenquek/kyodo/commit/c01b3ccaa690913e105a6ec865b372dbc191ce3a);
- [Allow for best team matching](https://github.com/eatenquek/kyodo/commit/8b5cbaaf9fae13eed0b06f1c416e206b61a7a42e).

## 19.1 Commit evidence by feature

| Feature area | Evidence |
| --- | --- |
| Authentication UI and login/register fixes | [UI update](https://github.com/eatenquek/kyodo/commit/545f45c31321712b0ad28f19337817751c427130), [sign up/login fix](https://github.com/eatenquek/kyodo/commit/73bc0369060f714a2f0ce94c85722ba1e2ea759d) |
| Profile page | [Build profile page](https://github.com/eatenquek/kyodo/commit/69fa1871eb2371ae153703e83f912c194086762c) |
| Questionnaire flow | [Add questionnaire flow](https://github.com/eatenquek/kyodo/commit/21b2f1203f763c9d2791ae88dd1bd78597c1779e) |
| Personality/work-style scoring | [Finalised personality scoring](https://github.com/eatenquek/kyodo/commit/d39588e84c537411b2288ac0e831c5cdc021090b) |
| Team compatibility scoring | [Update compatibility scoring model](https://github.com/eatenquek/kyodo/commit/9b321cbad53e9231062aa20c87c473cd96814c29) |
| Team formation optimizer | [Update flexible team formation optimizer](https://github.com/eatenquek/kyodo/commit/c01b3ccaa690913e105a6ec865b372dbc191ce3a) |
| Best team matching UI | [Allow for best team matching](https://github.com/eatenquek/kyodo/commit/8b5cbaaf9fae13eed0b06f1c416e206b61a7a42e) |

## 19.2 Validation before push

Before pushing code changes, the project typically runs:

```bash
npm run typecheck
git diff --check
```

For larger UI changes, Expo export is also used:

```bash
npx expo export --platform web --output-dir /tmp/kyodo-web
```

---

# 20. Limitations

## 20.1 Compatibility is not a guarantee

The app gives structured indicators, not certainty. Real teamwork is still affected by motivation, skill, availability, external deadlines, and interpersonal dynamics.

## 20.2 Questionnaire is self-reported

Scores depend on how honestly and accurately users answer. A user may overestimate or underestimate their own habits, especially if they are not used to reflecting on teamwork style.

## 20.3 Matching search has a practical cap

Exact search is useful for small-to-medium groups, but it can become expensive for large cohorts. The current app avoids running exact search when the number of groupings exceeds the safety cap.

## 20.4 No instructor dashboard yet

The app is currently student-facing. It does not yet provide a separate instructor or admin view for managing a whole class.

## 20.5 No advanced availability matching

The app does not currently match based on timetable, timezone, schedule availability, or skill inventory.

---

# 21. Milestone 3 plan

Milestone 3 should build on the working Milestone 2 prototype. The current app already handles questionnaire scoring, team compatibility, and best group matching. The next step is to make those results easier for teams to act on.

## 21.1 AI coach explanations

The main planned extension is an AI coach layer. This should not decide the team matching result. The matching should still come from the deterministic scoring model. The AI coach would simply explain and coach based on the results already produced by the app.

Planned AI coach outputs:

- plain-language explanation of team compatibility;
- short persona-style collaboration preview using questionnaire-derived work styles;
- suggested roles;
- risks and mitigation steps;
- working agreement suggestions;
- first meeting plan.

## 21.2 Supabase-linked AI implementation

The intended implementation approach:

- keep OpenAI API calls out of the Expo client;
- send team matching data from the app to a Supabase Edge Function;
- store the OpenAI API key as a Supabase secret;
- have the Edge Function call the OpenAI Responses API;
- return structured JSON advice to the app;
- display the advice inside the team details screen;
- save the latest advice so repeated clicks can reuse it.

This approach avoids exposing API keys inside the mobile app and keeps the AI layer safely server-side.

## 21.3 Future database and testing work

Other improvements for Milestone 3:

- add a clean Supabase migration for saved AI advice;
- document exact SQL setup for new developers and TAs;
- add automated unit tests for scoring;
- add fixture tests for team formation;
- add end-to-end test checklist for Supabase flows.

## 21.4 More matching inputs and organiser features

Possible future signals:

- project role needs;
- technical skills;
- presentation comfort;
- availability;
- preferred working hours;
- previous collaboration history.

## 21.5 Instructor or organiser mode

Possible future feature:

- upload a class roster;
- collect questionnaire responses;
- generate balanced groups;
- flag teams that may need support.

---

# 22. Setup and run instructions

This section is written for a TA or developer who wants to download, run, and use the POC.

## 22.1 Prerequisites

Install:

- Node.js;
- npm;
- Expo Go on a phone, or a local simulator/emulator;
- Git.

Recommended:

- iOS Simulator for macOS users, or Android Studio emulator;
- Supabase project access for full backend testing.

## 22.2 Clone the repository

```bash
git clone <repository-url>
cd kyodo
```

If using the GitHub repository URL:

```bash
git clone https://github.com/eatenquek/kyodo.git
cd kyodo
```

## 22.3 Install dependencies

```bash
npm install
```

## 22.4 Create environment file

Create a file named `.env.local` in the project root.

Use this format:

```env
EXPO_PUBLIC_SUPABASE_URL=<your-supabase-url>
EXPO_PUBLIC_SUPABASE_KEY=<your-supabase-publishable-or-anon-key>
```

The repository also contains `.env.example`:

```env
EXPO_PUBLIC_SUPABASE_URL=
EXPO_PUBLIC_SUPABASE_KEY=
EXPO_PUBLIC_SUPABASE_ANON_KEY=
```

Do not commit `.env.local`.

## 22.5 Supabase setup for POC usage

For the full POC, the Supabase project must include:

- Auth email/password enabled;
- `profiles`;
- `questionnaire_answers`;
- `personality_results`;
- `teams`;
- `team_members`;
- `compatibility_results`;
- RLS policies that allow signed-in users to access their own profile/answers/results and teams they belong to.

If using the team’s configured Supabase project, copy the provided project URL and publishable key into `.env.local`.

If creating a new Supabase project, create equivalent tables before running full multi-user tests.

## 22.6 Start the development server

```bash
npx expo start
```

If port conflicts happen, choose another port:

```bash
npx expo start --port 8082
```

To clear Metro cache:

```bash
npx expo start --clear
```

## 22.7 Run on web

```bash
npm run web
```

Or from Expo CLI, press:

```text
w
```

## 22.8 Run on Expo Go

1. Start Expo:

   ```bash
   npx expo start
   ```

2. Open Expo Go on your phone.
3. Scan the QR code in the terminal.
4. Wait for the bundle to load.

## 22.9 Run on iOS simulator

On macOS with Xcode installed:

```bash
npm run ios
```

Or press:

```text
i
```

inside the Expo CLI terminal.

## 22.10 Run on Android emulator

With Android Studio emulator configured:

```bash
npm run android
```

Or press:

```text
a
```

inside the Expo CLI terminal.

## 22.11 Typecheck

```bash
npm run typecheck
```

Expected result:

```text
tsc --noEmit
```

completes without errors.

## 22.12 Use the application

Recommended POC walkthrough:

1. Open the app.
2. Register a new account or sign in.
3. Go to Profile.
4. Edit and save profile details.
5. Start the questionnaire.
6. Answer all 15 questions.
7. View the generated work-style profile.
8. Create a team in the Teams tab.
9. Ask teammates to join using the join code.
10. Ensure at least two team members complete questionnaires.
11. Generate compatibility insights.
12. Review pair fit, role coverage, coordination, strengths, watch-outs, and next steps.
13. If the team has enough completed profiles, use Best group split.
14. Change target team size and compare suggested groupings.

## 22.13 Demo notes

For a useful demo, prepare at least two accounts with completed questionnaires. For the best-team-matching demo, prepare at least four completed profiles so the app can show target team size options and suggested splits.

## 22.14 Troubleshooting

### App cannot connect to Supabase

Check `.env.local`:

```env
EXPO_PUBLIC_SUPABASE_URL=<correct-url>
EXPO_PUBLIC_SUPABASE_KEY=<correct-key>
```

Restart Expo after changing environment variables:

```bash
npx expo start --clear
```
### Compatibility button does not show results

Check:

- at least two team members are in the team;
- at least two team members have completed work-style results;
- the active team is selected.

### Best group split does not appear

Check:

- the team has at least four completed profiles;
- all members have current results;
- the search space is not above the exact-search safety cap.

### Expo port issue

Use a different port:

```bash
npx expo start --port 8082
```

### Node or dependency issue

Remove and reinstall dependencies:

```bash
rm -rf node_modules
npm install
```

Then restart Expo:

```bash
npx expo start --clear
```

---

# Conclusion

KyodoAI Milestone 2 implements the core student-facing teammate awareness flow. Users can authenticate, create a profile, complete a questionnaire, receive a work-style result, create or join teams, generate team compatibility insights, and view best-team-matching suggestions for different target team sizes.

The app is still a POC, but it now demonstrates the central idea: better teamwork can start before the project begins if students understand each other’s work habits earlier. The next milestone can build on this foundation with saved AI coach explanations, stronger database migration support, more test automation, and potentially instructor-facing team formation tools.
