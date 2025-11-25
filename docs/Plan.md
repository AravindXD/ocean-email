## Email Productivity Agent - Complete Implementation Plan

**Tech Stack:** Next.js 15 (App Router) + TypeScript + Tailwind CSS + Google Gemini API + NextAuth.js + Vercel Deployment

***

## I. Authentication & User Management

### Google OAuth Integration

**Requirements:**
- Implement Google Sign-In using NextAuth.js for authentication
- Protect all application routes - redirect unauthenticated users to login page
- Store user session with JWT tokens for serverless compatibility
- Display user profile (name, email, avatar) in navigation header

**Logic:**
1. Configure NextAuth.js with Google OAuth provider
2. Create authentication API route that handles OAuth callback
3. Store session in HTTP-only cookies for security
4. Implement middleware to check authentication on protected routes
5. Create login page with "Sign in with Google" button
6. Add logout functionality that clears session and redirects to login

**Security Considerations:**
- Use environment variables for OAuth client ID/secret
- Implement CSRF protection (built into NextAuth)
- Set secure cookie options for production
- Validate session on every API request

***

## II. Multi-User Data Architecture

### User-Scoped Data Model

**Data Entities (per user):**
- Emails (inbox items with processing results)
- Prompts (customizable LLM instructions)
- Drafts (generated email replies)
- Processing history (audit log of operations)

**Logic:**
All data operations must be scoped to authenticated user's ID. Never allow cross-user data access.

### Modular Database Layer (Repository Pattern)

**Design Philosophy:**
Create an abstraction layer that allows swapping storage backends without changing business logic.

**Interface Definition:**
Define common operations (CRUD) that all storage implementations must support:
- `getUserEmails(userId)` → retrieves all emails for user
- `saveEmail(userId, email)` → stores new email
- `getUserPrompts(userId)` → retrieves user's custom prompts
- `updatePrompt(userId, promptId, content)` → updates prompt
- `saveDraft(userId, draft)` → stores draft
- `getDrafts(userId)` → retrieves all drafts

**Implementation Strategy:**

**Phase 1 - JSON File Storage (Development):**
- Store data in `/data/{userId}/` directory structure
- Create subdirectories: `emails/`, `prompts/`, `drafts/`
- Each entity stored as individual JSON file with unique ID
- Use filesystem operations with proper error handling
- Implement file-locking mechanism to prevent race conditions

**Phase 2 - External Database (Production-Ready):**
- Create separate implementation of same interface
- Recommended: Vercel KV (Redis) for quick queries or MongoDB for document storage
- Implement connection pooling and retry logic
- Add caching layer for frequently accessed data (prompts, user preferences)

**Migration Strategy:**
- Use environment variable `DATABASE_TYPE=json|redis|mongodb` to switch
- Factory pattern to instantiate correct repository implementation
- Export data function for migrating from JSON to external DB

**Directory Structure for JSON Storage:**
```
data/
├── users/
│   ├── user_12345/
│   │   ├── emails/
│   │   │   ├── email_001.json
│   │   │   └── email_002.json
│   │   ├── prompts/
│   │   │   ├── categorization.json
│   │   │   └── action_extraction.json
│   │   └── drafts/
│   │       └── draft_001.json
│   └── user_67890/
│       └── ...
└── shared/
    └── default-prompts.json (template for new users)
```

***

## III. Application Architecture

### Route Structure

**Public Routes:**
- `/` → Landing page with "Sign in with Google"
- `/api/auth/*` → NextAuth authentication endpoints

**Protected Routes (require authentication):**
- `/inbox` → Main email list view
- `/prompts` → Prompt configuration panel
- `/agent` → Email chat agent interface
- `/drafts` → Draft management view

**API Routes (all require authentication):**
- `/api/emails/load` → Initialize user's inbox with mock data
- `/api/emails/process` → Run ingestion pipeline
- `/api/prompts` → CRUD operations for prompts
- `/api/categorize` → LLM categorization endpoint
- `/api/extract-actions` → LLM action extraction
- `/api/agent/chat` → Email agent conversation
- `/api/agent/inbox` → Inbox-wide queries
- `/api/drafts` → Draft generation and management

### Authentication Middleware

**Logic:**
- Check for valid session on all `/api/*` and protected page routes
- Extract `userId` from session token
- Pass `userId` to all database operations for data scoping
- Return 401 Unauthorized for invalid/missing session
- Implement rate limiting per user to prevent API abuse

