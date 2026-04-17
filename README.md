# DuX-IT-ECG-monitor

Vue ECG Monitor App with modular workflow for monitoring, patient lookup, session recording, and session review.

## Modules

- ECG monitor (realtime waveform + lead connection + live/preview mode)
- Alerts (threshold-based rule engine)
- Patient lookup (database search and add new patient)
- Session recorder (record, stop, save session to Firebase)
- ECG simulation input board (generated or CSV source)

## Project Scripts

- `pnpm install`
- `pnpm dev`
- `pnpm build`
- `pnpm preview`

## Environment Setup

1. Copy `.env.example` to `.env`.
2. Fill all `VITE_FIREBASE_*` values with your Firebase project settings.
3. Keep `.env` private (it is already ignored by `.gitignore`).

## Documentation

- Build guide (Vietnamese): `docs/ECG_BUILD_GUIDE.vi.md`
- Naming conventions (Vietnamese): `docs/NAMING_CONVENTIONS.vi.md`
- Firebase API update guide (Vietnamese): `docs/FIREBASE_API_UPDATE_GUIDE.vi.md`
- Git push beginner guide (Vietnamese): `docs/GIT_PUSH_BEGINNER_GUIDE.vi.md`
