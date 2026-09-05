# Development Guidelines & Agent Instructions

This document defines the architectural standards, coding practices, and commit conventions for **Shortly**, a production-quality URL shortener service. Both human contributors and AI agents must follow these guidelines.

---

## 1. Project Philosophy & Scope

- **Simplicity and Reliability**: Write clear, readable, and maintainable JavaScript without unnecessary complexity.
- **Production-Ready Foundation**: Ensure high standards for error handling, graceful shutdowns, environment-driven configuration, and database connection safety.
- **Focused Dependencies**: Do not introduce additional npm dependencies without explicit justification and user approval.
- **Language**: Standard Node.js JavaScript (CommonJS `require` / `module.exports`), **not TypeScript**.

---

## 2. Architecture & Code Organization

All application code must reside inside `src/`. When implementing future features, adhere to the following directory layout:

```text
src/
├── config/             # Configuration modules (e.g., db.js, env config)
├── controllers/        # Request handlers (extract input, call services, send response)
├── models/             # Mongoose schemas and data models
├── routes/             # Express route definitions mapping HTTP paths to controllers
├── services/           # Business logic and database interaction orchestration
├── middlewares/        # Express middlewares (auth, validation, rate limiting, error handling)
├── utils/              # Utility and helper functions (e.g., base62 encoder, nanoid wrapper)
├── app.js              # Express application assembly and middleware binding
└── server.js           # Server lifecycle, network listener, and graceful shutdown
```

### Architectural Principles

1. **Separation of Concerns**:
   - **Controllers**: Handle HTTP-specific logic (status codes, request payload extraction, response formatting).
   - **Services**: Contain pure business logic (URL shortening algorithms, collision resolution, validation).
   - **Models**: Define data schemas, validations, and indexes.
2. **Error Handling**:
   - All asynchronous route handlers must properly forward errors to the centralized error handler (`next(error)` or async wrapper).
   - Never expose raw database errors or stack traces to clients in production responses.
3. **Database Practices**:
   - Define explicit indexes in Mongoose schemas (e.g., unique index on short codes).
   - Handle database disconnections and connection errors gracefully.
4. **Environment Configuration**:
   - Never hardcode configuration values (ports, database URIs, secret keys).
   - Read from `process.env` and provide safe defaults where appropriate.

---

## 3. Coding Standards

- **Module System**: CommonJS (`require` / `module.exports`).
- **Async Code**: Always use `async` / `await`. Avoid raw callback patterns or floating unhandled promises.
- **Naming Conventions**:
  - Files: `camelCase.js` or `kebab-case.js` (maintain existing project consistency).
  - Variables & Functions: `camelCase`.
  - Classes & Mongoose Models: `PascalCase`.
  - Constants & Environment Variables: `UPPER_SNAKE_CASE`.
- **Formatting**:
  - 2-space indentation.
  - Semicolons required.
  - Single quotes for strings (except JSON or template literals).

---

## 4. Conventional Commit Conventions

All commits must follow the [Conventional Commits v1.0.0](https://www.conventionalcommits.org/) specification:

### Format
```text
<type>[optional scope]: <description>

[optional body]

[optional footer(s)]
```

### Commit Types

| Type | Purpose | Example |
|---|---|---|
| `feat` | Introduces a new feature to the codebase | `feat(url): add custom alias support for shortened urls` |
| `fix` | Patches a bug | `fix(db): handle reconnection on connection drop` |
| `docs` | Documentation changes only | `docs(readme): update environment variable setup instructions` |
| `style` | Formatting, missing semicolons, whitespace (no code change) | `style: fix indentation in app.js` |
| `refactor` | Code restructuring without feature addition or bug fix | `refactor(server): extract database connection into config module` |
| `perf` | Code change that improves performance | `perf(models): add index to shortCode field` |
| `test` | Adding or updating tests | `test(health): add integration test for /health endpoint` |
| `build` | Changes affecting build tooling or dependencies | `build(deps): update mongoose to latest version` |
| `ci` | Changes to CI/CD workflows and configuration | `ci: add github actions test workflow` |
| `chore` | Routine tasks, maintenance, tooling updates | `chore: update .gitignore to exclude log files` |
| `revert` | Reverts a previous commit | `revert: revert commit 8f3d1b2` |

### Scopes (Suggested)
- `server`: HTTP listener, server setup, shutdown hooks.
- `app`: Express configuration, middleware setup.
- `db`: Database configuration, connection lifecycle.
- `url`: URL shortening, redirection, alias management.
- `analytics`: Visit tracking, analytics data.
- `config`: Environment and configuration handling.

### Commit Message Rules
1. **Imperative Mood**: Use "add", "fix", "change", not "added", "fixed", "changes".
2. **Case**: Lowercase description after the colon (`feat(server): add graceful shutdown`).
3. **Punctuation**: No trailing period in the subject line.
4. **Breaking Changes**: Indicate breaking changes by placing a `!` before the colon or adding a `BREAKING CHANGE:` footer.

---

## 5. Agent Instructions & Operational Rules

When working on this repository, AI agents must adhere to the following rules:

1. **Do NOT commit automatically**: Never run `git commit` unless explicitly instructed by the user.
2. **Verify Changes**:
   - Run syntax checks (`node -c <file>`) or test runs to ensure modifications are error-free.
   - Verify that all scripts (`npm run dev`, `npm start`) operate as intended.
3. **Respect Scope**:
   - Implement only what has been requested.
   - Do not add extra libraries or premature optimizations without user agreement.
4. **Security**:
   - Never commit sensitive files (`.env`, credentials, private keys).
   - Always verify that `.gitignore` prevents accidental secret commits.
