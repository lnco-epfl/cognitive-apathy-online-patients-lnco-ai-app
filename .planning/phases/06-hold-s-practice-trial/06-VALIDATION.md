---
phase: 6
slug: hold-s-practice-trial
status: draft
nyquist_compliant: false
wave_0_complete: false
created: 2026-04-07
---

# Phase 6 — Validation Strategy

> Per-phase validation contract for feedback sampling during execution.

---

## Test Infrastructure

| Property | Value |
|----------|-------|
| **Framework** | vitest (existing in project) |
| **Config file** | vite.config.ts |
| **Quick run command** | `yarn test --run` |
| **Full suite command** | `yarn test --run && yarn check` |
| **Estimated runtime** | ~10 seconds |

---

## Sampling Rate

- **After every task commit:** Run `yarn test --run`
- **After every plan wave:** Run `yarn test --run && yarn check`
- **Before `/gsd:verify-work`:** Full suite must be green
- **Max feedback latency:** 30 seconds

---

## Per-Task Verification Map

| Task ID | Plan | Wave | Requirement | Test Type | Automated Command | File Exists | Status |
|---------|------|------|-------------|-----------|-------------------|-------------|--------|
| 6-01-01 | 01 | 1 | REQ-008 | manual | build + visual inspect | ❌ W0 | ⬜ pending |
| 6-01-02 | 01 | 1 | REQ-009 | manual | build + visual inspect | ❌ W0 | ⬜ pending |
| 6-01-03 | 01 | 2 | REQ-037 | grep | `grep -c "HOLD_S_" src/locales\ copy/fr/ns1.json` | ✅ | ⬜ pending |
| 6-01-04 | 01 | 2 | REQ-038 | grep | `grep -c "HOLD_S_" "src/locales copy/en/ns1.json"` | ✅ | ⬜ pending |

*Status: ⬜ pending · ✅ green · ❌ red · ⚠️ flaky*

---

## Wave 0 Requirements

- [ ] `src/modules/experiment/trials/hold-key-practice-trial.ts` — new plugin file (Wave 1 creates this)

*Existing infrastructure (TypeScript compiler + vitest) covers all automated checks.*

---

## Manual-Only Verifications

| Behavior | Requirement | Why Manual | Test Instructions |
|----------|-------------|------------|-------------------|
| Holding S for ~5s shows "Relâchez la touche" then "Très bien !" | REQ-008 | Requires real keydown timing in browser | Run dev server, reach Phase 6, hold S key for 5s |
| Early S release shows retry message and loops | REQ-008 | Requires real keyboard event sequence | Release S before 5s, verify retry message appears |
| Loop exits after 2 successes | REQ-009 | Requires 2 full hold cycles | Complete 2 successful holds, verify "Entraînement réussi" |
| Loop exits after 3 failures | REQ-009 | Requires 3 early releases | Release early 3 times, verify "Entraînement réussi" |

---

## Validation Sign-Off

- [ ] All tasks have `<automated>` verify or Wave 0 dependencies
- [ ] Sampling continuity: no 3 consecutive tasks without automated verify
- [ ] Wave 0 covers all MISSING references
- [ ] No watch-mode flags
- [ ] Feedback latency < 30s
- [ ] `nyquist_compliant: true` set in frontmatter

**Approval:** pending
