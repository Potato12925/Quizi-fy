# Frontend Architecture Rules

This document defines mandatory frontend architecture rules.  
All generated code must strictly follow this structure.

Violating these rules is considered an architecture error.

---

# api/

## Purpose

Contains all backend/API communication logic.

## Responsibilities

- Perform HTTP requests:
  - GET
  - POST
  - PUT
  - DELETE
- Isolate API communication from UI components
- Configure axios/fetch clients
- Handle request/response interceptors
- Handle authentication tokens

## Rules

- API logic must not exist inside components
- API modules must be separated by feature/module
- API layer must not contain UI logic

## Example Modules

- auth_api
- user_api
- question_api
- exam_api
- document_api
- class_api

---

# assets/

## Purpose

Contains static frontend assets.

## Includes

- images
- icons
- fonts
- svg files
- videos
- media files
- shared animations
- shared css assets

## Rules

- Assets must not contain business logic
- Assets should be optimized for frontend usage

---

# components/

## Purpose

Contains reusable React components.

## Responsibilities

- Reusable UI components
- Shared business components
- Isolated UI logic

## Rules

- Components must be reusable
- Components must not represent a full page
- Components should remain modular and composable
- Components should avoid direct API calls when possible

## UI Component Examples

- Button
- Input
- Modal
- Table
- Card

## Business Component Examples

- QuestionCard
- ExamForm
- UploadBox

---

# hooks/

## Purpose

Contains custom React hooks.

## Responsibilities

- Reuse state logic
- Reuse lifecycle logic
- Separate logic from UI components

## Rules

- Hooks must start with "use"
- Hooks should contain reusable logic
- Hooks must not contain page-level UI rendering

## Examples

- useAuth
- useDebounce
- useUploadFile
- useExamTimer

---

# layouts/

## Purpose

Contains reusable application layouts.

## Responsibilities

- Define shared application structure
- Reuse navigation and page layout
- Manage role-based layouts

## Includes

- sidebar
- navbar
- footer
- content wrapper

## Examples

- TeacherLayout
- StudentLayout
- AdminLayout

---

# pages/

## Purpose

Contains main application pages/screens.

## Responsibilities

- Represent full application pages
- Combine multiple components into complete screens
- Handle page-level orchestration

## Rules

- Each page usually maps to one route
- Pages may contain page-specific logic
- Pages should use components instead of duplicating UI

## Examples

- LoginPage
- DashboardPage
- CreateExamPage

---

# routes/

## Purpose

Manages application routing and navigation.

## Responsibilities

- Define route mappings
- Handle protected routes
- Handle role-based routes
- Manage navigation structure

## Technologies

- react-router-dom

## Rules

- Routes must not contain business logic
- Routes should only manage navigation and access control

---

# schemas/

## Purpose

Contains validation schemas for forms and frontend data validation.

## Responsibilities

- Validate form input
- Validate request payloads before API submission
- Prevent invalid frontend state

## Technologies

- zod
- yup
- joi

## Rules

- Schemas must only handle validation
- Schemas must not contain UI logic
- Schemas must not contain business orchestration

## Examples

- loginSchema
- registerSchema
- createExamSchema

---

# store/

## Purpose

Contains global application state management.

## Responsibilities

- Manage shared state
- Synchronize application data
- Handle global app state

## Technologies

- Redux Toolkit
- Zustand
- Context API

## Common State Examples

- auth state
- user info
- exam state
- question state

## Rules

- Store must not contain direct UI rendering
- Store should centralize shared application state
- Store logic should remain predictable and maintainable

---

# styles/

## Purpose

Contains global application styling configuration.

## Responsibilities

- Global CSS
- Tailwind configuration
- Theme management
- Color variables
- Typography
- Shared animations

## Includes

- global.css
- reset.css
- variables.css
- tailwind.config

## Rules

- Styles must be reusable and centralized
- Avoid inline styling duplication

---

# types/

## Purpose

Contains shared TypeScript types and interfaces.

## Responsibilities

- Define shared data types
- Improve type safety
- Improve autocomplete and developer experience

## Includes

- interfaces
- enums
- generic types
- API response types

## Examples

- AuthTypes
- QuestionTypes
- ExamTypes
- UserTypes

---

# utils/

## Purpose

Contains reusable utility functions.

## Responsibilities

- Date formatting
- Data validation helpers
- localStorage helpers
- Constants helpers
- String formatting
- Parsing utilities

## Rules

- Utils must not depend on UI
- Utils must not contain business orchestration
- Utils should remain pure and reusable

---

# Request Flow

```text
Page
→ Hook
→ API
→ Backend
```

---

# Response Flow

```text
Backend
→ API
→ Store / Hook
→ Component
→ UI
```

---

# Dependency Rules

- pages may import:
  - components
  - hooks
  - store
  - schemas
  - api

- components may import:
  - hooks
  - utils
  - types
  - styles

- hooks may import:
  - api
  - store
  - utils
  - types

- api may import:
  - types
  - utils

- store may import:
  - api
  - types
  - utils

## Forbidden Imports

- api must not import components
- api must not import pages
- utils must not import components
- hooks must not import pages
- store must not import pages
- components must not directly access backend without api layer

---

# Naming Convention

## File Naming

```text
auth_api.ts
question_hook.ts
exam_store.ts
login_schema.ts
question_card.tsx
teacher_layout.tsx
```

## Component Naming

```text
QuestionCard
ExamForm
UploadBox
TeacherLayout
```

## Hook Naming

```text
useAuth
useExamTimer
useUploadFile
```

---

# State Management Rules

- Global shared state must be stored inside store/
- Local UI state should remain inside components when possible
- Avoid unnecessary global state
- Server state and UI state should be separated

---

# API Rules

- All backend communication must go through api/
- Components must not call fetch/axios directly
- Token handling must be centralized
- API error handling should be standardized

---

# Validation Rules

- Form validation must use schemas/
- UI components should not contain duplicated validation logic
- Validation rules should be reusable across forms

---

# Async Rules

- All API calls must use async/await
- Async operations must handle loading and error states
- Avoid unhandled promises

---

# UI Rules

- UI components should remain presentation-focused
- Business logic should be extracted into hooks or store
- Avoid large monolithic components
- Prefer composition over deeply nested components

---

# Styling Rules

- All generated UI must use the global theme variables defined in `styles/root.css`
- Use CSS variables from `:root` instead of hardcoded colors
- Reuse shared styles and theme variables across the application
- Avoid duplicated style definitions
- Maintain consistent color usage throughout the UI
- Prefer utility-first styling when using TailwindCSS
- Tailwind classes must align with the defined design system colors

## Root Theme Variables

````css
:root {
  --color-primary-dark: #5E0006;
  --color-primary: #9B0F06;
  --color-secondary: #D53E0F;
  --color-light: #EED9B9;
}
---

# Forbidden Practices

- Do not call APIs directly inside deeply nested components
- Do not place business logic inside presentational components
- Do not duplicate validation logic across forms
- Do not store global state inside local components unnecessarily
- Do not mix API logic with UI rendering
- Do not hardcode tokens or secrets
- Do not place routing logic inside components
- Do not place large business workflows inside pages

---

# Example Project Structure

```text
src/
├── api/
├── assets/
├── components/
├── hooks/
├── layouts/
├── pages/
├── routes/
├── schemas/
├── store/
├── styles/
├── types/
├── utils/
````
