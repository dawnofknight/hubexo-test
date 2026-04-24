# Entities - Domain Layer Data Models

## Detailed Annotation

---

## 📋 File Overview

**File**: `backend/src/domain/entities/project.entity.ts`
**Layer**: Domain (Business Logic)
**Pattern**: Entity pattern, Factory pattern
**Responsibility**: Define core business objects and transformations

---

## 🎯 Entity Purpose

| What | Why | Where |
|------|-----|-------|
| **Core Model** | Represent business concept | Project is a business entity |
| **Type Safety** | Use TypeScript types | Catch errors at compile time |
| **Contract** | Define data structure | Services expect this shape |
| **Factory** | Consistent creation | One place to handle transformation |

---

## 📊 Project Entity Interface

```typescript
export interface Project {
  // ├─ TypeScript interface (not class)
  // ├─ Defines shape of project data
  // ├─ No constructor or methods
  // └─ Just data structure with types
  
  projectId?: string;
  // ├─ Optional: ? means can be undefined
  // ├─ Why optional: null until saved to database
  // ├─ After saved: "proj-123"
  // └─ Service receives this, controller sends it
  
  projectName: string;
  // ├─ Required: must exist
  // ├─ Human-readable project name
  // └─ e.g., "Downtown Office Complex"
  
  projectStart: string;
  // ├─ Required: project start date
  // ├─ Format: ISO string (e.g., "2023-01-15")
  // └─ Chosen over Date object for JSON serialization
  
  projectEnd: string;
  // ├─ Required: project end date
  // ├─ Format: ISO string (e.g., "2024-12-31")
  // └─ Calculated project duration
  
  company: string;
  // ├─ Required: associated company name
  // └─ e.g., "Acme Corporation"
  
  description: string | null;
  // ├─ Optional: can be null or string
  // ├─ Why null option: projects might not have description
  // ├─ If null: frontend shows "No description available"
  // └─ e.g., "New office complex with modern design"
  
  projectValue: number;
  // ├─ Required: financial value/budget
  // ├─ Format: numeric (no currency symbol)
  // └─ e.g., 50000 (represents $50,000)
  
  area: string;
  // ├─ Required: geographic area
  // └─ e.g., "London", "City", "East End"
}
```

---

## 🏭 Factory Function: createProject

### Purpose
Transform database row (snake_case) to domain entity (camelCase)

```typescript
export function createProject(data: {
  project_id?: string;           // Database format (snake_case)
  project_name: string;
  project_start: string;
  project_end: string;
  company_name: string;          // Note: company_name (different field name!)
  description: string | null;
  project_value: number;
  area: string;
}): Project {
  // ├─ Input: raw database row (snake_case)
  // ├─ Output: domain entity (camelCase)
  // └─ Single place to handle this transformation
```

### Transformation Mapping

```typescript
  return {
    projectId: data.project_id,
    // ├─ Database: project_id → Entity: projectId
    // └─ snake_case → camelCase conversion
    
    projectName: data.project_name,
    // └─ project_name → projectName
    
    projectStart: data.project_start,
    // └─ project_start → projectStart
    
    projectEnd: data.project_end,
    // └─ project_end → projectEnd
    
    company: data.company_name,
    // ├─ Note: field name changes!
    // ├─ Database: company_name → Entity: company
    // └─ Makes sense in domain (field means "company name")
    
    description: data.description,
    // └─ No change (both sides same naming)
    
    projectValue: data.project_value,
    // └─ project_value → projectValue
    
    area: data.area
    // └─ No change (both sides same naming)
  };
}
```

---

## 🔄 Data Transformation Flow

```
Database Row (sql.js result)
  {
    project_id: "proj-123",
    project_name: "Downtown Office",
    project_start: "2023-01-01",
    project_end: "2024-12-31",
    company_name: "Acme Corp",
    description: "New office complex",
    project_value: 50000,
    area: "London"
  }
    ↓
    │ createProject(row)
    │
Domain Entity (JavaScript convention)
  {
    projectId: "proj-123",
    projectName: "Downtown Office",
    projectStart: "2023-01-01",
    projectEnd: "2024-12-31",
    company: "Acme Corp",
    description: "New office complex",
    projectValue: 50000,
    area: "London"
  }
    ↓
    │ toProjectDTO(entity) in service
    │
DTO (API Response format)
  {
    project_name: "Downtown Office",
    project_start: "2023-01-01",
    project_end: "2024-12-31",
    company: "Acme Corp",
    description: "New office complex",
    project_value: 50000,
    area: "London"
  }
```

