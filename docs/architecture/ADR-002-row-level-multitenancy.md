# ADR-002: Row-Level Multi-Tenancy

## Status
Accepted

## Context
The platform must support multiple tenants (schools, bootcamps, universities, corporate teams) with data isolation.

## Decision
Use **row-level multi-tenancy** with a `tenant_id` column on all tenant-owned tables.

## Rationale
- **Simplicity**: Single database schema, single connection pool
- **Cost**: No per-tenant database provisioning overhead
- **Queries**: Tenant filtering is enforced at the repository/data-access layer
- **Migrations**: Single migration path for all tenants
- **Scale path**: Can migrate to schema-per-tenant or database-per-tenant later if needed

## Consequences
- Every tenant-owned table must include `tenant_id` with a NOT NULL constraint
- Every query must include tenant filtering (enforced by base repository class)
- Indexes must include `tenant_id` as a prefix for efficient filtering
- Background jobs must carry tenant context
- API responses must never leak cross-tenant data
