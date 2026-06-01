# KyodoAI  
## Orbital 2026 Milestone 1 README / Updated Proposal

Project Name: KyodoAI  
Team Members: Malvika and Ethan  
Orbital Level: Project Gemini  
Project Type: Mobile app prototype  
Current Platform: Expo React Native  
Primary Stack: TypeScript, Expo Router, Supabase Auth

---

# 1. Project Overview

KyodoAI is a team compatibility and formation app for university students. The long-term goal of the project is to help students start group projects with better awareness of each other’s working styles, preferred roles, and collaboration habits.

Many student teams are formed based on friendship, convenience, or random allocation. However, successful teamwork often depends on deeper factors such as communication style, planning habits, preferred leadership roles, working pace, conflict management, and expectations around quality of work.

KyodoAI aims to provide a structured way for students to understand themselves and their potential teammates before or during a project. In future milestones, the app will allow users to set up profiles, complete work-style questionnaires, form or join teams, and view compatibility insights that help teams discuss expectations early.

For Milestone 1, KyodoAI is implemented as an early mobile app foundation. The current app includes email/password authentication using Supabase Auth, basic navigation, a signed-in Home screen, placeholder Teams and Profile tabs, and a clean white/green modern user interface based on our prototype direction.

The current submission focuses on building a stable technical and design foundation for the larger KyodoAI vision.

---

# 2. Problem Statement

University students often work in groups for module projects, hackathons, student clubs, and programmes such as Orbital. However, students usually form teams without knowing enough about how each person works.

A team may look suitable at first because members are friends or have similar availability, but problems can appear later when members have different expectations. For example, one student may prefer starting work early while another prefers working closer to deadlines. One person may expect frequent updates, while another may prefer independent work. Some students may naturally take leadership roles, while others may prefer contributing quietly in the background.

These differences are not necessarily bad. In fact, different working styles can make a team stronger if they are understood early. The problem is that many teams only discover these differences after conflict, uneven workload, or missed deadlines have already happened.

Common issues faced by student teams include:

- Poor communication
- Uneven workload distribution
- Last-minute project stress
- Conflicting leadership expectations
- Different standards for detail and quality
- Lack of clarity about each member’s preferred role
- Difficulty discussing team friction openly
- Frustration caused by mismatched working styles

KyodoAI addresses this problem by aiming to make team formation more intentional. Instead of leaving team compatibility completely to chance, the app encourages students to reflect on how they work and discuss collaboration habits early.

---

# 3. Motivation

The motivation behind KyodoAI comes from the observation that many project teams do not fail because members lack ability. Instead, teams often struggle because members do not communicate expectations clearly at the start.

For student teams, this issue is especially common because projects are often short, deadlines are tight, and team members may not know one another well. Students may be uncomfortable bringing up potential issues such as pace, communication frequency, workload expectations, or conflict management.

KyodoAI is designed around the idea that better awareness can lead to better teamwork. If team members understand each other’s work styles early, they can adjust expectations, divide roles more fairly, and reduce avoidable conflict.

The project is also motivated by the increasing use of technology to support collaboration. While many tools focus on task management after a team is formed, KyodoAI focuses on the earlier stage: helping students form and understand teams before serious project problems begin.

---

# 4. Target Users

KyodoAI is designed for university students who need to work in project teams.

The target users include:

- Students working on module projects
- Orbital project teams

- Student club project groups
- Freshmen forming project teams for the first time
- Students looking for teammates with compatible work habits
- Future educators or organisers who may want to support better team formation

These users often need to collaborate quickly, sometimes with people they do not know well. KyodoAI aims to support them by creating a structured way to understand collaboration habits before the team becomes too deeply involved in the project.

---

# 5. Proposed Solution

KyodoAI is proposed as a mobile app that supports student team formation and compatibility awareness.

The planned full app experience is:

1. A student registers or logs in.
2. The student sets up a profile with basic academic and project information.
3. The student completes a work-style questionnaire.
4. KyodoAI generates a work-style profile.
5. The student creates or joins a project team.
6. The team views compatibility insights based on members’ profiles and questionnaire responses.
7. The team uses these insights to discuss strengths, possible friction points, and collaboration habits early.

The long-term product is not meant to judge whether a team will definitely succeed or fail. Instead, KyodoAI will act as a discussion aid. It will help students identify possible working-style differences early and turn them into useful conversations.

The AI-related direction of KyodoAI is planned as AI-supported work-style profiling and team compatibility support. Real AI/LLM-generated summaries are not fully implemented in the current Milestone 1 version. They are part of the future roadmap.

---

# 6. Current Milestone 1 Implementation

