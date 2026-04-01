---
name: alih-developer-guide
description: A comprehensive guide for developing features in the Asia League Ice Hockey app, ensuring consistency and code quality.
---

# Asia League Ice Hockey Developer Guide

This guide outlines the standards, conventions, and best practices for developing features in the project. Always refer to this guide before starting any coding task to ensure consistency and maintain high code quality.

## 1. Technology Stack Requirements

### Core & Framework
- **React**: v18.3
- **Vite**: v5.4 (Build Tool)
- **TypeScript**: v5.8 (Strict typing required)
- **Routing**: React Router DOM v6.30

### Styling & UI
- **Framework**: Tailwind CSS v3.4 (Utility-first)
- **Components**: shadcn/ui (Radix UI based)
  - **Rule**: Do NOT use raw HTML elements like `<button>` for interactive UI. Always use shadcn/ui components (e.g., `<Button>`).

### State & Data Compatibility
- **Server State**: TanStack React Query v5.83
- **Database Client**: @supabase/supabase-js v2.80

### Internationalization (i18n)
- **Library**: react-i18next
- **Languages**: Korean (`ko`), Japanese (`ja`), English (`en`)
- **Rule**: hardcoded strings are prohibited. All UI text must use translation keys.

---

## 2. Project Structure & Organization

- `src/components/ui/` -> Atomic UI components (shadcn/ui).
- `src/components/{feature}/` -> Feature-specific components (e.g., `admin`, `team`, `game`).
- `src/hooks/` -> Custom hooks (`use-notifications.ts`, `useSchedules.ts`).
- `src/pages/` -> Route-level components.
- `src/i18n/locales/` -> Translation JSON files.
- `supabase/functions/` -> Edge Functions (Deno runtime).

---

## 3. Development Conventions

### 3.1 Component Usage
Always prioritize using existing components from `@/components/ui`.

```tsx
// ✅ Correct
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";

export function MyComponent() {
  return <Button variant="default">Click Me</Button>;
}

// ❌ Incorrect
export function MyComponent() {
  return <button className="bg-blue-500 text-white p-2 rounded">Click Me</button>;
}
```

### 3.2 Semantic Styling (Design Tokens)
Use semantic color tokens defined in `index.css` instead of raw colors to support theming and consistency.

- `text-success` -> Positive outcomes (Win, Goal)
- `text-destructive` -> Negative outcomes (Loss, Penalty)
- `text-primary` -> Main interactive elements
- `text-muted-foreground` -> Secondary/subtle text

```tsx
<span className="text-success">Win</span> // ✅
<span className="text-green-500">Win</span> // ❌
```

### 3.3 Internationalization (i18n)
All user-facing text must be wrapped in `t()` function. Dates should be formatted with locale support.

```tsx
import { useTranslation } from 'react-i18next';
import { format } from 'date-fns';
import { getDateLocale } from '@/lib/utils'; // Usage depends on project utils

export function Welcome() {
  const { t } = useTranslation();
  return <h1>{t('welcome_message')}</h1>;
}
```

### 3.4 PWA Safe Area Handling
As a mobile-first PWA, ensure layouts respect safe areas (notch, home indicator).

```tsx
// Add padding for top safe area
className="pt-[calc(1rem+env(safe-area-inset-top))]"

// Add padding for bottom navigation
className="pb-20"
```

---

## 4. Database & Backend (Supabase)

### Key Tables
- `profiles`: User profiles
- `alih_schedule`: Game schedules and live scores
- `alih_players`: Player data and stats
- `alih_predictions`: Match predictions

### Edge Functions
- `live-game`: Handles real-time notifications for games.
- `send-test-push`: For testing push notifications.

Always verify Row Level Security (RLS) policies when creating or modifying tables.

---

## 5. Workflow Checklist
Before finalizing any task:
1. [ ] Check `AGENTS.md` for any recent context updates.
2. [ ] Ensure no hardcoded strings exist (use i18n).
3. [ ] Verify responsive design for mobile (PWA).
4. [ ] Test core flows if logic was changed.
5. [ ] **Verify Imports**: Check for duplicate imports or identifiers, especially when pasting code blocks.
