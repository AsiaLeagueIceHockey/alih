---
name: ideation-guide
description: Helps users flesh out feature ideas into concrete implementation plans, linking to the developer guide for technical consistency.
---

# Ideation & Feature Planning Guide

This skill helps transform a rough idea into a concrete implementation plan, ensuring it aligns with the `alih-developer-guide` and project standards.

## 1. Ideation Process

When the user presents an idea, follow these steps:

1.  **Clarify the Goal**: Ask questions to understand the *core problem* or *opportunity*.
    *   "What is the user trying to achieve?"
    *   "How does this benefit the app?"
2.  **Define the Scope**: Break down the idea into specific features or changes.
3.  **Check Technical Feasibility**: Reference `alih-developer-guide` to ensure the proposal fits the tech stack (React, Supabase, Tailwind, etc.).
    *   *Self-Correction*: If the idea requires a new library, verify if an existing one can do the job first (e.g., using `shadcn/ui` instead of a new UI lib).
4.  **Draft Implementation Plan**: Create a mini-spec.

## 2. Output Format (Implementation Plan)

After discussing, produce a plan in the following format:

```markdown
# [Feature Name] Implementation Plan

## 1. Overview
(Brief description of the feature)

## 2. Technical Specs
- **Components**: (List new/modified components)
- **Database**: (Schema changes if any, referencing Supabase best practices)
- **API/Hooks**: (e.g., `useSchedules`, `Edge Functions`)
- **i18n**: (List new translation keys needed)

## 3. UI/UX Design
- (Description of the UI, referencing semantic tokens like `text-success`)
- (Mobile responsiveness considerations)

## 4. Step-by-Step Tasks
- [ ] Step 1
- [ ] Step 2
```

## 3. Execution Integration

Once the plan is approved, the agent should transition to using the `alih-developer-guide` for the actual coding phase.

## 4. Example Prompt to Agent

> "I want to add a 'Game Prediction' feature."

**Agent Response (using this skill):**
"Great idea! Let's flesh that out.
1.  **Where** should this appear? (Live game page? Home?)
2.  **Logic**: Is it just for fun, or are there rewards?
3.  **Data**: We'll likely need a new table `alih_predictions`.
Let me draft a plan based on our `alih-developer-guide`..."
