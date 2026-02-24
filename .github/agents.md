## Commit & PR Rules

- Use **conventional commit prefixes**: `feat:`, `fix:`, `refactor:`, `test:`, `docs:`, `chore:`.
- Keep commits **small and focused**. Avoid mixing unrelated changes.
- Every PR must include:
  - A short summary of the change.
  - Confirmation that **tests pass** and **build succeeds**.
  - Notes on breaking changes or migration steps (if any).

## Functions

- Each function should have a single responsibility.
- Keep functions short and focused.
- Always specify argument and return types in TypeScript.
- Use `async/await` for asynchronous code.
- Function names must clearly describe their purpose.

## Performance & Safety

- Avoid deep nesting by extracting helper functions.

Design and refine the User interface (UI) and User experience (UX) according to your brand and the user needs.
React Native has component libraries like React Native Elements for designing interface in consistent and aesthetically good way.