***

## IV. Phase 1 - Email Ingestion & Prompt Management

### Assignment Requirements [1]:
✅ Load mock inbox (10-20 emails)  
✅ Display sender, subject, timestamp, category tags  
✅ Create/edit/save prompt configurations  
✅ Store prompts in database  
✅ Ingestion pipeline with categorization and action extraction

### Mock Inbox Initialization

**Logic:**
1. On first login or manual trigger, load template inbox
2. Copy default email dataset to user's data directory
3. Mark emails as unprocessed (`isProcessed: false`)
4. Display in inbox view ordered by timestamp (newest first)

**Mock Data Requirements [1]:**
Create 15 diverse emails covering:
- 3 meeting requests (with calendar links, time proposals)
- 2 newsletters (with unsubscribe links, marketing content)
- 2 spam messages (suspicious senders, urgent language, poor grammar)
- 4 task requests (explicit deadlines, action items, urgency markers)
- 4 project updates (status reports, team communications)

Each email must include:
- Unique ID
- Sender email and display name
- Subject line
- Full body text (3-10 sentences)
- ISO timestamp
- Empty category (filled during processing)
- Empty action items array
- Processing status flag

### Prompt Storage & Management

**Default Prompt Templates:**
Create three core prompts that new users receive:

1. **Categorization Prompt**
   - Purpose: Sort emails into categories
   - Categories: Important, Newsletter, Spam, To-Do
   - Rules: Explicit criteria for each category
   - Output format: Single category name

2. **Action Item Extraction Prompt**
   - Purpose: Identify tasks and deadlines
   - Output format: Structured JSON array
   - Fields: task description, deadline, priority level
   - Handling: Return empty array if no tasks found

3. **Auto-Reply Draft Prompt**
   - Purpose: Generate contextual email responses
   - Tone: Professional but friendly
   - Length: 2-3 sentences
   - Adaptation: Different responses based on email type

**Prompt Editing Logic:**
- Display all prompts in editable text areas
- Show last updated timestamp
- Validate prompt is not empty before saving
- Store updated timestamp on modification
- Apply changes immediately to subsequent LLM operations
- Allow reset to default template

### Ingestion Pipeline

**Processing Flow:**
1. User triggers "Process Inbox" action
2. System retrieves all unprocessed emails for user
3. For each email sequentially:
   - Fetch user's categorization prompt
   - Send email content + prompt to Gemini API
   - Parse category from LLM response
   - Fetch user's action extraction prompt
   - Send email content + prompt to Gemini API
   - Parse JSON response for action items
   - Update email record with results
   - Mark as processed
   - Update UI with progress indicator
4. Display completion message with count

**Status Tracking:**
- Show progress bar (X of Y emails processed)
- Display current step ("Categorizing email from Sarah...")
- Collect and display any errors encountered
- Allow cancellation of in-progress operations
- Log all processing events for audit trail

**Error Handling:**
- Retry failed LLM calls up to 3 times with exponential backoff
- If retries fail, mark email with error state but continue processing
- Display error summary at completion
- Allow manual reprocessing of failed emails

***

## V. Phase 2 - Email Agent Chat Interface

### Assignment Requirements [1]:
✅ Select email and ask questions  
✅ Summarize emails  
✅ Extract tasks ("What tasks do I need to do?")  
✅ Draft replies based on tone  
✅ General inbox queries  
✅ Use stored prompts + email content + user query

### Chat Interface Design

**UI Components:**
- Left panel: Email selection list (scrollable, searchable)
- Right panel: Chat conversation area
- Bottom: Input field with quick action buttons
- Top: Selected email preview (collapsible)

**Email Selection Logic:**
- Display all processed emails in list format
- Show sender, subject, category badge
- Highlight currently selected email
- Update chat context when selection changes
- Clear conversation history on email change (with confirmation)

### Agent Query Processing

**Query Types & Routing:**

1. **Email Summarization**
   - Triggers: "summarize", "summary", "what's this about"
   - Logic: Send email content + summarization instruction to LLM
   - Output: 2-3 sentence summary focusing on key points

2. **Task Extraction**
   - Triggers: "tasks", "what do I need to do", "action items"
   - Logic: Use action extraction prompt + email content
   - Output: Bulleted list of tasks with deadlines

