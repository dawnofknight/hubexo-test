# Fullstack System Design - Architecture, Deployment & Scalability

Complete guide for senior fullstack engineers on system architecture, deployment strategies, and scalability considerations for the Glenigan Construction Projects application.

---

## 📋 Table of Contents

1. [System Architecture Overview](#system-architecture-overview)
2. [Component Architecture](#component-architecture)
3. [Data Architecture](#data-architecture)
4. [Deployment Architecture](#deployment-architecture)
5. [Scalability Strategies](#scalability-strategies)
6. [Performance Optimization](#performance-optimization)
7. [Security Considerations](#security-considerations)
8. [Monitoring & Observability](#monitoring--observability)
9. [Disaster Recovery](#disaster-recovery)
10. [Cost Optimization](#cost-optimization)

---

## 🏗️ System Architecture Overview

### Current Architecture (Development)

```
┌─────────────────────────────────────────────────────────────┐
│ CLIENT LAYER (Browser)                                      │
│ - AngularJS 1.x Application                                 │
│ - HTML/CSS/JavaScript                                       │
│ - Karma test framework                                      │
└─────────────────────────────┬───────────────────────────────┘
                              │
                              │ HTTP/HTTPS
                              │
┌─────────────────────────────▼───────────────────────────────┐
│ WEB SERVER (Docker)                                         │
│ ├─ Nginx reverse proxy                                      │
│ ├─ Static file serving                                      │
│ └─ SSL/TLS termination                                      │
└─────────────────────────────┬───────────────────────────────┘
                              │
                              │ Internal network
                              │
┌─────────────────────────────▼───────────────────────────────┐
│ APPLICATION SERVER (Docker)                                 │
│ ├─ Express.js (Node.js)                                     │
│ ├─ TypeScript backend                                       │
│ ├─ REST API endpoints                                       │
│ └─ Business logic layer                                     │
└─────────────────────────────┬───────────────────────────────┘
                              │
                              │ Database connection
                              │
┌─────────────────────────────▼───────────────────────────────┐
│ DATA LAYER (SQLite)                                         │
│ ├─ Project management database                              │
│ ├─ Areas, Companies, Projects tables                        │
│ └─ Relationships and indexes                                │
└─────────────────────────────────────────────────────────────┘
```

### Architecture Principles

```
LAYERED ARCHITECTURE
├─ Presentation Layer: Frontend (HTML/CSS/JS)
├─ API Layer: Express controllers & routes
├─ Business Logic: Services & domain logic
├─ Data Access: Repositories & repositories
└─ Data Layer: Database

Benefits:
✓ Clear separation of concerns
✓ Easy to test each layer independently
✓ Can scale different layers differently
✓ Easy to replace components
✓ Supports team specialization
```

---

## 🎯 Component Architecture

### Microservices Consideration

```
Current: Monolithic
┌─────────────────────────────────┐
│ Single Express.js Application   │
├─────────────────────────────────┤
│ ├─ Projects API                 │
│ ├─ Areas API                    │
│ ├─ Companies API                │
│ ├─ Authentication (if added)    │
│ ├─ Reports (if added)           │
│ └─ Admin API (if added)         │
└─────────────────────────────────┘

Monolithic Benefits:
✓ Simple to deploy
✓ Easier debugging
✓ Better performance (no network hops)
✓ Easier transactions across entities

Monolithic Drawbacks:
✗ Hard to scale individual features
✗ One failure brings down everything
✗ Difficult to migrate to different tech stack
✗ Teams compete for same codebase

When to migrate to microservices:
├─ Scale individual features independently
├─ Different teams own different services
├─ Need polyglot tech stacks
├─ Deployment frequency requires it
└─ System becomes too complex for monolith
```

### Domain-Driven Design (DDD)

```
Bounded Contexts in this system:

1. PROJECT CONTEXT
   ├─ Entities: Project, ProjectArea
   ├─ Value Objects: ProjectValue, DateRange
   ├─ Repositories: ProjectRepository
   └─ Services: ProjectService

2. AREA CONTEXT
   ├─ Entities: Area
   ├─ Value Objects: AreaName
   ├─ Repositories: AreaRepository
   └─ Services: AreaService

3. COMPANY CONTEXT
   ├─ Entities: Company
   ├─ Value Objects: CompanyName
   ├─ Repositories: CompanyRepository
   └─ Services: CompanyService

Each bounded context:
✓ Has own database schema (ideally)
✓ Has own API endpoints
✓ Has own business rules
✓ Communicates via APIs (not shared database)
```

---

## 💾 Data Architecture

### Current Database Design (SQLite)

```
Schema Overview:

projects
├─ project_id (PK)
├─ project_name
├─ project_start
├─ project_end
├─ company_name (FK)
├─ description
├─ project_value
└─ (relationships via project_area_map)

project_area_map
├─ project_id (FK)
├─ area (FK)
└─ (junction table for many-to-many)

companies
├─ company_id (PK)
└─ company_name

areas
├─ area_id (PK)
└─ area_name
```

### Database Scalability Path

```
PHASE 1: SQLite (Current)
├─ Single file database
├─ Good for: Development, small projects
├─ Limitations: No concurrent writes, not networked
└─ Max capacity: ~1GB with good performance

PHASE 2: PostgreSQL (Recommended next)
├─ Open source relational database
├─ Good for: Production, medium scale
├─ Features: ACID, JSON support, full-text search
├─ Scaling: Read replicas for read-heavy workloads
└─ Max capacity: ~100s of GB, thousands of connections

PHASE 3: Database Sharding
├─ Partition data across multiple databases
├─ Good for: Very high scale
├─ Complexity: High (need consistent hashing)
└─ Use case: When single database reaches capacity

Migration Path from SQLite → PostgreSQL:

1. Set up PostgreSQL instance
2. Export SQLite data
3. Import to PostgreSQL
4. Test queries match
5. Switch connection string
6. Deploy to production
7. Monitor performance

Code changes minimal:
// Change connection
const db = new Database('sqlite://db.sqlite');
// To
const db = new Database('postgres://user:pass@host/db');

// SQL remains same (standard SQL)
```

### Caching Strategy

```
L1: Browser Cache
├─ GET /api/areas → Cache-Control: max-age=3600
├─ Reduces server load
└─ User sees instant response

L2: Application Memory Cache
├─ In-memory cache in Node.js
├─ Cache areas (rarely change)
├─ TTL: 1 hour
└─ All instances share cache via Redis

L3: Database Query Cache
├─ Index frequently queried columns
├─ Optimize queries
└─ Use prepared statements

L4: Redis Cache (Distributed)
├─ Shared cache across multiple instances
├─ Cache expensive computations
├─ Cache frequent queries
└─ Excellent for session storage

Cache Invalidation Strategy:
1. Time-based: Expiration (TTL)
2. Event-based: Clear on data changes
3. Manual: Admin clears cache
4. Dependency-based: Clear related caches

Example:
```typescript
// Cache areas for 1 hour
app.get('/api/areas', (req, res) => {
  const cacheKey = 'areas:all';
  const cached = cache.get(cacheKey);
  
  if (cached) {
    return res.json(cached);
  }
  
  const areas = db.query('SELECT * FROM areas');
  cache.set(cacheKey, areas, 3600);  // 1 hour TTL
  res.json(areas);
});

// Invalidate on create
app.post('/api/areas', (req, res) => {
  const area = db.insert('areas', req.body);
  cache.delete('areas:all');  // Clear cache
  res.json(area);
});
```

---

## 🚀 Deployment Architecture

### Docker Deployment (Current)

```
docker-compose.yml Structure:

services:
  frontend:
    ├─ Build: Dockerfile in frontend/
    ├─ Image: nginx with SPA
    ├─ Port: 80
    └─ Volume: Static files

  backend:
    ├─ Build: Dockerfile in backend/
    ├─ Image: Node.js with Express
    ├─ Port: 3000
    ├─ Environment: NODE_ENV, DATABASE_URL
    └─ Volume: Source code (development)

  database:
    ├─ SQLite in volume
    ├─ Persisted across restarts
    └─ Mounted to backend container

Network:
├─ All services on same network
├─ Service discovery via DNS
└─ Frontend talks to backend via service name
```

### Production Deployment Options

```
OPTION 1: Docker on Single Server
├─ docker-compose on EC2/Linode/DigitalOcean
├─ Cost: Low ($5-20/month)
├─ Scale: Manual scaling, restart needed
├─ HA: Single point of failure
└─ Use case: Small projects, MVP, demos

OPTION 2: Kubernetes (K8s) Cluster
├─ Container orchestration
├─ Cost: Medium ($50-200+/month)
├─ Scale: Auto-scaling
├─ HA: Built-in replication
└─ Use case: Production, multiple teams

OPTION 3: Serverless (AWS Lambda, Google Cloud Run)
├─ Functions as a Service
├─ Cost: Pay per invocation (low for read-heavy)
├─ Scale: Automatic
├─ HA: Built-in
└─ Use case: Stateless APIs, event-driven

OPTION 4: Managed Services
├─ AWS ECS/RDS, Google Cloud Run/Cloud SQL, Heroku
├─ Cost: Medium-High (ease of use trade-off)
├─ Scale: Built-in
├─ HA: Built-in
└─ Use case: Production when you want managed services
```

### CI/CD Pipeline

```
Development Code
        │
        ▼
Git Repository (GitHub)
        │
        ├─ Trigger: On push to main
        ▼
GitHub Actions (CI)
├─ Run tests
├─ Lint code
├─ Build Docker image
├─ Push to Docker registry
└─ On success: Deploy

Deploy to Staging
├─ Deploy latest image
├─ Run integration tests
├─ Monitor for errors
└─ On success: Ready to production

Deploy to Production
├─ Manual approval required
├─ Blue-green deployment (zero downtime)
├─ Health checks
├─ Rollback on failure
└─ Monitor metrics

Example GitHub Actions:

name: CI/CD

on:
  push:
    branches: [main]

jobs:
  test:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v2
      - run: npm install
      - run: npm test
      - run: npm run lint

  build-deploy:
    needs: test
    steps:
      - run: docker build -t myapp:${{ github.sha }} .
      - run: docker push myapp:${{ github.sha }}
      - run: deploy-to-production.sh
```

---

## 📈 Scalability Strategies

### Horizontal Scaling (Adding Instances)

```
Single Instance
┌──────────────────────┐
│ Express.js + SQLite  │
│ Can handle ~100 req/s│
└──────────────────────┘

Multiple Instances (Load Balanced)
┌──────────────────────┐
│ Load Balancer        │
│ (Nginx/HAProxy)      │
└──────┬───────┬───────┘
       │       │
   ┌───▼───┐ ┌─▼────┐
   │Express│ │Express│ ...more instances
   │ Inst 1│ │ Inst 2│
   └───┬───┘ └─┬────┘
       │       │
       └───┬───┘
           │
      ┌────▼────┐
      │PostgreSQL│ (shared database)
      │  + Cache │
      └─────────┘

Benefits:
✓ Handle more requests
✓ One instance down doesn't affect others
✓ Deploy new versions without downtime

Challenges:
✗ Session management (need shared store)
✗ Database becomes bottleneck
✗ Keep instances in sync

Solution:
├─ Use Redis for session storage
├─ Database connection pooling
├─ Stateless application design
└─ Load balancer stickiness (optional)
```

### Vertical Scaling (Bigger Machines)

```
Current: t2.micro (1GB RAM, 1 CPU)
├─ Good for: Development, low traffic
└─ Cost: ~$5/month

t2.small (2GB RAM, 1 CPU)
├─ Good for: Small production
└─ Cost: ~$15/month

t2.medium (4GB RAM, 2 CPU)
├─ Good for: Medium production
└─ Cost: ~$30/month

t2.large (8GB RAM, 2 CPU)
├─ Good for: Larger workloads
└─ Cost: ~$60/month

Vertical scaling has limits:
├─ Max machine size available
├─ Single point of failure
└─ Downtime during upgrade

Better: Combine with horizontal scaling
```

### Database Scaling

```
READ-HEAVY SYSTEM (this project)
├─ Most requests: GET /api/projects, /api/areas
├─ Solution: Read replicas
│  ├─ Primary database (writes)
│  ├─ Replica 1 (reads)
│  ├─ Replica 2 (reads)
│  └─ Replica N (reads)
├─ Load balancer distributes reads
└─ Writes go to primary only

WRITE-HEAVY SYSTEM (different use case)
├─ Solution: Sharding
│  ├─ Shard by project_id
│  ├─ Shard by company_id
│  └─ Shard by region
├─ Each shard is independent
└─ Queries must know shard key

CURRENT SYSTEM (SQLite)
├─ Single writer at a time
├─ Multiple readers
├─ No replication
└─ Migrate to PostgreSQL for scaling

Connection Pooling:
```typescript
// Without pooling: 1000 users = 1000 connections (CRASH!)
// With pooling: 1000 users = 10-20 connections

const pool = new Pool({
  max: 20,           // Max connections
  idleTimeoutMillis: 30000,
  connectionTimeoutMillis: 2000,
});

// Connections reused across requests
const connection = await pool.connect();
const result = await connection.query('SELECT ...');
await connection.release();
```

---

## ⚡ Performance Optimization

### Frontend Performance

```
METRICS TO TRACK
├─ Time to First Byte (TTFB): < 600ms
├─ First Contentful Paint (FCP): < 1.8s
├─ Largest Contentful Paint (LCP): < 2.5s
├─ Cumulative Layout Shift (CLS): < 0.1
└─ Time to Interactive (TTI): < 3.8s

OPTIMIZATION STRATEGIES

1. Bundle Size
├─ Minify JavaScript
├─ Remove unused code
├─ Lazy load routes
├─ Code split by feature
└─ Result: 500KB → 50KB

2. Network
├─ Enable gzip compression
├─ Cache static assets (Browser cache)
├─ Use CDN for static files
├─ HTTP/2 for multiplexing
└─ Result: Load time -50%

3. Rendering
├─ One-time binding {{:: value}}
├─ TrackBy in ng-repeat
├─ Minimize watchers
├─ Pagination (not infinite scroll)
└─ Result: Smooth 60 FPS

4. JavaScript Execution
├─ Defer non-critical JS
├─ Web Workers for heavy computation
├─ Optimize loops and algorithms
└─ Profile with DevTools

Example optimizations:
```typescript
// ❌ BAD: Re-renders on every change
ng-repeat="project in allProjects" 

// ✓ GOOD: Only renders visible items
ng-repeat="project in projects | paginate:pagination"

// ❌ BAD: Deep watch on large object
$scope.$watch('data', callback, true)

// ✓ GOOD: Watch specific property
$scope.$watch('data.filter', callback)

// ❌ BAD: Unbounded list
<li ng-repeat="item in items"> 

// ✓ GOOD: With trackBy (faster DOM updates)
<li ng-repeat="item in items track by item.id">
```

### Backend Performance

```
API RESPONSE TIME TARGETS
├─ P50 (median): < 100ms
├─ P95 (95th percentile): < 500ms
├─ P99 (99th percentile): < 1000ms
└─ Errors: < 0.1%

OPTIMIZATION

1. Database Queries
├─ Add indexes on frequently queried columns
│  CREATE INDEX idx_project_area ON projects(area);
├─ Use EXPLAIN to analyze queries
│  EXPLAIN SELECT * FROM projects WHERE area = 'north';
├─ Avoid N+1 queries (use joins)
├─ Pagination (LIMIT/OFFSET)
└─ Result: 500ms → 50ms

2. Application Code
├─ Cache expensive computations
├─ Avoid synchronous I/O
├─ Use async/await properly
├─ Batch operations
└─ Profile with Node.js profiler

3. Infrastructure
├─ Connection pooling
├─ Load balancing
├─ Keep-alive connections
├─ Compression (gzip)
└─ Result: Handle 10x more requests

Example:
```typescript
// ❌ BAD: N+1 problem
const projects = db.query('SELECT * FROM projects');
projects.forEach(p => {
  p.areas = db.query(`SELECT * FROM areas WHERE project_id = ${p.id}`);
});

// ✓ GOOD: Single query with JOIN
const projects = db.query(`
  SELECT p.*, a.* FROM projects p
  LEFT JOIN areas a ON p.id = a.project_id
`);
```
```

---

## 🔐 Security Considerations

### Security Layers

```
1. TRANSPORT SECURITY
├─ HTTPS/TLS for all connections
├─ Certificate: Let's Encrypt (free)
├─ HSTS header (enforce HTTPS)
└─ Code: app.use(helmet.hsts());

2. APPLICATION SECURITY
├─ Input validation
│  ├─ Validate all user input
│  ├─ Whitelist allowed values
│  └─ Sanitize strings
├─ SQL injection prevention
│  ├─ Use parameterized queries
│  └─ Never concatenate SQL
├─ Authentication
│  ├─ JWT or session-based
│  ├─ Passwords hashed (bcrypt)
│  └─ Multi-factor authentication (2FA)
└─ Authorization
   ├─ Role-based access control (RBAC)
   ├─ Check permissions on every request
   └─ Principle of least privilege

3. API SECURITY
├─ Rate limiting
│  ├─ Max 100 requests per minute per IP
│  └─ Prevent DDoS attacks
├─ CORS (Cross-Origin Resource Sharing)
│  ├─ Only allow trusted origins
│  └─ Prevent data theft
├─ API versioning
│  ├─ /api/v1/projects
│  └─ Backward compatibility
└─ API key management
   ├─ Rotate keys regularly
   └─ Monitor for abuse

4. DATA SECURITY
├─ Encryption at rest
│  ├─ Database encryption
│  └─ Backup encryption
├─ Encryption in transit
│  └─ HTTPS
├─ Data classification
│  ├─ Public, Internal, Confidential
│  └─ Apply appropriate security
└─ Data retention
   ├─ Delete old data
   └─ Comply with regulations

Example Security Code:
```typescript
// Rate limiting
const rateLimit = require('express-rate-limit');
const limiter = rateLimit({
  windowMs: 15 * 60 * 1000,  // 15 minutes
  max: 100                    // Max 100 requests
});
app.use('/api/', limiter);

// Input validation
app.post('/api/areas', (req, res) => {
  const { name } = req.body;
  
  // Validate
  if (!name || typeof name !== 'string') {
    return res.status(400).json({ error: 'Invalid input' });
  }
  
  // Sanitize
  const cleanName = name.trim().substring(0, 100);
  
  // Create with parameterized query
  const result = db.query(
    'INSERT INTO areas (name) VALUES (?)',
    [cleanName]
  );
});

// CORS
app.use(cors({
  origin: 'https://trusted-domain.com',
  credentials: true
}));
```
```

---

## 📊 Monitoring & Observability

### Key Metrics to Monitor

```
APPLICATION METRICS
├─ Request count (RPS)
├─ Response time (P50, P95, P99)
├─ Error rate
├─ Error types (4xx, 5xx)
└─ Endpoint popularity

INFRASTRUCTURE METRICS
├─ CPU usage
├─ Memory usage
├─ Disk usage
├─ Network I/O
└─ Database connections

BUSINESS METRICS
├─ Active users
├─ Projects created per day
├─ API usage by endpoint
└─ User retention

MONITORING SETUP

1. Application Monitoring (APM)
   └─ Tools: New Relic, Datadog, Dynatrace
      ├─ Trace requests through all layers
      ├─ Identify slow endpoints
      └─ Alert on anomalies

2. Log Aggregation
   └─ Tools: ELK (Elasticsearch, Logstash, Kibana)
      ├─ Centralize all logs
      ├─ Search and analyze
      └─ Alert on errors

3. Metrics Collection
   └─ Tools: Prometheus, Grafana
      ├─ Collect system metrics
      ├─ Visualize dashboards
      └─ Alert on thresholds

4. Alerts
   └─ Critical alerts:
      ├─ Error rate > 1%
      ├─ Response time > 1000ms
      ├─ Service down
      ├─ Database down
      └─ Low disk space
```

---

## 🆘 Disaster Recovery

### Backup Strategy

```
BACKUP FREQUENCY
├─ Daily: Full backup of database
├─ Hourly: Incremental backups
├─ Real-time: Point-in-time recovery

BACKUP STORAGE
├─ Local: On server (recovery time: minutes)
├─ Remote: AWS S3, Google Cloud Storage (recovery time: hours)
├─ Geographic redundancy: Backups in different regions

RECOVERY TIME OBJECTIVES (RTO)
├─ RTO: 1 hour (acceptable downtime)
├─ RPO: 15 minutes (acceptable data loss)

TEST BACKUPS
├─ Monthly: Full recovery test
├─ Verify data integrity
├─ Time the recovery process
├─ Update recovery documentation

Example Backup Script:
```bash
#!/bin/bash
# Daily backup to AWS S3

BACKUP_DATE=$(date +%Y%m%d_%H%M%S)
BACKUP_FILE="backup_${BACKUP_DATE}.sql"

# Dump database
pg_dump production_db > ${BACKUP_FILE}

# Compress
gzip ${BACKUP_FILE}

# Upload to S3
aws s3 cp ${BACKUP_FILE}.gz s3://backup-bucket/

# Keep local for 7 days
find . -name "backup_*.sql.gz" -mtime +7 -delete
```
```

### High Availability

```
SINGLE INSTANCE (Current)
┌─────────────────────┐
│ Application + DB    │
│ Single point failure│
└─────────────────────┘

HIGH AVAILABILITY
┌───────────────────────────────────┐
│ Load Balancer                     │
└───────────────┬───────────────────┘
        ┌───────┴────────┐
    ┌───▼──────┐    ┌────▼──┐
    │Instance 1│    │Instance2
    └───┬──────┘    └────┬──┘
        │                │
    ┌───▼────────────────▼──┐
    │  Primary DB    Replica │
    │  (Master)      (Slave) │
    └─────────────────────────┘

Benefits:
✓ One instance down: Traffic reroutes
✓ Database failure: Failover to replica
✓ Maintenance: Rolling restarts
✓ Zero downtime deployment

Failover Process:
1. Health check detects instance down
2. Load balancer removes from pool
3. Traffic reroutes to healthy instance
4. Alert sent to ops team
5. Instance restarted or replaced
```

---

## 💰 Cost Optimization

### Cost Analysis

```
MONTHLY COSTS (Single Server Setup)

Compute: $15-20/month
├─ t2.micro (1GB): $5-10
├─ t2.small (2GB): $15-20
└─ Scale to t2.medium: $30

Database:
├─ SQLite (file-based): Free
├─ PostgreSQL (RDS): $15-100/month
└─ With backups/replicas: $50-200+

Storage:
├─ Local SSD: Included
├─ S3 backups: $1/month (small)
└─ Snapshots: $5-10/month

Networking:
├─ Bandwidth: $1-5/month
└─ CDN (if added): $10-50/month

Monitoring:
├─ Basic: Free (CloudWatch)
├─ Professional: $30-100/month
└─ Premium APM: $100-500+/month

TOTAL: $30-50/month (development)
        $60-150/month (production)

COST REDUCTION STRATEGIES

1. Use Free Tier
   ├─ AWS free tier: 12 months
   ├─ GitHub Actions: Free
   └─ Let's Encrypt SSL: Free

2. Auto-scaling
   ├─ Scale up only when needed
   ├─ Scale down during off-hours
   └─ Save 30-50% on compute

3. Reserved Instances
   ├─ Commit 1-3 years
   ├─ 30-50% discount
   └─ Good for baseline load

4. Spot Instances
   ├─ Temporary compute (70% cheaper)
   ├─ Good for batch jobs
   └─ Can be interrupted

5. Database Optimization
   ├─ Efficient queries
   ├─ Proper indexing
   └─ Query caching

6. CDN for Static Files
   ├─ Reduce server bandwidth
   ├─ Faster delivery to users
   └─ CloudFront: $0.085/GB
```

---

## 🎯 Roadmap: From Development to Production

### Phase 1: MVP (Current State)
- ✅ Single server deployment
- ✅ SQLite database
- ✅ Basic monitoring
- ✅ Manual backups
- Target: Internal testing

### Phase 2: Beta (1-2 months)
- Switch to PostgreSQL
- Implement automated backups
- Add Redis caching
- Set up CI/CD pipeline
- Monitor performance
- Target: Limited external users

### Phase 3: Production (3-6 months)
- Horizontal scaling (2-3 instances)
- Load balancer
- Database read replicas
- CDN for static files
- Full monitoring & alerting
- Target: All users

### Phase 4: Enterprise (6-12 months)
- Kubernetes deployment
- Multi-region support
- Advanced security (2FA, SSO)
- Microservices (if needed)
- Advanced analytics
- Target: Mission-critical system

---

## 📚 Related Documentation

- [ARCHITECTURE_OVERVIEW.md](ARCHITECTURE_OVERVIEW.md) - Overall system design
- [CRUD_DATAFLOW.md](CRUD_DATAFLOW.md) - Data flow through system
- [FRONTEND_FUNDAMENTALS_INTERVIEW.md](FRONTEND_FUNDAMENTALS_INTERVIEW.md) - Frontend architecture
