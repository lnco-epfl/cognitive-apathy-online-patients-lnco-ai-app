# STRUCTURE
_Last updated: 2026-04-07_

## Summary
The app follows a standard Graasp/LNCO app structure with a React shell (main/, context/, settings/) wrapping a jsPsych experiment engine (modules/experiment/). Experiment logic is cleanly separated into parts (high-level phases), trials (individual jsPsych nodes), jspsych utilities, and general utils. Localization lives in two parallel trees: `src/langs/` (active) and `src/locales copy/` (work-in-progress rewrite).

## Root Layout
```
cognitive-apathy-online-patients-lnco-ai-app/
├── src/                        # All application source
├── public/                     # Static assets
├── .planning/                  # GSD planning artifacts
├── docs/                       # Documentation
├── package.json                # Dependencies + scripts
├── tsconfig.json               # TypeScript config
├── vite.config.ts              # Vite build config
├── .eslintrc.cjs               # ESLint config
└── index.html                  # HTML entry point
```

## src/ Directory
```
src/
├── @types/
│   └── i18next.d.ts            # i18next TypeScript augmentation
├── config/
│   ├── appData.ts              # App data key definitions
│   ├── env.ts                  # Environment variable access
│   ├── i18n.ts                 # i18next initialization
│   ├── messages.ts             # Toast/notification messages
│   ├── queryClient.tsx         # React Query client setup
│   ├── selectors.ts            # DOM selectors for Graasp integration
│   └── sentry.ts               # Error tracking config
├── langs/                      # Active translation files
│   ├── en.json                 # English strings (simple flat format)
│   └── fr.json                 # French strings (simple flat format)
├── locales copy/               # WIP namespaced translation rewrite
│   ├── en/
│   │   ├── ns1.json            # New namespaced EN translations
│   │   ├── ns1-old.json        # Backup of old format
│   │   └── ns1-rewritten.json  # Rewrite draft
│   └── fr/
│       ├── ns1.json            # New namespaced FR translations
│       └── ns1-old.json        # Backup of old format
├── mocks/
│   └── db.ts                   # MSW mock database for local dev
├── modules/
│   ├── Root.tsx                # App root with providers
│   ├── ErrorBoundary.tsx       # React error boundary
│   ├── answers/                # Results display (researcher view)
│   │   ├── ResultsRow.tsx
│   │   └── ResultsView.tsx
│   ├── common/                 # Shared UI components
│   │   ├── CustomToasts.tsx
│   │   └── Loader.tsx
│   ├── config/                 # App-level configuration types
│   │   ├── appResults.ts       # Result schema definitions
│   │   └── appSettings.ts      # Settings schema definitions
│   ├── context/                # React contexts
│   │   ├── ExperimentContext.tsx
│   │   └── SettingsContext.tsx
│   ├── experiment/             # Core experiment engine (see below)
│   ├── main/                   # Top-level view routing
│   │   ├── App.tsx             # View switcher (Player/Builder/Admin/Analytics)
│   │   ├── AdminView.tsx       # Admin/researcher interface
│   │   ├── AnalyticsView.tsx   # Analytics placeholder
│   │   ├── BuilderView.tsx     # Experimenter configuration UI
│   │   ├── ExperimentLoader.tsx # jsPsych mount point
│   │   ├── PlayerView.tsx      # Participant-facing wrapper
│   │   └── data/
│   │       └── test.json       # Test data fixture
│   └── settings/               # Experimenter settings panels
│       ├── SettingsView.tsx
│       ├── AgencyTaskSettings.tsx
│       ├── CalibrationSettingsView.tsx
│       ├── GeneralSettingsView.tsx
│       ├── KeySettingsView.tsx
│       ├── NextStepSettings.tsx
│       ├── PhotoDiodeSettingsView.tsx
│       └── PracticeSettingsView.tsx
├── env.d.ts                    # Vite env type declarations
├── index.css                   # Global styles
└── main.tsx                    # React entry point
```

## modules/experiment/ Directory (Core Engine)
```
experiment/
├── experiment.ts               # Top-level experiment builder (assembles all parts)
├── ado/                        # Adaptive Design Optimization math
│   ├── ado-selector.ts         # ADO trial selector
│   ├── adoMath.ts              # Core ADO computation
│   └── adoSimulation.ts        # ADO simulation utilities
├── jspsych/                    # jsPsych integration layer
│   ├── calibration-trial.ts    # Calibration trial definition
│   ├── experiment-state-class.ts # Mutable experiment state container
│   ├── finish.ts               # End-of-experiment handler
│   ├── i18n.ts                 # jsPsych i18n helpers
│   ├── instruction-helpers.ts  # Instruction modal builder helpers
│   ├── keyboard.ts             # Key event handling utilities
│   ├── message-trials.ts       # Text/instruction display trials
│   ├── speech.ts               # Web Speech API TTS integration
│   ├── stimulus.ts             # Visual stimulus rendering
│   ├── trials.ts               # Shared trial building utilities
│   └── validation-trial.ts     # Max-tap validation trial
├── parts/                      # High-level experiment phases
│   ├── introduction.ts         # Welcome + consent instructions
│   ├── calibration.ts          # Tapping calibration phase
│   ├── validation.ts           # Validates calibration result
│   ├── practice.ts             # Practice trials phase
│   ├── task-core.ts            # Main EBDM task phase
│   └── agency-task-core.ts     # Agency manipulation task phase
├── trials/                     # Individual jsPsych trial types
│   ├── tapping-task-trial.ts   # Core tapping trial
│   ├── agency-tapping-task-trial.ts # Agency variant tapping trial
│   ├── countdown-trial.ts      # Countdown before trial
│   ├── success-trial.ts        # Feedback after successful tap
│   ├── likert-trial.ts         # Likert scale questionnaire trial
│   ├── loading-bar-trial.ts    # Progress/loading animation
│   └── release-keys-trial.ts   # "Release keys" prompt trial
├── triggers/                   # Hardware trigger support
│   ├── trigger.ts              # Abstract trigger interface
│   └── serialport.ts           # Serial port trigger (lab use)
├── styles/
│   ├── main.scss               # Main experiment styles
│   └── pd-accessibility.css    # PD patient accessibility overrides
└── utils/
    ├── constants.ts            # Shared constants (timing, thresholds)
    ├── instruction-modal.ts    # Modal overlay for instructions
    ├── types.ts                # Shared TypeScript types
    └── utils.ts                # Miscellaneous utility functions
```

## Naming Conventions
- **Parts** (`parts/`): High-level phases returning `jsPsych.TimelineArray` — named after the phase they implement
- **Trials** (`trials/`): Atomic jsPsych timeline nodes — named `*-trial.ts`
- **jsPsych utilities** (`jspsych/`): Low-level helpers that create or wrap jsPsych constructs
- **React components**: PascalCase `.tsx` files
- **Non-component TS**: camelCase or kebab-case `.ts` files
- **Settings views**: `*SettingsView.tsx` or `*Settings.tsx`

## Key Architectural Boundaries
- `modules/main/` ↔ `modules/experiment/`: `ExperimentLoader.tsx` bridges React and jsPsych
- `modules/context/` → `modules/experiment/`: Settings passed as parameters, not imported directly
- `modules/settings/` → `modules/config/appSettings.ts`: Settings schema is the contract
- `src/langs/` ← `jspsych/i18n.ts`: jsPsych trials read translations via i18next
