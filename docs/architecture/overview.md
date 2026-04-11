# Architecture overview

## Current architecture

### Frontend
- Next.js App Router
- single-screen MVP workbench
- image upload with local preview
- API-driven analysis rendering
- portion adjustment UI with recalculated totals

### Backend
- `app/api/analyze/route.ts` as the backend-for-frontend entry point
- current mocked structured analysis response
- USDA helpers for search and macro extraction

### Data flow
1. user uploads a food image
2. frontend previews locally
3. frontend calls `/api/analyze`
4. backend returns structured food candidates
5. UI renders totals, ambiguity, and follow-up questions
6. user adjusts portions before future save/log actions

## Planned production architecture

### Analysis layer
- provider adapter interface for multimodal model calls
- strict structured output contract
- server-side validation and normalization
- follow-up question generation only when confidence is weak

### Nutrition grounding layer
- USDA search ranking
- nutrient extraction from matched foods
- caching for repeated lookups
- fallback strategy across Foundation, FNDDS, and Branded foods

### Product layer
- correction-aware meal logging
- meal history
- user-specific defaults and priors
- future authentication and persistence

## Repo structure intent

- `src/app` routes and UI entry points
- `src/components` UI components
- `src/lib` domain logic and integrations
- `docs/architecture` system design notes
- `docs/development` engineering workflow notes
- `scripts` utility scripts as needed