3. **Reply Generation**
   - Triggers: "draft reply", "respond to this", "write back"
   - Logic: Use auto-reply prompt + email context
   - Detect tone requests ("formal reply", "casual response")
   - Output: Draft email body, offer to save as draft

4. **General Questions**
   - Any other natural language query
   - Logic: Use email content as context + user question
   - Output: Conversational response based on email details

**Context Management:**
- Maintain conversation history (last 5 messages)
- Include history in LLM prompt for coherent follow-ups
- Store conversations per email (load on re-selection)
- Implement "Clear conversation" button

### Inbox-Wide Query Support

**Functionality:**
Allow queries across entire inbox without selecting specific email.

**Query Examples:**
- "Show me all urgent emails"
- "How many meeting requests do I have?"
- "List all tasks with deadlines this week"
- "Find emails from Sarah"

**Implementation Logic:**
1. Detect inbox-wide query (no specific email selected OR explicit keywords)
2. Build summary of all emails (id, sender, subject, category, timestamp)
3. Send summary + user query to LLM
4. Parse response and display results
5. For "show me" queries, filter and display matching emails
6. For "find" queries, highlight relevant emails in inbox list

***

## VI. Phase 3 - Draft Generation & Management

### Assignment Requirements [1]:
✅ Generate new email drafts  
✅ Draft replies using prompts  
✅ Edit drafts  
✅ Save drafts (never auto-send)  
✅ Include subject, body, optional follow-ups  
✅ JSON metadata for category/action items

### Draft Generation Logic

**Trigger Points:**
1. Agent chat: User asks to draft reply
2. Drafts page: User clicks "Generate Draft" for selected email
3. Inbox view: Quick action button on email card

**Generation Process:**
1. Retrieve user's auto-reply prompt
2. Gather email context:
   - Original sender, subject, body
   - Detected category
   - Any extracted action items
   - Conversation history (if from chat)
3. Detect tone/style requirements from user request
4. Call Gemini API with combined context
5. Generate subject line (automatically prefix "Re:" for replies)
6. Generate body (2-5 paragraphs, professional formatting)
7. Suggest follow-up timing based on email category
8. Create draft object and store

**Draft Object Structure:**
- Unique ID
- Associated email ID (if reply)
- Subject line
- Body content
- Creation timestamp
- Last modified timestamp
- Meta
  - Original sender
  - Original subject
  - Suggested follow-up date
  - Generation context (manual/chat/auto)

### Draft Editing Interface

