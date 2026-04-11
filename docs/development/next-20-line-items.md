# Next 20 line items

This list is ordered for MVP progress, not novelty.

## 1-5: make the pipeline real

1. Wire `src/lib/analysis/factory.ts` to support a real provider selection path via environment flag.
2. Implement the first live multimodal provider adapter behind the existing analysis contract.
3. Convert provider output into the validated schema in `src/lib/analysis/normalize.ts`.
4. Add explicit provider error handling in `/api/analyze` so failures return structured API errors.
5. Invoke `groundAnalysisWithUsda()` inside the analysis route after provider analysis succeeds.

## 6-10: improve grounding quality

6. Add a `grounding` section to the API response showing which foods were USDA-grounded.
7. Add synonym cleanup for common food names before USDA search, for example chicken breast vs grilled chicken.
8. Add in-memory caching for USDA search results by normalized query.
9. Add in-memory caching for USDA food detail lookups by `fdcId`.
10. Improve USDA candidate ranking by penalizing obviously wrong branded matches for generic foods.

## 11-15: improve product usability

11. Show grounding success/failure badges in the UI for each detected food.
12. Surface provider and pipeline-stage details in a developer-friendly debug panel.
13. Add a user-visible "re-run analysis" flow after portion or photo changes.
14. Add a lightweight loading state that explains what the system is doing, not just a spinner.
15. Add optional manual food replacement when USDA grounding chooses the wrong item.

## 16-20: cross the MVP threshold

16. Add a save-result action with a simple local persistence layer.
17. Add meal history view for previously analyzed items.
18. Add export or copy summary action for calories and macros.
19. Add environment setup docs for the first real provider, including required API keys.
20. Add a PR checklist and release-readiness checklist so MVP completion is measurable.
