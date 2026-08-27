# ReliaForge Frontend Agent Guide

Before changing code in this repository, read the applicable guidance under
`.trellis/spec/frontend/console/`. Start with its `index.md` and follow the pre-development
checklist for the area you are modifying.

Keep changes inside this repository's public React console boundary. Treat the backend API and the
project site as separately owned repositories, and update their links or contracts only when the
task explicitly includes them.

Run the focused checks while developing and the complete quality gate documented in the spec index
before handing work off. Never add credentials, private endpoints, proprietary sample data, or
generated browser/build artifacts.
