# Contributing Guidelines

Thank you for your interest in contributing to Career OS! We welcome contributions of all kinds, including bug reports, feature requests, and code improvements. The guidelines below will help you get started and ensure a smooth collaboration process.

## Bug Reports

If you encounter a bug or unexpected behavior, please open an issue and include the following information:

- A clear and concise summary of the problem.
- Steps to reproduce the issue.
- Expected behavior vs. actual behavior.
- Screenshots or logs if applicable.
- Environment details (browser, operating system, versions).

## Feature Requests

We are excited to hear your ideas for improving Career OS! When submitting a feature request, please provide:

- A short summary of the desired feature.
- The motivation or problem the feature addresses.
- A proposed solution or user experience.
- Any alternatives or prior art you have considered.

## Development Setup

To set up a local development environment:

1. Fork and clone this repository.
2. Install dependencies using `npm install` or `yarn install`.
3. Start the development server with `npm run dev` or `yarn dev`. This will launch the Vite-based React application.
4. For any backend services (if present), navigate to the backend directory and follow the README instructions to install dependencies and start the server.
5. The app should now be running at `http://localhost:5173` (or whichever port Vite selects).

## Coding Standards

- Use TypeScript for all front-end code and follow the existing file structure and conventions.
- Adhere to linting and formatting rules enforced by ESLint and Prettier. Run `npm run lint` before pushing changes.
- Write modular, well-documented code with clear names and comments where necessary.
- Write unit and integration tests for any new functionality using the preferred testing framework (e.g., Vitest, React Testing Library).

## Commit Messages

We follow the Conventional Commits specification to make history easy to read and understand. Use the format:

```
type(scope): summary

body (optional)
```

Examples of `type` include `feat` (new feature), `fix` (bug fix), `docs` (documentation), `style` (formatting), `refactor` (code restructuring), `test` (adding tests), `ci` (CI/CD configuration).

## Pull Requests

When submitting a pull request:

- Ensure your branch is up to date with `main`.
- Provide a clear description of the changes and reference any related issues.
- Include tests for new functionality and ensure existing tests pass (`npm test`).
- Ensure the CI pipeline (linting, tests) passes before requesting a review.
- Follow the code review checklist and be responsive to feedback.

Thank you for contributing and helping us build a better Career OS!
