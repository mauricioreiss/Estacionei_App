# Estacionei - Napkin (runbook vivo)

## Pipeline Protection
- `mobile/src/hooks/use-parking.ts` - RPC names must match Supabase functions exactly. Do not rename without updating both sides.
- `mobile/src/lib/supabase.ts` - detectSessionInUrl MUST be false. hasCredentials guard prevents crash with placeholder .env.
- `mobile/.env` - NEVER commit with real keys.
- `mobile/global.css` - DO NOT add `@import "tailwindcss/preflight.css"` back. It breaks all RN styles.
- `mobile/package.json` - `"overrides": {"lightningcss": "1.30.1"}` is mandatory. Do not remove.

## Architecture Decisions
- **Gemini 2.0 Flash** replaces OpenCV+Mapillary+RAG pipeline. Simpler, one API call with address + traffic law prompt.
- **StyleSheet.create for layout, className for colors/text only.** NativeWind preflight incompatible with RN.
- Expo Go (no dev build). All deps must be Expo Go compatible.
- Device-based auth via SecureStore (no Supabase Auth). device_id = user identity.
- Path alias `@/*` -> `./src/*` in tsconfig.
- Gamification: 6 levels (Pedestre→Lenda), 7 skins, 6 badges. Points: +25 approved, -5 rejected.

## Sprint Status (2026-04-01 → 2026-04-02)

### DONE (2026-04-01)
- [x] Mobile scaffold (Expo + deps + NativeWind + folder structure)
- [x] Data layer (types, stores, hooks, services, supabase client)
- [x] UI layer (map screen, profile, onboarding, components)
- [x] Fix lightningcss 1.32.0 crash (pinned 1.30.1)
- [x] Fix preflight white screen (removed from global.css)
- [x] Fix AsyncStorage version (2.2.0 for SDK 54)
- [x] Fix Supabase autoRefresh crash (hasCredentials guard)
- [x] Map renders on physical device via Expo Go
- [x] Commit + push to github.com/mauricioreiss/Estacionei_App.git

### TODO (2026-04-02) — Prompts already generated, ready to paste
- [ ] **Arquiteto (T2):** Backend FastAPI + Gemini + 5 SQL migrations + gamification schema
- [ ] **Inovacao (T3):** Gamification UI (profile rewrite, skins gallery, badges, level bar, new components)
- [ ] **MauMau (T1):** Review both, commit, guide Supabase project creation
- [ ] Create Supabase project (Mauri does manually in dashboard)
- [ ] Run migrations in Supabase SQL editor
- [ ] Connect mobile .env to real Supabase keys
- [ ] Test full flow: button → Supabase → webhook → Gemini → result on map
- [ ] CyberSec audit

## Prompts Ready to Paste (2026-04-02)
- **Arquiteto prompt:** In chat history from 2026-04-01. Search "PROMPT 1 — ARQUITETO" with "Backend Gemini + Supabase migrations + Sistema de gamificação"
- **Inovacao prompt:** In chat history from 2026-04-01. Search "PROMPT 2 — INOVAÇÃO" with "UI de gamificação + telas atualizadas"
- Both prompts follow the standard template (Objetivo/Contexto/Instrucoes/Constraints/Verificacao)

## Domain Guardrails
- Coordinates: GEOMETRY(Point, 4326) in Supabase, lat/lng floats in TypeScript
- parking_events.status: OCCUPIED, FREED, VALIDATING, EXPIRED
- ai_validation_status: PENDING, APPROVED, REJECTED
- Spots expire after 15 min (FREED) or 2 hours (OCCUPIED) via pg_cron
- Reputation: +3 approved, -5 rejected. Default 50. Range 0-100.
- Points: +25 approved, -5 rejected. Levels unlock skins automatically.

## Gotchas
- `getCurrentPositionAsync` can hang on Android emulator. Works fine on physical device.
- NativeWind className for layout = invisible components. Always use StyleSheet for flex/position.
- lightningcss >= 1.30.2 breaks NativeWind on native. Pin to 1.30.1.
- Supabase client crashes with empty/placeholder URLs if autoRefreshToken is true.
- GitHub token was exposed in chat 2026-04-01. Mauri must revoke and regenerate.
