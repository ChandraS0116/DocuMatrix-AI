# Multi-Region Deployment Strategy

To ensure zero-downtime survival of zone/region failures, the platform operates in a globally distributed active-passive mesh with strict consistency enforcement.

## Regions
- **ap-south-1** (Primary active region)
- **eu-west-1** (Backup region, active for EU localized data compliance)
- **us-east-1** (Enterprise Failover, cold standby unless global router initiates failover)

## Consistency Model & Data Strategy
- **PostgreSQL**: **STRICT SINGLE WRITER REGION**. Asynchronous read replicas only. Write operations never distribute.
- **Elasticsearch**: **Eventual Consistency**. Cross-Cluster Replication (CCR) operates with an acceptable lag tolerance of up to 60s.
- **Redis**: **FULLY ISOLATED PER REGION**. No cross-region replication is permitted. Local ephemerality strictly enforced.

## Global Routing Rules
The `GlobalRouter` strictly enforces the following behaviors:
1. **Permanent Pinning**: A tenant is permanently pinned to a primary home region at provisioning.
2. **Failover Immutability**: If a tenant is routed to a failover region (e.g. edge origin differs from home region or home region is down), that edge cluster operates in a **read-only mode**. Failover events do **NOT** migrate database write ownership.
