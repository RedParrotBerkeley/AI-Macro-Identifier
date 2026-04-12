# PR and release-readiness checklist

## Pull request checklist

- [ ] `npm run lint` passes
- [ ] `npm run build` passes
- [ ] README reflects the current architecture
- [ ] any new environment variables are documented
- [ ] no secrets are committed
- [ ] user-facing changes were manually exercised
- [ ] branch is pushed and PR description is updated

## MVP release-readiness checklist

- [ ] provider returns real structured food candidates
- [ ] provider output is validated and normalized server-side
- [ ] USDA grounding runs after provider analysis
- [ ] confidence and ambiguity are visible in the UI
- [ ] user can adjust portions
- [ ] user can save a result
- [ ] user can view saved meals
- [ ] user can copy/export the macro summary
- [ ] obvious failure states have user-readable messages
- [ ] README and setup docs are current
