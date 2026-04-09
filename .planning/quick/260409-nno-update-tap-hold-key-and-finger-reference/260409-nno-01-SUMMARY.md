---
phase: 260409-nno
plan: 01
subsystem: experiment-ui
tags: [styling, locales, accessibility, color-coding]
dependency_graph:
  requires: []
  provides: [tap-key-css-class, hold-key-css-class, tap-finger-css-class, hold-finger-css-class]
  affects: [locale-en, main-scss]
tech_stack:
  added: []
  patterns: [css-class-span-injection-in-i18n]
key_files:
  created: []
  modified:
    - src/modules/experiment/styles/main.scss
    - src/locales copy/en/ns1.json
decisions:
  - "FR locale has no TAP_KEY/HOLD_KEY/TAP_FINGER/HOLD_FINGER vars; all finger/key refs use different variable names (KEY_REPLACE, TAP_KEY_REPLACE) which are excluded from styling"
  - "Single-pass placeholder technique used to avoid double-wrapping when replacing <b>{{VAR}}</b> then bare {{VAR}}"
metrics:
  duration: ~10min
  completed: "2026-04-09"
  tasks_completed: 2
  files_modified: 2
---

# Phase 260409-nno Plan 01: Update Tap/Hold Key and Finger Reference Styling Summary

**One-liner:** Color-coded span classes for tap (red) and hold (blue) key/finger references injected into EN locale strings via CSS classes in main.scss.

## What Was Done

### Task 1: Add CSS classes to main.scss (commit: 5208168)

Added four CSS classes at the end of `src/modules/experiment/styles/main.scss`:

- `.tap-key`, `.tap-finger` — bold, red (`#e53e3e`), 1.2em
- `.hold-key`, `.hold-finger` — bold, blue (`#3182ce`), 1.2em

Font-size uses `em` (relative to parent) so it scales correctly with the existing `--font-scale` CSS variable system.

### Task 2: Wrap template variables with spans in locale files (commit: 1c9bd83)

**EN locale (`src/locales copy/en/ns1.json`):**
- 35 total occurrences of `{{TAP_KEY}}`, `{{HOLD_KEY}}`, `{{TAP_FINGER}}`, `{{HOLD_FINGER}}` wrapped in appropriate span classes
- Standalone `<b>{{VAR}}</b>` patterns replaced (9 cases) — outer `<b>` removed since span provides bold
- Variables inside mixed-content `<b>` tags (e.g., `<b>Tap {{TAP_KEY}}</b>`) — only the variable wrapped, outer `<b>` preserved
- JSON remains valid after all edits

**FR locale (`src/locales copy/fr/ns1.json`):**
- No target variables present — confirmed 0 occurrences of the four target vars
- FR file uses `{{KEY_REPLACE}}`, `{{TAP_KEY_REPLACE}}`, `{{HOLD_KEYS_REPLACE}}` which are explicitly excluded from styling

## Deviations from Plan

### FR file has no target vars

**Found during:** Task 2
**Issue:** The FR locale file contains no `{{TAP_KEY}}`, `{{HOLD_KEY}}`, `{{TAP_FINGER}}`, or `{{HOLD_FINGER}}` variables. All key/finger references use different placeholder names.
**Action:** Confirmed this is correct — FR file already differs in structure. No changes made to FR file.
**Impact:** None — plan success criteria met (zero bare vars in both files).

### Double-wrap bug caught and corrected

**Found during:** Task 2 (first attempt)
**Issue:** Sequential replacement (step 1 then step 2) caused double-nesting: `<span><span>{{VAR}}</span></span>` because step 2 found the `{{VAR}}` that was just placed inside step 1's span.
**Fix:** Used placeholder technique — replace `<b>{{VAR}}</b>` with a temporary string, then replace bare `{{VAR}}`, then replace placeholders with the span output.
**Files modified:** fix-locales.cjs (temp script, not committed)

## Known Stubs

None.

## Self-Check: PASSED

- `src/modules/experiment/styles/main.scss` — modified, contains `.tap-key`, `.hold-key`, `.tap-finger`, `.hold-finger` classes
- `src/locales copy/en/ns1.json` — modified, JSON valid, 35 vars span-wrapped
- `src/locales copy/fr/ns1.json` — unchanged (no target vars), JSON valid
- Commit 5208168 — exists (Task 1)
- Commit 1c9bd83 — exists (Task 2)
