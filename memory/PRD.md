# PSNV-B Doku – Product Requirements

## Overview
Mobile Expo app (German) for emergency responders to document PSNV-B (Psychosoziale Notfallversorgung – Betroffene) missions and export them as PDF for printing or sharing.

## Users
- Einsatzkräfte (emergency responders) in psychosocial emergency care teams (KIT, Malteser, DRK, ASB, etc.)
- No login required – app is used locally per device

## Core Features
1. **Einsätze List (Home tab)** — chronological list of documented missions, empty state with CTA
2. **Neuer Einsatz (Form tab)** — structured PSNV-B documentation form with sections:
   - Einsatzdaten (date, time, location, keyword, responder, organization, mission#, duration)
   - Betroffene (multiple affected persons: name, age, gender, role)
   - Zustand & Symptome (11 chip options + free text)
   - Maßnahmen (10 chip options + free text)
   - Verlauf (free text)
   - Übergabe (chip options + free text)
   - Eigene Notizen (free text)
3. **Einsatz Detail** — read-only view + Sticky bar with "Als PDF exportieren" (share) and "Drucken" actions
4. **Statistik tab** — total missions, this-month count, avg duration, affected total, top Stichworte and Symptome (bar chart rows)
5. **Einstellungen tab** — presets for responder name & organization (auto-filled in new missions)

## Storage
- All data stored locally via AsyncStorage (`@psnv:missions`, `@psnv:settings`)
- No backend, no network transfers of mission data

## Integrations
- `expo-print` — HTML → PDF generation
- `expo-sharing` — native share sheet for PDF export
- `expo-haptics` — feedback on save/export

## Design
- Follows `/app/design_guidelines.json`
- Palette: calm sage green (#4A6B53), warm off-whites (no blue/purple)
- Bottom tab navigation with 4 tabs (Feather icons)
- iOS-native clean, professional, low-cognitive-load

## Non-Goals
- No cloud sync, no user accounts, no analytics
- No push notifications