**Features:**
- Rich text area for body editing
- Subject line editing
- Preview mode (read-only formatted view)
- Side-by-side: original email | draft reply
- Save button (stores to user's drafts)
- Discard with confirmation
- Version history (optional enhancement)

**Safety Mechanisms:**
- Prominent warning: "This is a DRAFT. Emails are never sent automatically."
- No "Send" button anywhere in application
- Explicit messaging about manual copy-paste for actual sending
- Unsaved changes warning on navigation

### Draft Management

**Drafts List View:**
- Display all saved drafts for user
- Show: subject, created date, associated email (if reply)
- Filter by: date, has associated email, search text
- Actions: Edit, Delete, Duplicate

**Organization:**
- Group drafts by associated email
- Separate new compositions from replies
- Mark stale drafts (created >7 days ago)
- Allow export as .txt or .eml file format

***

## VII. LLM Integration Layer

### Gemini API Service

**Core Responsibilities:**
- Abstract all LLM communication
- Handle authentication with API key
- Implement retry logic with exponential backoff
- Parse and validate responses
- Log all requests/responses for debugging

**Function Interfaces:**

1. **categorizeEmail(emailContent, promptTemplate)**
   - Input: Email text, user's categorization prompt
   - Output: Single category string
   - Validation: Must match allowed categories

2. **extractActions(emailContent, promptTemplate)**
   - Input: Email text, user's action prompt
   - Output: Structured JSON array
   - Validation: Parse and verify JSON structure

3. **generateReply(emailContext, promptTemplate, userInstructions)**
   - Input: Email details, auto-reply prompt, optional tone/style
   - Output: Draft email body
   - Validation: Reasonable length (50-500 words)

4. **chatQuery(emailContent, conversationHistory, userQuery)**
   - Input: Email context, previous messages, new question
   - Output: Conversational response
   - Streaming: Support real-time token streaming for better UX

**Error Handling:**
- Rate limiting: Respect Gemini API quotas (60 req/min free tier)
- Timeout: Set 30-second timeout per request
- Fallback responses: Generic safe responses on failure
- User notification: Display clear error messages
- Logging: Record all failures for monitoring

**Cost Optimization:**
- Cache responses for identical prompts + content combinations
- Implement request deduplication
- Use shorter prompts where possible
- Monitor token usage per user

***

## VIII. User Interface Components

### Navigation & Layout

**Top Navigation Bar:**
- Application logo/title (left)
- Main navigation links: Inbox | Agent | Drafts | Prompts
- User profile dropdown (right):
  - Display name and email
  - Settings option
  - Logout button

**Responsive Design:**
- Mobile: Hamburger menu, single-column layout
- Tablet: Side navigation, adjusted spacing
- Desktop: Full navigation, multi-column layouts

### Inbox View (Main Dashboard)

**Email List:**
- Card-based layout with hover effects
- Display per email:
  - Sender name (bold)
  - Subject line
  - Timestamp (relative: "2 hours ago")
  - Category badge (color-coded)
  - Preview of first line (truncated)
  - Action items count indicator
- Filters: By category, by sender, by date range
- Search: Real-time filtering by subject/sender
- Sorting: By date, by sender, by category

**Processing Controls:**
- "Load Mock Inbox" button (first-time users)
- "Process Inbox" button (run ingestion pipeline)
- Progress indicator during processing
- Refresh button for manual reload

**Email Detail Panel (on click):**
- Full email display with formatting
- Meta Sender, date, category
- Action items section (if any)
- Quick actions: 
  - "Chat about this" → Navigate to agent
  - "Generate draft" → Navigate to drafts
  - "Recategorize" → Rerun LLM categorization

### Prompts Configuration Panel

**Layout:**
- List of prompt templates (left sidebar)
- Active prompt editor (main area)
- Description/help text for each prompt type

**Editor Features:**
- Multi-line text area (syntax highlighting optional)
- Character count indicator
- Save button (with keyboard shortcut)
- Reset to default option
- Last modified timestamp
- Test prompt feature: Enter sample email, see LLM output

**Validation:**
- Prevent saving empty prompts
- Warn on very short prompts (<20 characters)
- Confirm destructive actions (reset to default)

### Agent Chat Interface

**Layout:**
- Email selector (left 30%)
- Chat conversation (right 70%)
- Input area (bottom of chat)

**Chat Features:**
- Message bubbles (user: right/blue, agent: left/gray)
- Timestamp per message
- Typing indicator during LLM response
- Quick action chips (when no conversation):
  - "Summarize this email"
  - "What tasks do I need to do?"
  - "Draft a professional reply"
  - "What is the deadline?"
- Copy message button (copy agent response)
- Clear conversation button

**Email Selector:**
- Searchable list
- Filter by category
- Visual indicator of selected email
- Quick preview on hover

### Drafts Management View

**Layout:**
- Drafts list (left 40%)
- Draft editor (right 60%)

**Drafts List:**
- Chronological order (newest first)
- Show: Subject, created date, status
- Filter: All | Replies | New Compositions
- Search by subject

**Draft Editor:**
- Subject line input
- Body text area (large, resizable)
- Original email reference (collapsible)
- Suggested follow-up note
- Actions:
  - Save Draft (green button)
  - Discard (red button, with confirmation)
  - Export as .txt

**Safety UI:**
- Yellow warning banner: "Drafts are NOT sent automatically"
- No "Send" or "Send Email" buttons anywhere
- "Copy to Clipboard" button for manual sending

***

## IX. Data Flow & State Management

### Client-Side State (Zustand/React Context)

**Global State:**
- Current user (session data)
- Emails array (inbox data)
- Prompts array (user's custom prompts)
- Drafts array
- Selected email (for agent/drafts)
- Processing status (loading states, errors)
- UI preferences (filters, sort order)

**State Actions:**
- `loadEmails()` → Fetch user's emails from API
- `loadPrompts()` → Fetch user's prompts
- `selectEmail(id)` → Set active email
- `updateEmail(id, changes)` → Update specific email
- `addDraft(draft)` → Add new draft to state
- `setProcessingStatus(status)` → Update loading indicators

### Server-Side Data Operations

**Authentication Check (all operations):**
1. Extract session from request
2. Validate session is active
3. Get `userId` from session
4. Pass `userId` to database layer

**API Route Pattern:**
```
Request → Auth Middleware → Extract userId → Database Operation (scoped to userId) → Response
```

**Caching Strategy:**
- Cache user's prompts in memory (rarely change)
- Invalidate cache on prompt update
- Cache LLM responses (same email + prompt = same result)
- Use stale-while-revalidate for email lists

***

## X. Database Abstraction Layer (Detailed)

### Repository Interface

**Define TypeScript interface that all storage implementations must satisfy:**

```
interface IEmailRepository {
  getUserEmails(userId: string): Promise<Email[]>
  getEmailById(userId: string, emailId: string): Promise<Email | null>
  saveEmail(userId: string, email: Email): Promise<void>
  updateEmail(userId: string, emailId: string, updates: Partial<Email>): Promise<void>
  deleteEmail(userId: string, emailId: string): Promise<void>
}

interface IPromptRepository {
  getUserPrompts(userId: string): Promise<Prompt[]>
  getPromptById(userId: string, promptId: string): Promise<Prompt | null>
  savePrompt(userId: string, prompt: Prompt): Promise<void>
  updatePrompt(userId: string, promptId: string, updates: Partial<Prompt>): Promise<void>
  deletePrompt(userId: string, promptId: string): Promise<void>
}

interface IDraftRepository {
  getUserDrafts(userId: string): Promise<Draft[]>
  saveDraft(userId: string, draft: Draft): Promise<void>
  updateDraft(userId: string, draftId: string, updates: Partial<Draft>): Promise<void>
  deleteDraft(userId: string, draftId: string): Promise<void>
}
```

### JSON Implementation

**File Operations:**
- Read: `fs.readFileSync()` with error handling for missing files
- Write: `fs.writeFileSync()` with atomic operations (write to temp, then rename)
- Directory creation: Automatically create user directory on first write
- Error recovery: Return empty arrays for missing files

**User Isolation:**
- All file paths include `userId`
- Validate `userId` format to prevent directory traversal attacks
- Never accept user-provided paths directly

**Concurrency Handling:**
- Implement simple file locking mechanism
- Use process-level locks (lock file creation)
- Queue concurrent writes to same file

### External Database Implementation (Future)

**MongoDB Example:**
- Collections: `emails`, `prompts`, `drafts`
- All documents include `userId` field
- Create compound indexes: `{userId: 1, createdAt: -1}`
- Use transactions for multi-document operations
- Connection pooling for performance

**Vercel KV (Redis) Example:**
- Key pattern: `user:{userId}:emails:{emailId}`
- Use hashes for complex objects
- Set TTL for cache entries
- Use sets for relationships (user's email IDs)

**Migration Logic:**
- Export function: Read all JSON files, write to external DB
- Import function: Read from external DB, write to JSON files
- Validation: Verify data integrity after migration

***

## XI. Security & Production Considerations

### Environment Configuration

**Required Environment Variables:**
- `NEXTAUTH_SECRET` → Random string for JWT signing
- `NEXTAUTH_URL` → Application base URL
- `GOOGLE_CLIENT_ID` → OAuth client ID
- `GOOGLE_CLIENT_SECRET` → OAuth secret
- `GEMINI_API_KEY` → Google AI API key
- `DATABASE_TYPE` → `json` or `external` (for future)

**Production Settings:**
- Set secure cookie flags (httpOnly, secure, sameSite)
- Enable HTTPS only
- Configure CORS appropriately
- Set rate limiting headers

### Input Validation

**User Input Sanitization:**
- Validate all form inputs (max length, allowed characters)
- Escape HTML in email content display
- Prevent XSS in chat messages
- Validate email addresses format
- Sanitize file paths for JSON storage

**API Request Validation:**
- Check required fields present
- Validate data types match expected
- Enforce size limits (prompt length, email count)
- Reject malformed JSON

### Rate Limiting

**Per-User Limits:**
- LLM operations: 30 per minute
- API requests: 100 per minute
- File operations: 50 per minute

**Implementation:**
- Store request counts in memory or Redis
- Reset counters every minute
- Return 429 Too Many Requests on limit exceeded
- Include retry-after header

### Error Logging & Monitoring

**Logging Strategy:**
- Log all authentication events
- Log all LLM API calls (request/response/errors)
- Log all database errors
- Log rate limit violations
- Do NOT log sensitive user data (email content)

**Monitoring:**
- Track API response times
- Monitor LLM API quota usage
- Track error rates by endpoint
- Alert on critical errors (auth failures, DB unavailable)

### Data Privacy

**User Data Handling:**
- Never share data across users
- Implement data export functionality (GDPR compliance)
- Implement account deletion (remove all user data)
- Don't send user data to external services except Gemini API
- Clear session data on logout

***

## XII. Deployment Architecture

### Vercel Deployment

**Build Configuration:**
- Node.js 18+ runtime
- Output: Serverless functions for API routes
- Static generation: For public pages (landing, login)
- Environment variables: Set in Vercel dashboard

**File Structure for Deployment:**
- `/data` directory for JSON storage (persistent across builds)
- Static assets in `/public`
- API routes compiled to serverless functions
- Client components bundled with code splitting

**Deployment Process:**
1. Push code to GitHub repository
2. Connect repository to Vercel project
3. Configure environment variables in Vercel dashboard
4. Set Google OAuth redirect URIs to Vercel domain
5. Deploy production build
6. Verify all environment variables loaded correctly
7. Test authentication flow end-to-end

### Post-Deployment Verification

**Checklist:**
- [ ] Google Sign-In works correctly
- [ ] User can access all protected routes
- [ ] Mock inbox loads for new users
- [ ] Email processing completes successfully
- [ ] Prompts can be edited and saved
- [ ] Agent chat responds correctly
- [ ] Drafts generate and save
- [ ] Logout clears session
- [ ] Multiple users don't see each other's data
- [ ] Mobile responsive design works
- [ ] API routes respond within 5 seconds

***

## XIII. Testing Strategy

### Unit Testing

**Components to Test:**
- Database repository functions (all CRUD operations)
- LLM service (mock API responses)
- Authentication helpers (session validation)
- Utility functions (date formatting, text parsing)

**Mocking Strategy:**
- Mock Gemini API responses for predictable testing
- Mock NextAuth session for authenticated tests
- Mock file system for JSON repository tests

### Integration Testing

**End-to-End Flows:**
1. User signs in → sees empty inbox → loads mock data
2. User processes inbox → emails categorized → action items extracted
3. User edits prompt → reprocesses emails → different results
4. User asks agent question → receives relevant answer
5. User generates draft → edits → saves

**Tools:**
- Playwright or Cypress for E2E testing
- Test against deployed preview environment
- Automated tests on pull requests

### Manual Testing Checklist

**Authentication:**
- Sign in with valid Google account
- Sign in attempt with invalid credentials
- Session persistence across page refreshes
- Logout clears session completely
- Protected routes redirect to login

**Data Isolation:**
- Create two test accounts
- Verify Account A cannot see Account B's data
- Verify emails, prompts, drafts all isolated

**Core Functionality:**
- All assignment requirements [1]
- Error states display correctly
- Loading states show appropriately
- Edge cases handled (empty inbox, no prompts, API errors)

***

## XIV. Documentation Requirements

### README.md

**Structure:**
1. **Project Overview**
   - Brief description
   - Key features list
   - Tech stack
   - Live demo URL

2. **Setup Instructions**
   - Prerequisites (Node.js version, accounts needed)
   - Clone repository command
   - Install dependencies
   - Environment variable configuration (with .env.example)
   - Database setup (if using external DB)
   - Run development server

3. **Google OAuth Setup**
   - Creating OAuth credentials in Google Cloud Console
   - Configuring authorized redirect URIs
   - Setting environment variables

4. **Usage Guide**
   - First-time user flow
   - Loading mock inbox
   - Configuring prompts
   - Using the email agent
   - Generating drafts

5. **Architecture Overview**
   - System diagram
   - Data flow explanation
   - Database structure
   - API routes documentation

6. **Deployment Guide**
   - Vercel deployment steps
   - Environment variables checklist
   - Post-deployment verification

7. **Development Guide**
   - Project structure explanation
   - Adding new features
   - Database migration strategy
   - Testing approach

### API Documentation

**Document Each Endpoint:**
- Method and path
- Authentication requirement
- Request parameters
- Request body schema
- Response schema
- Error codes and meanings
- Example curl commands

### Code Documentation

**Inline Comments:**
- Document complex logic
- Explain business rules
- Note security considerations
- Mark TODO items for future enhancements

**Function Documentation:**
- Use JSDoc or TypeScript doc comments
- Describe parameters and return values
- Note side effects
- Provide usage examples for complex functions

***

## XV. Assignment Requirements Coverage

### Functionality Requirements [1]

**Phase 1 - Email Ingestion:**
- ✅ Load emails (mock inbox)
- ✅ View list with sender, subject, timestamp, category tags
- ✅ Create and edit prompt configurations
- ✅ Store prompts in database
- ✅ Ingestion pipeline: categorization + action extraction

**Phase 2 - Email Agent:**
- ✅ Select email and ask questions
- ✅ Summarize emails
- ✅ Extract tasks
- ✅ Draft replies based on tone
- ✅ General inbox queries
- ✅ Agent uses stored prompts + email content

**Phase 3 - Draft Generation:**
- ✅ Generate new email drafts
- ✅ Draft replies using prompts
- ✅ Edit drafts
- ✅ Save drafts (never auto-send)
- ✅ Include subject, body, follow-up suggestions
- ✅ JSON metadata

### Evaluation Criteria [1]

**Functionality (30 points):**
- ✅ Inbox ingestion works
- ✅ Emails categorized using prompts
- ✅ LLM generates summaries, replies, suggestions
- ✅ Drafts safely stored, not sent

**Prompt-Driven Architecture (25 points):**
- ✅ Users can create, edit, save prompts
- ✅ Agent behavior changes based on prompts
- ✅ All LLM outputs use stored prompts

**Code Quality (20 points):**
- ✅ Clear UI/backend separation
- ✅ Modular services (repository pattern)
- ✅ State management (Zustand)
- ✅ LLM integration abstracted
- ✅ Readable, commented code
- ✅ TypeScript types throughout

**User Experience (15 points):**
- ✅ Clean prompt configuration panel
- ✅ Intuitive inbox viewer
- ✅ Smooth email agent chat interface
- ✅ Responsive design
- ✅ Loading states and feedback

**Safety & Robustness (10 points):**
- ✅ Handles LLM errors gracefully
- ✅ Defaults to draft (no auto-send)
- ✅ Retry logic for API failures
- ✅ Input validation
- ✅ Clear error messages

***

## XVI. Bonus Enhancements (Optional)

### Advanced Features

1. **Email Analytics Dashboard**
   - Category distribution chart
   - Task completion tracker
   - Response time metrics
   - Most frequent senders

2. **Advanced Prompt Features**
   - Prompt versioning (track changes)
   - A/B testing prompts (compare results)
   - Prompt templates marketplace
   - Import/export prompt sets

3. **Collaboration Features**
   - Share prompts with other users
   - Team inbox (shared access)
   - Comments on drafts
   - Assignment of tasks to team members

4. **Automation Rules**
   - Auto-categorize based on sender
   - Auto-draft for specific email types
   - Scheduled processing
   - Smart notifications

5. **Integration Capabilities**
   - Export to actual email client
   - Calendar integration for meetings
   - Task manager integration (Todoist, etc.)
   - Slack notifications for urgent emails

### Performance Optimizations

- Implement server-side pagination for large inboxes
- Add search indexing for fast email lookup
- Lazy load email content (fetch on demand)
- Implement virtual scrolling for long lists
- Cache LLM responses aggressively
- Use CDN for static assets

***

## Summary: Developer Deliverables

**Core Application:**
1. Multi-user authentication system with Google OAuth
2. User-scoped data storage with modular database layer (JSON with external DB migration path)
3. Complete email ingestion pipeline with LLM-powered categorization and action extraction
4. Interactive email agent supporting conversational queries
5. Draft generation and management system with safety controls
6. Customizable prompt configuration interface
7. Fully responsive web interface
8. Production deployment on Vercel

**Code Quality:**
- TypeScript throughout
- Modular architecture (repository pattern for data, service layer for LLM)
- Comprehensive error handling
- Input validation and security measures
- Clear code documentation

**Documentation:**
- Complete README with setup and usage instructions
- API documentation
- Architecture diagrams
- Deployment guide

This implementation plan provides a **production-ready, multi-user email productivity agent** that fully satisfies all assignment requirements while being architected for easy scalability and database migration [1].