For Milestone 1, we focused on creating a working technical foundation for the app.

The current implemented app includes:

- Expo React Native app
- TypeScript setup
- Expo Router navigation
- Supabase Auth setup using email/password registration and login
- Supabase environment configuration through .env.local
- Register screen
- Login screen
- Welcome screen
- Successful register/login bringing the user to the Home screen
- Basic tab navigation with Home, Teams, and Profile tabs
- Home screen confirming that the user is signed in


The current Milestone 1 app demonstrates that the project has a functioning authentication flow, an organised navigation structure, Supabase connection setup, and an initial mobile interface. 

---

# 7. Current App Flow

The current user flow is intentionally simple and stable.

## Current Flow

1. User opens the app.
2. User lands on the welcome/authentication flow.
3. User can register using email and password.
4. User can log in using email and password.
5. After successful registration or login, the user is brought to the Home screen.
6. The Home screen confirms that the user is signed in.
7. The user can navigate between the Home, Teams, and Profile tabs.
8. The Teams tab currently displays “Updates coming soon”.
9. The Profile tab currently displays “Updates coming soon”.
10. The user can sign out.

This current flow proves the base structure of the app. Future milestones will expand the Teams and Profile tabs into the main team formation and compatibility features.

---

# 8. Technical Architecture

KyodoAI is currently built as a mobile app using Expo React Native.

The app is organised around authentication routes and tab routes. Expo Router is used to manage navigation between the authentication screens and the signed-in app screens.

The current architecture separates the app into:

- Authentication screens
- Signed-in tab screens
- Shared UI components
- Theme constants
- App state management
- Supabase client setup
- Backend helper functions
- Domain types

This structure keeps the app maintainable and ready for future expansion.

## Current Key Files

The current project structure includes the following important files:

text app/(auth)/welcome.tsx app/(auth)/register.tsx app/(auth)/login.tsx  app/(tabs)/home.tsx app/(tabs)/teams.tsx app/(tabs)/profile.tsx app/(tabs)/_layout.tsx  app/_layout.tsx app/index.tsx  components/ui.tsx constants/theme.ts  lib/appState.tsx lib/supabase/client.ts lib/supabase/backend.ts  types/domain.ts 

## File Responsibilities

### Authentication Screens

text app/(auth)/welcome.tsx app/(auth)/register.tsx app/(auth)/login.tsx 

These files handle the current welcome, registration, and login flows.

### Signed-In Tabs

text app/(tabs)/home.tsx app/(tabs)/teams.tsx app/(tabs)/profile.tsx app/(tabs)/_layout.tsx 

These files form the signed-in tab shell of the app. The Home screen currently confirms that the user is signed in. Teams and Profile are placeholder screens for future development.

### Root Layout and Routing

text app/_layout.tsx app/index.tsx 

These files support the overall routing structure and entry behaviour of the app.

### Shared UI and Theme

text components/ui.tsx constants/theme.ts 

These files define reusable UI elements and the visual theme used across the app. The current visual style follows a clean white/green modern mobile direction.

### App State and Supabase

text lib/appState.tsx lib/supabase/client.ts lib/supabase/backend.ts 

These files manage app state and Supabase-related logic. Supabase is currently used for authentication.

### Domain Types

text types/domain.ts 

This file supports type definitions for the app and future domain features.

---

# 9. Tech Stack

## Frontend

- Expo React Native
- TypeScript
- Expo Router

## Backend / Authentication

- Supabase Auth
- Supabase JavaScript client

## Configuration

- Environment variables through .env.local

## Design Direction

- White and green modern mobile interface
- Clean student-productivity app aesthetic


---

# 10. Supabase Setup and Environment Variables

KyodoAI currently uses Supabase for authentication. Supabase configuration is handled through environment variables stored locally in .env.local.

## Install Supabase Dependency

To install the Supabase JavaScript client:

bash npm install @supabase/supabase-js 

## Create .env.local

Create a .env.local file in the project root:

env EXPO_PUBLIC_SUPABASE_URL=https://zbufsgcmmvhckciszakr.supabase.co EXPO_PUBLIC_SUPABASE_KEY=sb_publishable_dGUFB4HfdDYHNF7g5Bijkg_JsipoWK2 

The .env.local file should be created locally and should not be committed to GitHub. It is normally ignored by git to avoid exposing environment-specific configuration in the repository.

## Supabase Client File

The app uses Supabase through:

text lib/supabase/client.ts 

This file reads the Supabase URL and key from the environment variables and creates the Supabase client used by the app.

## Current Supabase Usage

At Milestone 1, Supabase is currently used for:

- Email/password registration
- Email/password login
- Authentication session handling

