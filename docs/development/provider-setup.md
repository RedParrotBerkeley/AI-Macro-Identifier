# Provider setup

## Current state

The app currently defaults to the mock provider.

Provider selection happens in:
- `src/lib/analysis/factory.ts`

Current supported values:
- unset or anything else -> mock provider
- `ANALYSIS_PROVIDER=openai` -> placeholder OpenAI provider path

## Environment

Add the provider selection variable to `.env.local`:

```bash
ANALYSIS_PROVIDER=openai
```

When the live provider adapter is wired, this file should also hold the provider API key.

Planned environment shape:

```bash
ANALYSIS_PROVIDER=openai
OPENAI_API_KEY=your_api_key_here
USDA_API_KEY=your_data_gov_api_key_here
```

## Guidance

- keep the UI bound to the stable analysis schema
- map provider output into the server-side schema validation layer
- treat provider failures as structured API errors
- keep USDA grounding separate from provider vision output
