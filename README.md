# KyodoAI - Project Gemini README

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

That was the Milestone 2 demo flow, and it still works end to end. Since then the
demo also covers the AI coach on a team, and cohort mode: create a cohort, join it
with a code from a second account, then split the roster into balanced teams. See
[Milestone 3: current state](#milestone-3-current-state) for how those work.

---

# Milestone 3: current state

Sections 1-22 further down are the Milestone 2 submission doc, kept as written.
This section covers everything built after it, and it is the accurate picture of
the app today.

Milestone 2 ended with a working scoring engine and a student-facing team space.
The open question was what to do with the numbers. A compatibility score of 64
tells a team almost nothing on its own. Milestone 3 went after that gap from two
directions: an AI coach that turns a result into things a team can actually say
to each other in week one, and cohort mode, which lets one organiser split a
whole tutorial group instead of asking forty students to find each other.

Everything here runs against the live Supabase project. The AI coach is the only
piece with an extra deployment step (an Edge Function and an API key).

## M3.1 What shipped since Milestone 2

| Area | What it does | Where it lives |
| --- | --- | --- |
| AI coach | Turns a scored team into a persona simulation, suggested roles, risks, a working agreement and a first meeting plan | `services/ai/`, `supabase/functions/ai-team-coach` |
| Cohort mode | An organiser creates a cohort, students join by code, the whole roster is split into balanced teams | `app/(tabs)/cohort.tsx`, `app/cohort/[id].tsx`, `services/cohorts/cohortFormation.ts` |
| Editing and deleting | Team owners and cohort organisers can edit details or delete, behind a confirmation that says what is lost | `components/teams/TeamFormModal.tsx`, `components/cohorts/CohortFormModal.tsx`, `components/ConfirmModal.tsx` |
| Availability | Six coarse time blocks on the profile, overlap shown per team and per suggested group | `services/scoring/availability.ts` |
| Score bands | Compatibility reads as "Workable · 59-73" rather than a bare percentage | `services/scoring/scoreInterpretation.ts` |
| Profile pictures | Pick, crop and compress an avatar, stored as a data URI on the profile | `lib/avatar.ts`, `components/Avatar.tsx` |
| School on a cohort | Required pick from a bundled university list, with logos | `components/cohorts/SchoolPicker.tsx`, `constants/universities.ts` |
| Invite links | A `/join/<code>` deep link that survives a sign-in detour | `services/teams/inviteLink.ts`, `lib/pendingInvite.ts` |
| Join code rotation | The owner can burn a leaked code without disturbing current members | `rotateBackendJoinCode` in `lib/supabase/backend.ts` |
| Onboarding tracker | Home shows the next step out of four, not a generic welcome | `services/onboarding/journeyStatus.ts` |
| Automated tests | 84 Vitest tests across 13 files over the pure service layer | `tests/` |

## M3.2 The AI coach

### Why the AI does not decide anything

The matching result comes from the deterministic scoring model, and it stays
that way. The model gets the finished numbers and explains them. We drew the
line there for three reasons: the same team should get the same groups every
time it runs a split, a scoring bug should be findable in a unit test rather
than in a prompt, and a group of students should not be told they were sorted by
something nobody can inspect. The AI layer is a translator, so if the Edge
Function is missing or the key is unset, everything else still works.

### Request path

The Expo client never talks to OpenAI. `generateTeamCoachAdvice` posts a typed
payload to the `ai-team-coach` Edge Function, and the function does the rest:

1. Reject anything without an `Authorization` header (401).
2. Resolve the caller with a user-scoped Supabase client, so the JWT is verified
   rather than trusted.
3. Check with a service-role client that the caller is in `team_members` for the
   team in the payload. A non-member gets 403 even with a valid session. This
   check is the reason the function uses two clients: the user client to find out
   who is asking, the service client to answer a question the asker's own RLS
   would not let them ask.
4. Validate the payload shape before spending a token on it (400).
5. Look for a cached answer, call OpenAI on a miss, store the result, return it.

The API key lives in Supabase secrets. It is never bundled into the app, which
matters because an Expo web build ships its environment to the browser.

### Structured output

The function calls the OpenAI Responses API with a JSON schema that pins every
field and array bound, so the client gets `summary`, `simulation`,
`coachingNotes`, `roleSuggestions`, `riskWarnings`, `workingAgreement` and
`firstMeetingPlan` or it gets an error. There is no free-text parsing on the
client, and `TeamCoachAdvice` in `services/ai/teamCoach.ts` is the same shape the
schema enforces. The model name comes from `OPENAI_MODEL` and defaults to
`gpt-4.1-mini`.

### Caching

Advice is cached in `ai_coach_advice` on `(team_id, target_group_size,
formation_signature)`. The signature is built client-side in
`buildTeamCoachPayload` from the roster and the suggested split, so it changes
when the inputs change and only then. Pressing "Ask Kyodo" twice costs one API
call; a teammate finishing their questionnaire invalidates the entry on its own.
The screen watches the same signature and clears stale advice from view rather
than showing a report that no longer matches the team below it.

### Gating and failure

`getCoachAvailability` decides whether the button is even usable, given member
count, how many results are in, and whether a compatibility report and a
formation exist. It returns the reason as text, so the UI explains the wait
instead of showing a dead control. `describeCoachError` maps the failure cases
(not signed in, not a member, key not configured, upstream refusal) onto
sentences a student can act on. A missing Edge Function shows an error in one
card and leaves the rest of the screen working.

## M3.3 Cohort mode

Milestone 2 assumed students find each other. That is the wrong shape for a
tutorial: the tutor knows the roster, the students do not know each other yet,
and somebody has to make forty people into ten teams before week three.

### Data model

`cohorts` holds the name, description, six-character `join_code`, `created_by`,
`target_group_size` and `school`. `cohort_members` holds the roster with a role
of `organiser` or `student`, and cascades off the cohort row. A cohort is
deliberately not a team: teams are small, self-organising and long-lived, while
a cohort is a pool that exists to be split.

### Joining without exposing the table

Joining goes through `join_cohort_by_code`, a `SECURITY DEFINER` function, for
the same reason team joins do. To join by code the client would otherwise need
read access to every cohort row to find the match, which would leak names and
codes to anyone signed in. The function looks up the code server-side, inserts
the membership, and returns the cohort id plus whether the caller was already a
member. The client learns nothing about codes it did not already have.

### The RLS recursion bug

The first policy set had `cohorts` check membership by selecting from
`cohort_members`, while `cohort_members` checked visibility by selecting from
`cohorts`. Postgres refused the pair with `42P17`, infinite recursion. The fix
was `is_cohort_participant(uuid)`, a `SECURITY DEFINER` helper that answers the
membership question without re-entering either policy, and both policies now
call it. A similar problem in `join_team_by_code` (`42702`, an ambiguous
reference between an OUT parameter and a column) was caught the same way.

Both were found by impersonating a real user inside a transaction that gets
rolled back:

```sql
begin;
set local role authenticated;
set local request.jwt.claims = '{"sub":"<auth user id>","role":"authenticated"}';
-- run the query as that student
rollback;
```

This is worth more than reading the policies, because it exercises what the
client will actually hit.

### Running the split

`planCohortFormation` reuses `suggestBestTeamFormation`, the Milestone 2
optimiser, rather than growing a second matching algorithm. It filters the
roster, refuses to run when it cannot produce a sensible answer, and returns a
discriminated union instead of throwing:

- fewer than 4 completed profiles, blocked with the names still pending;
- a target size below 2, blocked;
- a target size above `ready - 2`, blocked, since that cannot make two groups.

On success it adds per-group shared availability on top of the work-style
result, so a group that scores well but shares no free evening says so.

### The organiser is not a student

The organiser runs the split and does not get placed in a group.
`planCohortFormation` takes an optional `organiserId` and filters that member
out; the detail screen passes `cohort.createdBy`, leaves them out of the student
count and the "profiles ready" figure, and tags their roster row as Organiser.
Without this a tutor of thirty students becomes a thirty-first student and quietly
skews a group.

## M3.4 Editing and deleting what you created

Anything a user can create, they can now fix or remove. Team owners can change
the name, project and description or delete the team. Cohort organisers can
change the name, description and school or delete the cohort.

Deletes are the interesting half, and they get three layers:

**Confirmation.** Both go through the shared `ConfirmModal` in its danger tone.
The dialog names what disappears rather than asking a generic "are you sure":
deleting a team takes its members, saved compatibility reports and coach advice;
deleting a cohort takes its roster; both stop the join code working. The cancel
button is the calm one and the destructive button is the coloured one, so a
mis-tap lands on the safe side.

**Row-level security.** `Team owners can delete their team` and
`Organisers can delete their cohort` restrict the delete to `created_by`. A
member who calls the API by hand deletes nothing. The client-side owner check
decides what to render, not what is allowed.

**Cascades.** `team_members`, `compatibility_results` and `ai_coach_advice` are
`on delete cascade` against `teams`, and `cohort_members` against `cohorts`, so a
delete cannot leave rows pointing at a team that no longer exists.

One implementation detail worth naming: every mutation ends with
`.select(...).maybeSingle()`. PostgREST reports a policy-blocked update or delete
as success with zero rows, not as an error, so without the select an unauthorised
delete would look like it worked. Zero rows back means the policy refused, and
the helper raises "Only the team owner can delete this team." The same pattern
guards `rotateBackendJoinCode` and the cohort target size update.

## M3.5 Availability as a separate signal

Availability is stored as up to six coarse blocks (weekday and weekend, morning,
afternoon and evening) rather than a timetable. Students will fill in six chips;
most will not fill in a calendar.

It is kept out of the compatibility score on purpose. Schedule overlap is a hard
constraint, not a preference: a pair who cannot meet is a different problem from
a pair who plan differently, and averaging the two hides both. So
`calculateAvailabilityOverlap` runs separately and reports shared blocks, near
misses where all but one member can make it, and the members who have not said
anything. Those members are excluded from the maths rather than assumed free,
which keeps the app from inventing an overlap out of missing data.

## M3.6 Bands instead of percentages

A 15-item self-report cannot support a number like 64. Compatibility now reads as
a band and a range ("Workable · 59-73"), from `describeScoreBand` and
`scoreRange`, with the bands set at 72 and 58 and the range spread seven points
either side. The bands are named for what to do next (Strong, Workable, Worth
discussing) instead of how good the team is, and a unit test asserts that no band
label ever says incompatible, toxic, poor or mismatched. That test exists because
copy drifts across a project and this is the part we do not want to get wrong.

## M3.7 Profile pictures and school

`pickAvatar` uses `expo-image-picker` with square cropping and compression, and
stores the result as a data URI in `profiles.avatar`. Storing bytes in a text
column is the wrong answer at scale, and the right answer for a POC: no bucket,
no signed URLs, no second failure mode, and the image arrives with the profile
row the app already fetches. Supabase Storage is the migration path when avatars
get bigger than a compressed thumbnail. `components/Avatar.tsx` renders the image
or falls back to a coloured initial, so a roster never has holes in it.

Cohorts carry a school. It is a required pick from a bundled list of universities
with logos in `assets/uni-logos`, resolved through `constants/universities.ts`.
The list is bundled rather than fetched so the picker works offline and the logos
never depend on someone else's CDN.

## M3.8 Invite links and code rotation

`parseInviteInput` accepts a bare code, a deep link or an https link, so pasting
whatever arrived in a chat works. If a signed-out user opens an invite,
`lib/pendingInvite.ts` parks the code, the user registers, and the join runs on
first authenticated render. Losing the invite to a login redirect is the sort of
thing that makes a student give up.

Codes are guessable enough to be shareable, which means a leaked code needs an
answer. The owner can rotate it: the old code stops working immediately, current
members are untouched, and the rotation retries on the unique-constraint
collision instead of failing.

## M3.9 Onboarding tracker

`getJourneyStatus` computes the single next step out of four (profile,
questionnaire, team, insights) from live state and returns a title, description
and action label. Home shows that one step rather than a static welcome card. It
is pure and unit-tested, which is the point: the "what should I do next" logic is
the sort of thing that rots into nested ternaries inside a component.

## M3.10 Bugs found along the way

Five worth writing down, because each one changed how we test rather than just
what the code says.

**Recursive RLS between cohorts and members (`42P17`).** Each table's policy
selected from the other. Fixed with the `is_cohort_participant` helper. Found by
running a real student's query under impersonation, not by reading the policies.

**Ambiguous reference in `join_team_by_code` (`42702`).** An OUT parameter shared
a name with a column, so Postgres could not tell which one the body meant. Same
method found it.

**`teams` had no delete policy.** Select, insert and update were all covered, so
nothing looked wrong until an owner deleted a team and the row stayed. PostgREST
reports a policy-blocked delete as a success with zero rows, so the app showed no
error either. This is what pushed us to the `.select().maybeSingle()` pattern on
every mutation and to the impersonation check below, which now covers deletes:

```sql
begin;
set local role authenticated;
set local request.jwt.claims = '{"sub":"<a member, not the owner>","role":"authenticated"}';
delete from public.teams where id = '<someone elses team>' returning id;  -- 0 rows
rollback;
```

**The delete dialog blanked out mid-dismiss.** Clearing the target closed the
dialog, but the fade-out still had frames to render, so the copy fell back to
"This team, its 0 members" with an empty code for a few hundred milliseconds. The
dialogs now render from the last target and use a separate visibility flag.

**Deleting a cohort flashed "Cohort not found".** The row left state before the
navigation ran, so the detail screen rendered its empty case on the way out. The
screen now holds a spinner once a delete is in flight.

## M3.11 Testing

`npm test` runs 84 Vitest tests across 13 files; `npm run typecheck` runs
`tsc --noEmit` in strict mode. Both are green.

The suite runs in a plain Node environment with no React Native mocking, which is
possible because the business logic lives in `services/` as pure functions. That
constraint was a Milestone 2 decision and it paid for itself here: cohort
formation, coach gating and coach error mapping were all testable the day they
were written.

Covered: questionnaire scoring and reverse items, strict completion, work-style
profiles, compatibility scoring, formation with remainders, cohort formation
including organiser exclusion and every blocked case, availability overlap,
score bands and copy safety, invite parsing, active team resolution, coach
payload signatures, coach gating, coach error mapping, journey status.

Not covered: component rendering, navigation, and the Supabase query layer. Those
are still manual, and the query layer is the weakest spot in the suite. RLS and
RPC behaviour is verified against the live database with the rolled-back
impersonation transaction shown above rather than with fixtures.

## M3.12 Security model

| Table | Read | Write |
| --- | --- | --- |
| `profiles` | Signed-in users | Own row only |
| `teams` | Owner and members | Owner updates and deletes; anyone creates their own |
| `team_members` | Signed-in users | Join and leave as yourself only |
| `cohorts` | Organiser and members | Organiser updates and deletes |
| `cohort_members` | Cohort participants | Join and leave as yourself only |
| `compatibility_results` | Team members | Team members |
| `ai_coach_advice` | Edge Function only | Edge Function only |

Two rules hold across the app. Joining happens through `SECURITY DEFINER`
functions so codes are never enumerable, and every privileged action is enforced
in a policy, with the client-side check deciding only what to draw.

## M3.13 Running it

```bash
npm run web:local   # no backend, single device, simulated auth
npm run web         # needs .env.local with the Supabase URL and anon key
npm test            # 84 unit tests
npm run typecheck   # tsc --noEmit
```

Cohorts and the AI coach need the backend. In local mode the cohort screens open
and the school picker works, but creating or joining a cohort raises a clear
error rather than pretending to succeed.

The AI coach additionally needs the Edge Function deployed and `OPENAI_API_KEY`
set in Supabase secrets:

```bash
supabase functions deploy ai-team-coach
supabase secrets set OPENAI_API_KEY=sk-...
```

## M3.14 Known gaps

- The questionnaire is self-reported and is not a validated instrument.
- Exact search is capped above roughly 50,000 combinations, so very large cohorts
  fall back rather than run for minutes.
- Local mode holds one profile at a time; switching accounts on the same device
  clears the previous one's data.
- No realtime. A teammate's new result appears on refocus, not as it happens.
- No component or end-to-end tests, and the backend query layer is manual.
- A join code works for anyone holding it until the owner rotates it.
- A suggested cohort split is not stored, so reopening the screen recomputes it.
- Avatars as data URIs will not scale past a POC.

## M3.15 What is next

- Publish a cohort split as real teams in one step. Right now the organiser reads
  the groups out and students create the teams by hand, which is the obvious
  missing link between cohort mode and team mode.
- Availability as a matching input rather than a report, once we can explain how
  it trades against work-style fit without hiding either.
- Per-account local storage.
- Accessibility roles on the last few controls.

---

# Table of contents

0. [Milestone 3: current state](#milestone-3-current-state)
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

- `id`: user id, matching the Supabase Auth user id;
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

The Milestone 2 questionnaire is a 15-question work-style questionnaire. Each answer uses a 1-5 scale:

1. Strongly disagree
2. Disagree
3. Neutral
4. Agree
5. Strongly agree

Each answer is normalised onto a 0-100 scale:

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

> **Updated since Milestone 2.** This section described a manual-only strategy.
> A Vitest suite now covers the scoring, matching, cohort formation and coach
> logic (`npm test`, 84 tests across 13 files), and `npm run typecheck` runs
> `tsc --noEmit` in strict mode. See [M3.11 Testing](#m311-testing) for what is
> and is not covered, and [`docs/TESTING.md`](docs/TESTING.md) for the latest
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

The three below came out of the Milestone 3 work and now apply across the app.

## 18.8 The server decides, the client only draws

Every privileged action is enforced in a row-level security policy or a
`SECURITY DEFINER` function. Owner checks in the UI choose which buttons to
render; they never grant anything. Deleting a team, rotating a join code and
editing a cohort all pass through a policy that would refuse the same call made
by hand. The AI coach follows the rule too: the Edge Function verifies the JWT
and re-checks team membership before it spends a token.

## 18.9 Fail loudly, in one place

An unauthorised update returns zero rows rather than an error, so every mutation
selects the row back and treats an empty result as a refusal with a readable
message. The same reflex shows up in the UI: blocked splits return a reason
instead of throwing, coach failures are mapped to sentences by
`describeCoachError`, and a missing Edge Function degrades one card instead of
the screen. Silent success on a destructive action is the failure mode we most
wanted to avoid.

## 18.10 Keep the core pure so it stays testable

Business logic lives in `services/` as pure functions with no React Native
imports, so the whole suite runs in plain Node with no mocking. This was cheap to
hold to and it is why cohort formation, coach gating and error mapping had tests
the day they were written. Anything that starts as a ternary inside a component
and grows a second condition gets moved out.

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

Written at Milestone 2. Cohort mode has since covered the main organiser job, so
a tutor can create a cohort, watch profiles come in and split the class. There is
still no analytics view over multiple cohorts, and no way to publish a suggested
split as real teams. See [M3.3](#m33-cohort-mode).

## 20.5 No advanced availability matching

Students now state availability in six coarse blocks, and the app reports overlap
per team and per suggested group. It is a report, not a matching input: nothing
in the split optimises for it, and timezone, timetable and skill inventory are
still absent. See [M3.5](#m35-availability-as-a-separate-signal).

---

# 21. Milestone 3 plan

This was the plan as written at Milestone 2. It is kept for comparison against
what was actually built, which is in
[Milestone 3: current state](#milestone-3-current-state).

| Planned | Status |
| --- | --- |
| AI coach explanations (21.1) | Built, with the deterministic model still doing the matching |
| Supabase-linked AI implementation (21.2) | Built as described, plus caching and a membership check in the Edge Function |
| Automated scoring and formation tests (21.3) | Built, 84 tests across 13 files |
| Migration for saved AI advice (21.3) | Built, `ai_coach_advice` |
| More matching inputs (21.4) | Availability collected and reported, not yet a matching input |
| Instructor or organiser mode (21.5) | Built as cohort mode, without roster upload or support flagging |

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
