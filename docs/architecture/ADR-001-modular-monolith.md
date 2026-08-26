# ADR-001: Modular Monolith Architecture

## Status
Accepted

## Context
We need to choose between a distributed microservice architecture and a modular monolith for the learning platform.

## Decision
Use a **modular monolith** with FastAPI as the single backend application, organized into bounded-context modules that can be extracted into services later if scale requires it.

## Rationale
- **Simplicity**: Single deployment unit reduces operational complexity
- **Development speed**: No inter-service communication overhead
- **Transactions**: Cross-module transactions are trivial within a monolith
- **Refactoring**: Module boundaries are easier to adjust
- **Team size**: Appropriate for current team scale
- **Extractability**: Well-defined module interfaces allow future service extraction

## Consequences
- Must enforce strict module boundaries through directory structure and imports
- Must use dependency injection and interfaces at module boundaries
- Must not create circular dependencies between modules
- Database access must go through module repositories, not cross-module direct queries
