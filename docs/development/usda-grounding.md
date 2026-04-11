# USDA grounding notes

## Purpose

The app should not rely on a multimodal model to invent nutrition facts from vision alone when a public nutrient database can ground the result.

## Current implementation

The repo now includes:
- `src/lib/usda.ts` for USDA search and food-details fetches
- `src/lib/usda-nutrients.ts` for extracting calories/protein/carbs/fat from USDA nutrient arrays
- `src/lib/grounding.ts` for ranking candidate USDA matches and scaling macros by estimated food weight

## Current grounding flow

1. start with structured food candidates from the analysis provider
2. search USDA using the detected food name
3. rank candidates with simple heuristics:
   - exact/near name match
   - shared words
   - USDA score
   - preference for Foundation, then FNDDS, then Branded
4. fetch the best USDA food record
5. extract macros from the USDA nutrient payload
6. scale per-100g macros to the estimated weight from analysis
7. mark the resulting food as `dataSource: "usda"`

## Caveats

This is a useful MVP grounding path, but not the final one.

Known limitations:
- string matching is still simple
- mixed dishes may match imperfectly
- portion weight is still estimated upstream
- caching is not implemented yet
- the route does not invoke grounding automatically yet

## Next steps

- make USDA grounding optional but callable from the analysis pipeline
- add better ranking heuristics and maybe synonym normalization
- cache food-details lookups by `fdcId`
- cache resolved food names to reduce repeated search calls
- surface when grounding failed versus when it succeeded
