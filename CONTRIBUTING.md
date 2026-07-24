# Contributing to FlowAgent

Thanks for your interest in improving FlowAgent.

## Getting started

1. Fork the repository and clone your fork.
2. Install dependencies:
   ```bash
   pnpm install
   (cd backend && uv sync)
   (cd mcp && uv sync)
   ```
3. Copy the environment example and configure the required values:
   ```bash
   cp .env.example .env
   ```
4. Start the local database and services:
   ```bash
   pnpm db:up
   pnpm db:migrate
   pnpm dev
   ```

## Development guidelines

- Keep changes focused and easy to review.
- Prefer small, well-documented pull requests.
- Update the README when you add new user-facing features or setup steps.
- If you change runtime behavior, include a short explanation in the PR description.

## Branching and commits

- Create a branch for your change, for example: `feature/my-improvement`
- Use clear commit messages such as:
  - `feat: add X`
  - `fix: resolve Y`
  - `docs: improve Z`

## Pull request checklist

- The change works locally.
- The README or docs were updated if needed.
- The PR explains the intent and impact clearly.

We appreciate every contribution.
