## Hirer Analytics Dashboard Design for Worqit MVP

This document outlines the design specifications for a new **Hirer Analytics Dashboard** within the Worqit platform. The goal of this dashboard is to provide hirers with valuable insights into their job postings, application performance, and overall recruitment efficiency, enabling data-driven decision-making.

### 1. Dashboard Overview

The Hirer Analytics Dashboard will be a dedicated section accessible to hirers, presenting key metrics and visualizations related to their recruitment activities. It will focus on providing actionable insights without overwhelming the user with excessive data.

### 2. Key Metrics and KPIs

The dashboard will display the following key performance indicators (KPIs):

*   **Total Job Postings:** Number of active and closed job postings.
*   **Total Applications Received:** Cumulative number of applications across all jobs.
*   **Average Applicants per Job:** Total applications divided by total job postings.
*   **Application Status Breakdown:** Percentage of applications in 'pending', 'reviewed', 'interviewed', 'offered', 'rejected' states.
*   **Time-to-Hire (Average):** Average duration from job posting to a candidate being marked as 'offered' (if such a status is tracked).
*   **Job View Count:** Total views for each job posting (requires tracking on job detail pages).
*   **Conversion Rate (View to Apply):** Percentage of job views that result in an application.

### 3. Dashboard Components and Visualizations

The dashboard will feature several interactive components and visualizations:

#### 3.1 Job Posting Performance
*   **Table:** A list of active job postings with columns for: Job Title, Status, Views, Applications, Average Match Score (if available), and Days Active.
*   **Chart:** A bar chart showing 'Applications Received per Job' for the top 5-10 active jobs.

#### 3.2 Application Funnel
*   **Chart:** A funnel chart or stacked bar chart illustrating the progression of applications through different stages (e.g., Applied -> Reviewed -> Interviewed -> Offered).

#### 3.3 Time-Based Trends
*   **Chart:** A line chart showing 'Applications Received Over Time' (e.g., last 30, 60, 90 days), allowing hirers to identify peak application periods.

#### 3.4 Candidate Source (Future Enhancement)
*   **Chart:** A pie chart showing the breakdown of application sources (e.g., Worqit native, Adzuna, Jooble) once external job integrations are fully implemented and tracked.

### 4. Data Sources

All data for the dashboard will be sourced from Firestore collections:
*   `jobs`: For job posting details, status, and creation dates.
*   `applications`: For application counts, statuses, and applied dates.
*   `users`: For candidate and hirer information (indirectly).
*   **New Data Points:** `jobViews` collection or a counter within the `jobs` document will be needed to track job views.

### 5. Technical Implementation Considerations

*   **Frontend:** React components will be developed to render the dashboard. Charting libraries like Chart.js or Recharts can be used for data visualization.
*   **Backend:** New API endpoints (e.g., `/api/hirer/analytics`) will be required to aggregate and serve the necessary data to the frontend. These endpoints will perform complex Firestore queries and data processing.
*   **Firestore Indexes:** Ensure appropriate composite indexes are in place for efficient querying of aggregated data (e.g., `applications` collection queried by `hirerId` and `appliedAt` for time-based trends).
*   **Real-time Updates:** Consider using Firestore real-time listeners for certain metrics (e.g., total applications) to provide up-to-date information without frequent API calls.

### 6. UI/UX Considerations

*   **Filters:** Provide date range filters (e.g., 'Last 30 days', 'Last 90 days', 'Custom Range') and job status filters ('Active', 'Closed').
*   **Export:** Option to export dashboard data to CSV or PDF.
*   **Drill-down:** Ability to click on a job in the table to navigate to its detailed performance report.

### 7. Next Steps

1.  Implement job view tracking mechanism.
2.  Develop backend API endpoints for analytics data aggregation.
3.  Create frontend React components for the dashboard and integrate charting libraries.
4.  Ensure all necessary Firestore composite indexes are defined and deployed.
