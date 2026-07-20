# Backend Development Policy

## Architecture

- LazyTrip is one FastAPI modular monolith.
- Business code is organized by feature module.
- The first planned modules are `trips` and `itineraries`.
- Trip-specific preferences and constraints belong to `trips`.
- Locks, removals, feedback, and itinerary versions belong to `itineraries`.
- Do not create a separate FastAPI application for each module.
- Do not introduce a new module merely because a new endpoint or table exists.

## Module Structure

When a module genuinely requires them, it may contain:

```text
router.py
schemas.py
service.py
repository.py
models.py
```

Do not create these files before their responsibilities exist.

## Layer Rules

- Routers handle HTTP concerns.
- Schemas define external data contracts.
- Services contain business rules.
- Repositories handle persistence.
- Providers isolate third-party APIs.
- The Itineraries module owns itinerary-generation jobs and generated itinerary output.
- Itinerary providers must be accessed through a provider interface, not directly from routers.
- Provider output must be validated before a generation job is marked completed.
- Tests for generation use the fake provider; no real provider is active yet.
- Routes must not contain SQL, large prompts, or complete planning algorithms.
- Routes must not call external itinerary providers directly.
- Services must not expose raw provider responses to the frontend.
- Modules must not modify another module through its repository directly.

## Quality

- Use type annotations.
- Use Pydantic at API boundaries.
- Avoid `Any`.
- Keep functions focused.
- Do not suppress validation or lint errors without justification.
- Do not create a generic `utils.py` dumping ground.
- Add dependencies only when implementing the feature that requires them.
- Add or update tests with every endpoint.
- Keep README documentation accurate.

## Security

- Treat browser input as untrusted.
- Validate every request on the backend.
- Keep secrets out of source control.
- Never expose provider or database credentials to the frontend.
- Do not enable a real LLM provider without moderation, rate limits, quotas, and structured-output validation.
- Do not return stack traces or raw internal errors.
- Do not log tokens, secrets, or unnecessary personal information.

## Scope Discipline

- Implement one endpoint or service capability at a time.
- Run tests and checks before moving to the next capability.
- Do not add adjacent planned features without being explicitly asked.
- Prefer the simplest implementation that preserves the confirmed architecture.
