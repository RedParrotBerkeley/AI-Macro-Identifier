# AI Macro Identifier research notes

Date: 2026-04-11

## Goal

Ground the next implementation steps in current research and practical platform constraints for food-photo macro estimation.

## What current research says

### 1. Portion estimation is still the bottleneck

Across recent reviews and evaluations, food recognition is improving faster than portion estimation.

Key themes:
- Single-image intake estimation remains fundamentally ambiguous because 2D images lose depth information.
- Large portions are often systematically underestimated.
- Mixed dishes, sauces, oils, and hidden ingredients remain especially difficult.
- One-photo systems are useful for rough logging, but not strong enough for clinical precision without correction or additional context.

Sources reviewed:
- Food Portion Estimation: From Pixels to Calories (arXiv 2026)
- Performance Evaluation of 3 Large Language Models for Nutritional Content Estimation from Food Images (PMC)
- Image-based food monitoring and dietary management for patients living with diabetes: a scoping review (Frontiers 2025)
- Image-based food portion size estimation using a smartphone without a fiducial marker (PMC)

### 2. Multimodal LLMs are strong enough for MVP recognition, but should be grounded

Recent work suggests multimodal LLM systems become materially more useful when they are grounded in authoritative food databases instead of free-guessing nutrient values.

Strong pattern:
- image understanding for likely foods and portions
- retrieval against a nutrition database
- structured nutrient calculation from retrieved records

This is more robust than asking the model to invent calories/macros directly.

Source reviewed:
- DietAI24 as a framework for comprehensive nutrition estimation using multimodal large language models (PMC 2025)

### 3. UX matters as much as model quality for adherence

Recent product and HCI research on food logging points in the same direction:
- users abandon rigid logging systems
- lower-friction capture improves adherence
- automatic image recognition can improve speed and accuracy versus more manual flows
- targeted follow-up questions can improve missing context without overwhelming the user

Important nuance:
- the app should not interrogate users every time
- it should only ask follow-up questions when confidence is low or a portion is especially uncertain

Sources reviewed:
- SnappyMeal: Design and Longitudinal Evaluation of a Multimodal AI Food Logging Application (arXiv 2025)
- Automatic Image Recognition Meal Reporting Among Young Adults: Randomized Controlled Trial (JMIR 2025)

## Product implications for this repo

### Good MVP framing

Do:
- present results as estimates
- show confidence
- let users quickly adjust foods and portions
- keep analysis fast and lightweight
- use USDA as nutrient truth where possible

Do not:
- present one-photo macro output as precise truth
- hide uncertainty
- depend on the model to hallucinate nutrition values from raw vision alone

### Recommended first production pipeline

1. user uploads or captures a food image
2. backend normalizes image and sends it to a multimodal model
3. model returns structured candidates:
   - visible foods
   - confidence
   - estimated portion or weight range
   - notes about ambiguity
4. app resolves foods against USDA FoodData Central
5. app computes calories/protein/carbs/fat from USDA-backed records
6. user adjusts portions or swaps foods if needed
7. corrected version becomes the saved meal log

### Recommended confidence behavior

Use confidence on two axes, not one:
- food identification confidence
- portion confidence

Then derive a user-facing overall confidence label.

### Recommended follow-up questions

Ask only when needed, for example:
- "Was this grilled chicken or fried chicken?"
- "Was that about 1 cup of rice or closer to 2 cups?"
- "Was there a creamy sauce or dressing not fully visible?"

That is better than generic chatty back-and-forth.

## USDA FoodData Central notes

USDA remains a strong default nutrition source for the MVP because:
- public API
- strong coverage of foundational foods and branded products
- standard nutrient fields

Constraints:
- requires a data.gov API key
- rate limit is about 1,000 requests/hour per IP by default
- search quality varies, so app-side ranking and fallback logic matter

Recommended use:
- prefer Foundation and FNDDS for common whole foods and prepared dishes
- use Branded as fallback or for packaged food matching
- cache resolved food matches to reduce repeat lookups and rate pressure

## Model/provider implementation notes

Independent of provider, current best practice is to require structured output instead of parsing freeform prose.

Desired response shape from the vision model:
- meal summary
- candidate foods array
- per-food confidence
- estimated portion description
- estimated gram range
- ambiguity notes
- follow-up question suggestions when confidence is low

Provider direction:
- use strict structured JSON output where supported
- validate server-side
- treat refusal/invalid output as first-class errors
- separate vision detection from nutrient resolution

## Build recommendation for the next slice

The next implementation should not jump straight to a live model.

Instead:
1. connect upload UI to `/api/analyze`
2. render analysis from API state instead of static demo values
3. define a stronger response contract with portion confidence and optional follow-up questions
4. then plug in a real multimodal provider behind that stable contract
5. after that, deepen USDA resolution and caching

That order reduces churn and keeps the system debuggable.