In future milestones, Supabase will also support database-backed profile, questionnaire, team, and compatibility features.

---

# 11. Planned Supabase Database Schema

A Supabase project has been prepared with planned database tables for future KyodoAI features.

The planned schema includes:

text profiles questionnaire_answers personality_results teams team_members compatibility_results 

These tables are part of the planned backend architecture for Milestone 2 and Milestone 3 development.

## Planned Table Purposes

### profiles

This table is planned to store user profile information such as:

- Name
- University
- Course
- Year
- Preferred role
- Bio

### questionnaire_answers

This table is planned to store users’ responses to the work-style questionnaire.

### personality_results

This table is planned to store generated work-style or personality-style results based on questionnaire responses.

### teams

This table is planned to store team information such as team names, join codes, and creator information.

### team_members

This table is planned to manage the relationship between users and teams, allowing users to join multiple teams.

### compatibility_results

This table is planned to store team-level compatibility results, including compatibility summaries, strengths, friction points, and collaboration tips.

At the current Milestone 1 stage, these tables should be understood as planned backend architecture for future expansion, rather than completed active app flows.

---

# 12. Planned User Flow

The full planned KyodoAI user flow is:

1. User opens the app.
2. User registers or logs in.
3. User lands on the Home screen.
4. User completes profile setup.
5. User answers a work-style questionnaire.
6. User receives a work-style profile.
7. User creates a team or joins a team using a code.
8. Team members are displayed in the team dashboard.
9. KyodoAI generates compatibility insights.
10. The team reviews strengths, friction points, and collaboration tips.
11. The team uses the insights to discuss collaboration expectations early.

For Milestone 1, the app currently covers steps 1 to 3, with the structure prepared for future expansion into the remaining steps.

---



# 14. Testing

Testing for Milestone 1 focuses on verifying that the core foundation works correctly.

## Tested Areas

### Register Flow

We tested that a new user can register using email and password and be brought to the signed-in Home screen.

### Login Flow

We tested that an existing user can log in using email and password.

### Home Screen

We tested that the Home screen appears after successful register/login and confirms that the user is signed in.

### Tab Navigation

We tested that the user can move between:

- Home
- Teams
- Profile

### Placeholder Screens

We tested that the Teams and Profile tabs display “Updates coming soon”, which matches the current Milestone 1 app scope.

### Supabase Configuration

We tested that Supabase Auth is connected through environment variables in .env.local.

### UI Consistency

We reviewed the app’s white/green modern UI direction for consistency across the current authentication and tab screens.

### TypeScript

We checked that TypeScript typecheck passes as part of ensuring the codebase is stable.

---

# 15. Current Limitations

KyodoAI is currently an early Milestone 1 prototype. The current submission focuses on authentication, navigation, Supabase setup, and UI foundation.

The following features are not yet implemented in the active app UI:

- Profile setup
- Work-style questionnaire
- Work-style result generation
- Team creation
- Team joining
- Multiple teams per user
- Leave team function
- Compatibility result screen
- Compatibility strengths, friction points, and collaboration tips
- AI-generated summaries
- Real AI/LLM integration

These limitations are expected at this stage because Milestone 1 is being used to establish the foundation of the app. The current version proves that the app can support user authentication, routing, tab navigation, and Supabase configuration, which are necessary before building the full compatibility system.

KyodoAI’s AI-related features should currently be understood as planned future development. The long-term plan is to support AI-inspired work-style profiling and team compatibility insights, with possible AI-generated summaries in later milestones.

---

# 16. Risks and Mitigations

## Risk 1: The app may become too broad in scope

KyodoAI has many possible features, including profiles, questionnaires, team formation, compatibility insights, AI summaries, and educator support.

Mitigation:  
We will prioritise the core product flow first: authentication, profile setup, questionnaire, team creation/joining, and compatibility insights. More advanced features will be added only after the main flow is stable.

---

## Risk 2: AI features may be difficult to implement well

Real AI-generated summaries require careful prompt design, cost considerations, and reliability checks.

Mitigation:  
AI features will be treated as future enhancements. The core app will first focus on structured work-style profiling and compatibility support. This ensures the app remains useful even before advanced AI features are introduced.

---

## Risk 3: Compatibility results may be misunderstood as absolute judgments

Users may treat compatibility results as final conclusions about whether a team is good or bad.

Mitigation:  
KyodoAI will present compatibility insights as discussion prompts, not fixed judgments. The app will focus on helping teams understand possible strengths and friction points so they can communicate better.

---

## Risk 4: Authentication and database integration may create technical issues

Supabase integration is important for the app, but authentication and database features may introduce edge cases.

