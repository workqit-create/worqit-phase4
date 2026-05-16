## Firestore Composite Indexes for Worqit MVP

This document outlines the necessary Firestore composite indexes to optimize query performance for key features within the Worqit MVP. These indexes are crucial for ensuring efficient data retrieval, especially as the application scales and the number of users and data points grows.

### Importance of Composite Indexes
Firestore queries that combine `where()` clauses with `orderBy()` clauses on different fields, or multiple `where()` clauses on different fields, often require a composite index. Without these indexes, Firestore cannot efficiently execute the query, leading to slower response times and increased costs. The Firebase console typically suggests missing indexes when such queries are executed, but proactively defining them is a best practice for performance and scalability.

### Defined Composite Indexes

Below is a table detailing the identified queries and their corresponding required composite indexes:

| Collection    | Query Description                                | Fields in `where()` clauses | Fields in `orderBy()` clauses | Required Composite Index (Field, Direction)                     |
| :------------ | :----------------------------------------------- | :-------------------------- | :---------------------------- | :-------------------------------------------------------------- |
| `jobs`        | Get all open jobs for candidate feed             | `status`                    | `createdAt`                   | `status` (asc), `createdAt` (desc)                              |
| `jobs`        | Get a hirer's own jobs                           | `hirerId`                   | `createdAt`                   | `hirerId` (asc), `createdAt` (desc)                             |
| `applications`| Check if candidate already applied to a job      | `jobId`, `candidateId`      | None                          | `jobId` (asc), `candidateId` (asc)                              |
| `applications`| Get a candidate's applications                   | `candidateId`               | `appliedAt`                   | `candidateId` (asc), `appliedAt` (desc)                         |
| `applications`| Get applicants for a specific job by a hirer     | `jobId`, `hirerId`          | `appliedAt`                   | `jobId` (asc), `hirerId` (asc), `appliedAt` (desc)              |
| `applications`| Check if candidate applied to any of hirer's jobs| `candidateId`, `hirerId`    | None                          | `candidateId` (asc), `hirerId` (asc)                            |

### How to Create These Indexes

These composite indexes can be created directly from the Firebase console under the "Firestore Database" section, then navigating to the "Indexes" tab. For each entry in the table above, you would:

1.  Click "Add Index".
2.  Select the `Collection ID` (e.g., `jobs`, `applications`).
3.  Add the fields specified in the "Required Composite Index" column, ensuring the correct order and direction (ascending/descending).
4.  Click "Create".

Alternatively, for larger projects and CI/CD pipelines, these indexes can be defined in a `firestore.indexes.json` file and deployed using the Firebase CLI:

```json
{
  "indexes": [
    {
      "collectionGroup": "jobs",
      "queryScope": "COLLECTION",
      "fields": [
        { "fieldPath": "status", "order": "asc" },
        { "fieldPath": "createdAt", "order": "desc" }
      ]
    },
    {
      "collectionGroup": "jobs",
      "queryScope": "COLLECTION",
      "fields": [
        { "fieldPath": "hirerId", "order": "asc" },
        { "fieldPath": "createdAt", "order": "desc" }
      ]
    },
    {
      "collectionGroup": "applications",
      "queryScope": "COLLECTION",
      "fields": [
        { "fieldPath": "jobId", "order": "asc" },
        { "fieldPath": "candidateId", "order": "asc" }
      ]
    },
    {
      "collectionGroup": "applications",
      "queryScope": "COLLECTION",
      "fields": [
        { "fieldPath": "candidateId", "order": "asc" },
        { "fieldPath": "appliedAt", "order": "desc" }
      ]
    },
    {
      "collectionGroup": "applications",
      "queryScope": "COLLECTION",
      "fields": [
        { "fieldPath": "jobId", "order": "asc" },
        { "fieldPath": "hirerId", "order": "asc" },
        { "fieldPath": "appliedAt", "order": "desc" }
      ]
    },
    {
      "collectionGroup": "applications",
      "queryScope": "COLLECTION",
      "fields": [
        { "fieldPath": "candidateId", "order": "asc" },
        { "fieldPath": "hirerId", "order": "asc" }
      ]
    }
  ]
}
```

Deploy with `firebase deploy --only firestore:indexes`.

### Next Steps

It is recommended to implement these indexes in your Firestore project to ensure optimal performance for the listed queries. As new complex queries are introduced, additional composite indexes may be required. Regularly monitoring Firestore usage and suggested indexes in the Firebase console is advised.
