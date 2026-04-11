# AI-Macro-Identifier

AI Macro Identifier is a food-photo nutrition app aimed at giving users a fast, grounded estimate of calories and macros from a meal photo.

## Current status

This repo is now in active MVP development.

Current working capabilities:
- upload a food photo with instant local preview
- call an analysis API route from the UI
- render structured food candidates and macro totals
- expose ambiguity, confidence, and follow-up questions
- adjust portions and instantly recalculate totals
- use USDA-oriented helper modules as the nutrient grounding layer foundation

## Product direction

The useful version of this product is not "take a photo and trust the number blindly."

It is:

- detect likely foods in the image
- estimate portion size with explicit uncertainty
- map foods to a nutrient database
- show calories, protein, carbs, and fat
- let the user quickly correct the result before saving it

That correction loop matters because current single-image nutrition estimation is directionally useful, but portion estimation is still the weak point.

## Research takeaways

Based on current literature and platform documentation reviewed while setting up this repo:

- General-purpose multimodal models can be decent for rough food recognition and macro estimation, but error rates are still high enough that this should not be framed as clinically precise.
- Portion size is the core problem. Food naming is easier than estimating how much food is actually present.
- Large portions tend to be systematically underestimated.
- A practical MVP should combine AI vision with a trusted nutrition database such as USDA FoodData Central.
- Confidence and user correction are product requirements, not nice-to-haves.
- Targeted follow-up questions are often a better product choice than pretending a low-confidence estimate is exact.

Detailed notes live in:
- `docs/research-notes-2026-04-11.md`
- `docs/architecture/overview.md`
- `docs/development/roadmap.md`

## Production vs development structure

### Production-oriented app structure

- `src/app` route handlers and app entrypoints
- `src/components` UI components
- `src/lib` domain logic, provider adapters, and integrations
- `src/lib/analysis` analysis-provider abstraction layer

### Development and planning structure

- `docs/architecture` system design notes
- `docs/development` roadmap and workflow notes
- `docs/research-notes-2026-04-11.md` research grounding for product decisions
- `scripts/dev-check.sh` local verification helper

## Current architecture

### Frontend
- Next.js App Router
- single-screen analysis workbench
- image upload with local preview
- API-driven analysis state
- editable portion controls with recalculated totals

### Backend
- `app/api/analyze/route.ts` as backend-for-frontend entry point
- analysis provider abstraction via `src/lib/analysis`
- current mocked provider behind a stable structured schema
- USDA search and nutrient extraction helpers

## API contract, current mocked shape

`POST /api/analyze`

Accepts either:
- `multipart/form-data` with `image`
- `application/json` with `imageBase64` or `imageUrl`

Returns a structured analysis response with:
- overall confidence
- summary
- per-food identification confidence
- per-food portion confidence
- estimated weight ranges
- ambiguity notes
- targeted follow-up questions
- macro totals derived from per-food macro estimates

This richer schema is intentional. The contract is designed to survive real provider integration without forcing a UI rewrite.

## USDA FoodData Central notes

USDA FoodData Central is a strong early data source because it provides public nutrient data and a documented API, but it requires a data.gov API key and has rate limits.

Recommended usage direction:
- prefer Foundation and FNDDS for common foods and mixed dishes
- use Branded as fallback for packaged food matching
- cache resolved matches to reduce repeated lookups

## Environment

Create a `.env.local` file:

```bash
USDA_API_KEY=your_data_gov_api_key_here
```

A starter template exists in `.env.example`.

## MVP definition

A usable MVP should do all of the following:
- accept a food photo
- call a real multimodal model
- return structured food candidates
- ground candidates against USDA data
- show calories, protein, carbs, and fat
- expose confidence and ambiguity clearly
- let the user adjust portions
- save or export a corrected result

## Next implementation priorities

1. Replace the mocked analysis provider with a real multimodal provider adapter.
2. Add validation and normalization for provider output.
3. Expand USDA resolution from search into ranked food matching plus macro extraction.
4. Add caching for repeated USDA lookups and resolved food records.
5. Add persistence for meal history and corrected meals.

## Run locally

```bash
npm install
npm run dev
```

Then open `http://localhost:3000`.

## Verify locally

```bash
./scripts/dev-check.sh
```
