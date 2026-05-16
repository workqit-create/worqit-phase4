## Job Board Integrations Design for Worqit MVP

This document outlines the technical design for integrating external job boards (Adzuna and Jooble) into the Worqit platform. These integrations will allow Worqit to provide a more comprehensive job feed for candidates by pulling in relevant listings from external sources.

### 1. Integration Overview

The integration will involve creating a backend service that periodically fetches job listings from Adzuna and Jooble APIs based on predefined search criteria (e.g., location, job category). These external jobs will then be normalized and displayed alongside native Worqit jobs in the candidate feed.

### 2. API Details

#### 2.1 Adzuna API
*   **Root URL:** `https://api.adzuna.com/v1/api/jobs/{country}/search/{page}`
*   **Authentication:** Requires `app_id` and `app_key`.
*   **Key Parameters:**
    *   `results_per_page`: Number of results to return.
    *   `what`: Search keywords.
    *   `where`: Location.
    *   `content-type`: Set to `application/json`.
*   **Response Format:** JSON object containing an array of job advertisements (`results`).

#### 2.2 Jooble API
*   **Root URL:** `https://jooble.org/api/{api_key}`
*   **Authentication:** Requires an `api_key`.
*   **Method:** POST
*   **Request Body (JSON):**
    ```json
    {
      "keywords": "software engineer",
      "location": "London"
    }
    ```
*   **Response Format:** JSON object containing an array of job listings (`jobs`).

### 3. Backend Implementation (Node.js/Express)

A new service, `externalJobService.js`, will be created to handle the API calls and data normalization.

#### 3.1 Data Normalization
External job data will be mapped to a common Worqit job schema:
*   `id`: Prefixed with source (e.g., `adzuna_123`, `jooble_456`).
*   `title`: Job title.
*   `company`: Company name.
*   `location`: Job location.
*   `description`: Brief description or snippet.
*   `url`: Original job listing URL.
*   `source`: Source name (Adzuna or Jooble).
*   `createdAt`: Timestamp of when the job was fetched.

#### 3.2 Fetching Logic
The backend will expose an endpoint, `/api/external-jobs`, which the frontend can call to retrieve a combined list of external jobs. This endpoint will:
1.  Fetch data from Adzuna and Jooble concurrently.
2.  Normalize the results from both sources.
3.  Combine and return the normalized job list.

### 4. Frontend Integration (React)

The `JobFeed.js` component will be updated to:
1.  Call the `/api/external-jobs` endpoint alongside the existing native job fetching logic.
2.  Merge native and external jobs into a single list.
3.  Display external jobs with a clear "Source: [Adzuna/Jooble]" badge and a link to the original listing.

### 5. Future Enhancements
*   **Caching:** Implement caching (e.g., using Redis or Firestore) to reduce API calls and improve performance.
*   **Advanced Filtering:** Allow users to filter the feed by source (Native vs. External).
*   **Background Sync:** Use a scheduled task (cron job) to periodically fetch and store external jobs in Firestore for even faster access.

### 6. Next Steps
1.  Register for Adzuna and Jooble API keys.
2.  Implement the `externalJobService.js` in the backend.
3.  Update the frontend `JobFeed.js` to display external jobs.
4.  Test the integration with various search criteria.
