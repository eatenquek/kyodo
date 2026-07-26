# Testing notes

Ran through the app manually in local mode (`npm run web:local`, no backend) plus
`npm test` / `npm run typecheck`. Not a real QA pass, just notes from poking around.

**Automated**
- `npm test`: 45 passing (Vitest, node env, no RN mocking needed since scoring
  logic lives in `services/` and is plain JS)
- `npm run typecheck`: clean

**Manually checked**
- register → complete profile → questionnaire → team → compatibility report, twice
  with two accounts, worked end to end
- new user home screen shows a real empty state now instead of the old fake
  "Project Gemini" team
- profile form validation (empty name, year out of range) blocks submit properly
- joining with a bad code shows an error instead of failing silently
- generating a compatibility report shows a full breakdown (pair fit, roles,
  strengths, watch-outs)
- tapping a teammate with a ready profile shows their work-style notes
- signing out / back in didn't lose data
- coach button shows a plain error when the backend isn't set up, no crash
- leaving a team asks for confirmation and tells you the join code you'll need
  to get back in
- checked mobile / tablet / desktop widths, nothing broke

**Bugs found + fixed along the way**
- app was redirecting signed-in users back to the welcome screen on every
  restart instead of straight to home
- home screen content wasn't width-capped on desktop like the rest of the app
- `getActiveTeam()` and the insights-generation function could disagree on
  which team was active
- generating insights failed silently on error (no message shown)

**Known gaps**
- haven't tested against a live Supabase backend end to end in this pass, only
  local mode
- no component or e2e tests, just unit tests on the scoring/logic layer
- AI coach success path not exercised (needs deployment + API key)

**More checks (join code rotation + score display)**
- `npm test`: 53 passing now, added tests for `scoreInterpretation` including one
  that checks no score label ever calls a team "incompatible" or "toxic"
- only the team owner sees the "new code" button, others don't
- rotating gives a fresh code, old one stops working, new one joins fine
- confirmation dialog before rotating explains what happens (old code dies,
  current members unaffected)
- compatibility scores now show as a band + range ("Workable · 59-73") instead of
  a bare percentage
- score explainer text is there and expands on tap

**More bugs found + fixed**
- local (no-backend) mode was leaking one account's profile into another
  account when signing in as someone else on the same device, fixed
- metric cards misaligned when a label wrapped to two lines

**Cohort mode, profile pictures, editing and deleting**
- `npm test`: 84 passing across 13 files, `npm run typecheck` clean
- cohort split leaves the organiser out of the groups and out of the student
  count, added a unit test for it
- blocked-split cases all return a reason instead of throwing: under 4 ready
  profiles, target size below 2, target size too big to make two groups
- school picker opens from the create sheet, logos render, search filters, and
  picking one fills the field. School is required now, the create button stays
  disabled without it
- editing a team or cohort prefills the sheet with the current values and saves
- delete asks first and names what goes with it (members, insights, coach advice,
  roster, join code), cancel is the quiet button
- checked the delete policies directly against Postgres by impersonating a
  non-owner inside a rolled-back transaction: the delete removes zero rows, and
  the app turns that into "Only the team owner can delete this team"

**Bugs found + fixed**
- `teams` had update and select policies but no delete policy, so an owner
  deleting a team silently removed nothing. Added the owner delete policy
- the delete dialog blanked out while fading: the team was cleared from state
  before the modal finished animating, so the copy dropped to "This team, its 0
  members" with an empty code. The dialogs now render from the last target
- deleting a cohort flashed the "Cohort not found" screen on the way back to the
  cohort list, since the row left state before the navigation ran
- em dashes had crept into user-facing copy (profile disclaimer, score band hint,
  coach waiting message, score ranges), replaced with plain punctuation

**Still not covered**
- AI coach success path (needs the function deployed and a key)
- no component or e2e tests
- cohort flows need the backend, so local mode only exercises the sheets