Mitigation:  
We started with Supabase Auth first in Milestone 1. Future database features will be added gradually and tested in stages.

---

## Risk 5: Users may not complete the questionnaire

If the questionnaire is too long or unclear, students may not finish it.

Mitigation:  
Future questionnaire design will prioritise short, practical, and easy-to-answer questions. The questions will focus on behaviours students can easily relate to.

---

# 17. Milestone 2 Plan

For Milestone 2, we plan to build the main user identity and work-style profiling features.

## Planned Milestone 2 Features

### Profile Setup

Add a profile setup flow where users can enter:

- Name
- University
- Course
- Year
- Preferred role
- Bio

### Profile Tab

Expand the current Profile tab from a placeholder into a functional screen where users can view their profile.

### Work-Style Questionnaire

Build a questionnaire that asks users about practical collaboration habits, such as:

- Planning style
- Communication preference
- Leadership preference
- Work pace
- Conflict handling
- Detail orientation
- Collaboration style

### Work-Style Result

Add a result screen that summarises the user’s work style in a clear and student-friendly way.

### Supabase Database Integration

Connect profile and questionnaire data to Supabase database tables.

### UI Improvements

Continue polishing the white/green mobile interface so that the app feels consistent, modern, and easy to use.

## Milestone 2 Goal

The goal for Milestone 2 is for a user to be able to register, log in, complete their profile, answer the questionnaire, and view a work-style result.

---

# 18. Milestone 3 Plan

For Milestone 3, we plan to build the team formation and compatibility insight features.

## Planned Milestone 3 Features

### Team Creation

Allow users to create a team and generate a join code.

### Join Team

Allow users to join an existing team using a code.

### Multiple Teams

Allow users to belong to multiple teams.

### Team Dashboard

Build a Teams tab that shows the user’s joined teams and basic team information.

### Leave Team

Allow users to leave teams when needed.

### Compatibility Insights

Generate team compatibility insights based on members’ profiles and questionnaire responses.

Planned compatibility content includes:

- Overall compatibility summary
- Strengths
- Possible friction points
- Collaboration tips

### Future AI-Supported Summaries

Explore AI-supported summaries that can explain compatibility insights in a more natural and personalised way.

## Milestone 3 Goal

The goal for Milestone 3 is for users to form teams inside KyodoAI and view meaningful compatibility insights that help them discuss collaboration expectations early.

---

# 19. Future AI-Related Plans

KyodoAI’s long-term direction includes AI-supported work-style profiling and team compatibility assistance.

Future AI-related features may include:

- AI-generated team compatibility summaries
- More personalised collaboration recommendations
- Better teammate matching suggestions
- Weekly team health check-ins
- Reflection prompts for teams
- Educator or cohort-level team formation support

However, these AI-related features are planned future work. They are not fully implemented in the current Milestone 1 version.

The immediate priority is to first build a reliable structured app flow. Once profile, questionnaire, and team data are properly implemented, AI-supported features can be added more meaningfully.

---

# 20. How to Run the App Locally

## Step 1: Clone the Repository

bash git clone <your-repository-url> cd KyodoAI 

## Step 2: Install Dependencies

bash npm install 

## Step 3: Install Supabase Client

bash npm install @supabase/supabase-js 

## Step 4: Create .env.local

Create a .env.local file in the project root:

env EXPO_PUBLIC_SUPABASE_URL=https://zbufsgcmmvhckciszakr.supabase.co EXPO_PUBLIC_SUPABASE_KEY=sb_publishable_dGUFB4HfdDYHNF7g5Bijkg_JsipoWK2 

The .env.local file should be created locally. It should be ignored by git and should not be committed to the repository.

## Step 5: Start the App

bash npx expo start 

You can then run the app using:

- Expo Go on a physical device
- iOS simulator
- Android emulator
- Web preview, depending on your local setup

---

# 21. Conclusion

KyodoAI is a team compatibility and formation app designed to help university students start group projects with better awareness of each other’s working styles, preferred roles, and collaboration habits.

For Milestone 1, we built a strong foundation for the app. The current implementation includes Expo React Native, TypeScript, Expo Router, Supabase Auth, environment-based configuration, register/login screens, signed-in Home screen, tab navigation, and a clean white/green mobile UI.

The current version does not yet include the full questionnaire, profile setup, team formation, compatibility results, or AI-generated summaries. These are planned for future milestones and are clearly part of the project roadmap.

Overall, Milestone 1 establishes the technical base and product direction for KyodoAI. With this foundation in place, the next stages of development will focus on building the profile system, work-style questionnaire, team formation flow, compatibility insights, and future AI-supported collaboration features.

