# Development roadmap

## Current status

The repo is in active MVP construction.

Implemented so far:
- Next.js app scaffold
- local upload preview
- API-driven analysis workbench
- rich mocked analysis schema
- editable portion controls
- USDA search helper
- USDA macro extraction helper
- research notes and architecture notes

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

## Current priorities

1. replace mocked analysis with a real provider adapter
2. add response validation and normalization
3. implement USDA-backed nutrient resolution for detected foods
4. add light caching for resolved food matches
5. add a save/log action backed by persistent storage

## Delivery discipline

- keep the analysis schema stable while swapping providers
- do not hide uncertainty from the user
- avoid fake precision in macro totals
- validate every external response before using it
- keep build and lint green after each slice
