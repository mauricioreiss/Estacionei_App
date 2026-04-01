# Estacionei - Napkin (runbook vivo)

## Pipeline Protection
- `mobile/src/hooks/use-parking.ts` - RPC names must match Supabase functions exactly (park_here, leave_spot, get_zones_in_radius, get_active_event). Do not rename without updating both sides.
- `mobile/src/lib/supabase.ts` - detectSessionInUrl MUST be false for React Native. Do not change.
- `mobile/.env` - NEVER commit with real keys. Placeholders only in git.

## Architecture Decisions
- Expo Go (no dev build) - chosen for faster dev cycle. Limits: no custom native modules. All deps must be Expo Go compatible.
- NativeWind 5 preview (Tailwind 4) - className everywhere, zero StyleSheet.create. `nativewind-env.d.ts` required for types.
- Device-based auth via SecureStore (no Supabase Auth) - simpler for MVP. device_id is the user identity.
- Path alias `@/*` -> `./src/*` in tsconfig. All imports use @/ prefix.
- Zustand persist with AsyncStorage for parking state. SecureStore for device ID only.

## Sprint Status
- [x] Mobile scaffold (Expo + deps + NativeWind + folder structure)
- [x] Data layer (types, stores, hooks, services, supabase client)
- [x] UI layer (map screen, profile, onboarding, components)
- [ ] Create Supabase project + run migrations
- [ ] Test mobile on emulator with real Supabase
- [ ] Backend scaffold (FastAPI + Celery + Docker)
- [ ] AI pipeline implementation
- [ ] CyberSec audit

## Domain Guardrails
- Coordinates are always GEOMETRY(Point, 4326) in Supabase, but lat/lng floats in TypeScript
- parking_events.status enum: OCCUPIED, FREED, VALIDATING, EXPIRED
- ai_validation_status enum: PENDING, APPROVED, REJECTED
- Spots expire after 15 min (TIMERS.spotExpirationMinutes) via pg_cron
- Reputation: +3 approved, -5 rejected. Default 50. Range 0-100.

## Gotchas
- `getCurrentPositionAsync` can hang on Android emulator. use-location.ts needs try/catch (known gap).
- Onboarding redirect logic not wired in root layout yet. Screen exists but no conditional navigation.
- `action-button` absolute positioning may overlap tab bar on edge devices.
- `postcss.config.js` uses ESM syntax (export default) while metro.config.js uses CJS. Both work because PostCSS handles its own config loading.
