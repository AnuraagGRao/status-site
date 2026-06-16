# status-site

This site shows my current activity with a simple animated scene.

## Getting Started

- Dev server: `npm run dev`
- Lint: `npm run lint`
- Type check: `npm run type-check`
- Build (static export): `npm run build`

## CI/CD

- CI runs on pushes and PRs to `main` and verifies lint, type checks, and build (see [.github/workflows/ci.yml](.github/workflows/ci.yml)).
- Deploys to GitHub Pages from the `out/` export on push to `main` (see [.github/workflows/deploy.yml](.github/workflows/deploy.yml)).

When deploying via GitHub Actions, the workflow sets `NEXT_PUBLIC_BASE_PATH=/status-site` so assets resolve correctly at `/status-site`. Locally, leave it unset.
