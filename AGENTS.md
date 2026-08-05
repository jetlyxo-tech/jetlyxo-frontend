# AGENTS.md

## Cursor Cloud specific instructions

This is a **Vite-based static frontend** project ("JetlyXO Frontend").

### Services

| Service | Command | Port |
|---------|---------|------|
| Vite dev server | `npm run dev` | 5173 |

### Quick reference

- **Dev server:** `npm run dev` (serves `index.html` with HMR at `http://localhost:5173`)
- **Build:** `npm run build` (outputs to `dist/`)
- **Lint:** `npm run lint` (ESLint with flat config in `eslint.config.js`)
- **Preview production build:** `npm run preview`

### Notes

- The project uses ESM (`"type": "module"` in `package.json`) and ESLint flat config.
- No test framework is configured yet; add one (e.g., Vitest) when tests are needed.
