# ADR-003: AI Provider Abstraction

## Status
Accepted

## Context
The platform uses LLMs for tutoring, onboarding, content tagging, and explanations. We must not hard-code to a single provider.

## Decision
Create an **AI provider abstraction layer** supporting OpenAI, Anthropic, Google, and local models with per-task model routing.

## Rationale
- **Vendor independence**: Switch providers without application changes
- **Cost optimization**: Use cheaper models for simple tasks (tagging, summarization)
- **Reliability**: Fallback to alternative providers on failure
- **Compliance**: Some tenants may require specific providers or on-premise models
- **Task optimization**: Different models excel at different tasks

## Design
```
AIProvider (interface)
├── OpenAIProvider
├── AnthropicProvider
├── GoogleProvider
└── LocalProvider (Ollama)

ModelRouter
├── Task → Model mapping (configurable)
├── Fallback chain
├── Token budget enforcement
└── Cost tracking

Guardrails
├── Input validation
├── Output schema enforcement
├── PII filtering
├── Prompt injection detection
└── Tenant isolation
```

## Consequences
- All AI calls go through the abstraction layer
- Model configuration is stored in database, not hard-coded
- Token usage and cost are tracked per tenant
- PII is minimized before sending to external providers
