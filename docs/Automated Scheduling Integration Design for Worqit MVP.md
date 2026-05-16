## Automated Scheduling Integration Design for Worqit MVP

This document outlines the technical design for integrating automated scheduling capabilities into the Worqit platform, focusing on **Calendly** and **Google Calendar**. The goal is to streamline the interview scheduling process for hirers and candidates, reducing manual effort and scheduling conflicts.

### 1. Integration Overview

The automated scheduling feature will allow hirers to connect their Calendly or Google Calendar accounts to Worqit. When a hirer wishes to schedule an interview with a candidate, they can initiate the process from within Worqit, which will then leverage the connected scheduling service to find available slots and send invitations.

### 2. Service Options

#### 2.1 Calendly Integration
*   **Mechanism:** Calendly offers a robust API for managing events, scheduling links, and webhooks. Hirers would connect their Calendly account, and Worqit would use the API to generate one-off or recurring scheduling links for interviews.
*   **Workflow:**
    1.  Hirer connects Calendly account to Worqit (OAuth).
    2.  Hirer selects a candidate for an interview.
    3.  Hirer initiates scheduling from Worqit, selecting a Calendly event type.
    4.  Worqit uses Calendly API to generate a unique scheduling link for the candidate.
    5.  Candidate receives the link (via Worqit messaging or email) and schedules the interview.
    6.  Calendly handles the booking, sends confirmations, and updates the hirer's calendar.
    7.  (Optional) Calendly webhooks can notify Worqit of scheduled events for internal tracking.
*   **Pros:** Dedicated scheduling platform, handles time zones, reminders, and rescheduling automatically.
*   **Cons:** May require a paid Calendly plan for advanced features or API access.

#### 2.2 Google Calendar Integration
*   **Mechanism:** Leverage Google OAuth and the Google Calendar API to directly manage events on the hirer's Google Calendar.
*   **Workflow:**
    1.  Hirer connects Google account to Worqit (OAuth with Calendar scope).
    2.  Hirer selects a candidate for an interview.
    3.  Hirer initiates scheduling from Worqit, proposing times.
    4.  Worqit uses Google Calendar API to check hirer's availability and create a draft event.
    5.  Candidate receives an invitation (via Worqit messaging or email) with proposed times.
    6.  Candidate accepts a time, and Worqit updates the event on the hirer's calendar and sends confirmation.
*   **Pros:** Free for most users, direct control over calendar events, widely used.
*   **Cons:** Requires more custom logic within Worqit for availability checking, conflict resolution, and notification management compared to Calendly.

### 3. Backend Implementation (Node.js/Express)

#### 3.1 OAuth Flow
*   Implement OAuth 2.0 for both Calendly and Google to securely connect hirer accounts.
*   Store access and refresh tokens securely in Firestore (e.g., in a `hirerIntegrations` collection).

#### 3.2 API Endpoints
*   `/api/integrations/calendly/connect`: Initiates Calendly OAuth.
*   `/api/integrations/google/connect`: Initiates Google Calendar OAuth.
*   `/api/schedule/interview`: Endpoint to initiate the scheduling process.
    *   Takes `hirerId`, `candidateId`, `jobId`, `preferredTimes` (for Google Calendar) or `calendlyEventType` (for Calendly).
    *   Calls the respective external API (Calendly or Google Calendar) to create the event or generate a link.
    *   Stores scheduling details in Firestore (e.g., `interviews` collection).
    *   Sends a notification/email to the candidate with the scheduling link/invitation.

### 4. Frontend Integration (React)

*   **Integration Settings Page:** A new page (`/hirer/settings/integrations`) where hirers can connect/disconnect their Calendly or Google accounts.
*   **Scheduling UI:** Integrate a scheduling button or flow within the application management section (e.g., on the `JobApplicants` page).
    *   If Calendly is connected, allow hirer to select an event type.
    *   If Google Calendar is connected, provide a UI for proposing interview slots.
*   **Candidate View:** Candidates will see a clear call-to-action to schedule their interview, linking to the Calendly page or an internal Worqit page for Google Calendar integration.

### 5. Data Storage (Firestore)

*   **`hirerIntegrations` Collection:** Stores OAuth tokens and integration settings for each hirer.
*   **`interviews` Collection:** Stores details of scheduled interviews, including `jobId`, `candidateId`, `hirerId`, `scheduledTime`, `platformUsed` (Calendly/Google), `externalEventId` (for updates/cancellations).

### 6. Next Steps

1.  Decide on the primary scheduling integration (Calendly or Google Calendar) based on ease of implementation vs. feature set.
2.  Implement the OAuth flow for the chosen service.
3.  Develop backend API endpoints for scheduling.
4.  Create frontend UI for hirer integration settings and scheduling initiation.
5.  Implement candidate notification for interview scheduling.
