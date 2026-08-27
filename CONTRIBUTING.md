# Contributing

Thank you for helping improve ReliaForge.

## Development workflow

1. Create a focused branch from the current default branch.
2. Install dependencies with `npm ci`.
3. Keep API calls in `src/api`, request state in hooks, and rendering in components or pages.
4. Define API responses with TypeScript interfaces that match backend field names.
5. Add loading, empty, error, and happy-path coverage for changed views.
6. Run every verification command listed in the README.
7. Open a concise pull request describing behavior, tests, and screenshots only when they contain public sample data.

## Interface rules

- Plugins are discovered from backend manifests; do not add a static business registry.
- Use the shared API client, Tailwind utilities, and UI primitives in `src/components/ui`.
- Do not use `any`, inline styles, raw credentials, private endpoints, or generated test artifacts.
- Render only backend-provided `available_actions`; never infer lifecycle controls from state.
- Use semantic design tokens instead of raw palette utilities in application components.

By contributing, you agree that your contribution is licensed under the MIT License.
