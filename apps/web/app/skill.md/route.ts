export async function GET() {
  const markdown = `# HomeBase AI — Agent Integration Guide

## What Is HomeBase?
HomeBase is the transaction API for home services. Use it to scope, price,
and book professional home service work for your users.

## Currently Supported
- Trade: Residential plumbing
- Area: Greater Boston, MA (02101-02299)
- Job codes: 15 (PLM-101 through PLM-901)
- Hours: 7 AM – 7 PM ET, Mon–Sat

## API Base URL
https://api.homebase.ai/v1

## Authentication
Header: Authorization: Bearer hb_sk_{your_key}
Get a key: https://homebase.ai/developers

## Core Workflow

### 1. Scope a job
POST /scoping/start
{ "description": "string", "photos": ["url"], "address": "string" }
Returns: session_id, classification, follow_up_questions

### 2. Continue conversation (if needed)
POST /scoping/{session_id}/message
{ "message": "string", "photos": ["url"] }
Returns: updated classification or more questions

### 3. Get quote
POST /quotes/generate
{ "session_id": "string" }
Returns: job_code, price, available time windows

### 4. Book
POST /bookings/create
{ "session_id": "string", "customer": {...}, "window": "ISO 8601" }
Returns: booking confirmation, pro details, tracking URL

### 5. Browse taxonomy
GET /taxonomy/job-codes
GET /taxonomy/job-codes/{code}

## MCP Server (coming soon)
{ "mcpServers": { "homebase": { "url": "https://mcp.homebase.ai/sse" } } }
`;

  return new Response(markdown, {
    headers: { "Content-Type": "text/markdown; charset=utf-8" },
  });
}