---

## 📍 Area Entity

```typescript
export interface Area {
  area: string;
  // └─ Area name (e.g., "London")
  
  count: number;
  // └─ Number of projects in this area (e.g., 45)
}
```

**Usage**: List all areas and count of projects per area

---

## 📍 Company Entity

```typescript
export interface Company {
  companyId?: string;
  // └─ Optional: unique company identifier
  
  companyName: string;
  // └─ Required: company name
  
  description: string | null;
  // └─ Optional: company description
}
```

**Usage**: Represent companies in system

---

## 🎯 Key Concepts

### Interface vs Class

```
Interface (current):
  interface Project {
    projectName: string;
  }
  ✅ Simple
  ✅ No constructor overhead
  ✅ Good for data containers
  ✅ JSON serialization automatic

Class (alternative):
  class Project {
    projectName: string;
    constructor(name: string) {
      this.projectName = name;
    }
  }
  ❌ More complex
  ❌ Constructor overhead
  ✅ Can have methods
  ✅ Encapsulation
```

### Optional vs Required

```typescript
projectId?: string;        // Optional (can be undefined)
projectName: string;       // Required (must exist)
description: string | null;  // Can be null (different from undefined)

// Why different?
// - Optional: not provided yet
// - Null: provided but empty

// In practice for JSON:
// projectId undefined → not included in JSON
// description null → included in JSON as null
```

### Naming Conventions

```
Database:   snake_case (SQL convention)
  project_id, project_name, company_name

Entity:     camelCase (JavaScript convention)
  projectId, projectName, companyName

API:        snake_case (REST convention)
  project_id, project_name, company_name

Each layer has different naming for good reasons!
```

---

## 🔍 Factory Pattern Benefits

### Problem Without Factory
```typescript
// In repository:
const project = {
  projectId: row.project_id,
  projectName: row.project_name,
  // ... repeat for every row ...
}

// Issues:
// ❌ Duplicate transformation code
// ❌ Hard to maintain
// ❌ Easy to miss fields
// ❌ No centralized place to add validation
```

### Solution With Factory
```typescript
// In repository:
const project = createProject(row);

// Benefits:
// ✅ Single source of truth
// ✅ Easy to maintain
// ✅ No missing fields
// ✅ Can add validation here
```

---

## ✅ Checklist: Entity Implementation

- ✅ Interface defines data structure
- ✅ All properties have appropriate types
- ✅ Optional properties marked with ?
- ✅ Factory function transforms database rows
- ✅ Transformation handles naming conventions
- ✅ Field name mappings (company_name → company)
- ✅ Used consistently across services

---

## 💡 Interview Insights

**Question**: "Why use interfaces instead of classes?"

**Answer**: "Interfaces are simpler for data containers. They don't have constructor overhead or methods. For data that just gets transformed and passed around (like entities), interfaces are perfect. Classes are better when you need methods or encapsulation."

**Question**: "Why the factory function?"

**Answer**: "The factory function centralizes the transformation from database format (snake_case) to entity format (camelCase). This keeps repository code cleaner and makes it easy to add validation or transformations in one place instead of repeating it everywhere."

---

## 📊 Complete Example

### Raw Database Row (from sql.js)
```json
{
  "project_id": "proj-123",
  "project_name": "Downtown Office",
  "project_start": "2023-01-01",
  "project_end": "2024-12-31",
  "company_name": "Acme Corp",
  "description": "Modern office complex",
  "project_value": 50000,
  "area": "London"
}
```

### After createProject()
```typescript
{
  projectId: "proj-123",
  projectName: "Downtown Office",
  projectStart: "2023-01-01",
  projectEnd: "2024-12-31",
  company: "Acme Corp",
  description: "Modern office complex",
  projectValue: 50000,
  area: "London"
}
```

### After toProjectDTO() in Service
```json
{
  "project_name": "Downtown Office",
  "project_start": "2023-01-01",
  "project_end": "2024-12-31",
  "company": "Acme Corp",
  "description": "Modern office complex",
  "project_value": 50000,
  "area": "London"
}
```

### In HTTP Response
```json
{
  "success": true,
  "data": {
    "project_name": "Downtown Office",
    "project_start": "2023-01-01",
    "project_end": "2024-12-31",
    "company": "Acme Corp",
    "description": "Modern office complex",
    "project_value": 50000,
    "area": "London"
  }
}
```

---
