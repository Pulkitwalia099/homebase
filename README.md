# GoLocal website

Public agent-facing pilot site at https://getgolocal.com. The Next.js app lives in `apps/web`; use `npm run dev` and `npm run build` there. Vercel project: `homebase-agent-booking`, team `pulkitwalia099s-projects`, root `apps/web`.

## Public demo · October 13, 2026

- `/demo`: two scoping answers, optional sample or browser-local photo, three fictional plumbers with sample ratings, exact example diagnostic visit prices, sample times, offer approval and immediate simulated confirmation.
- `/connectors`: client selector, copyable public MCP URL, exact ChatGPT setup and first-use prompt. Official Zapier, Higgsfield, OpenAI and Claude references are linked. Claude and other clients have documented setup but have not been independently verified with this demo.
- `/pilot`: customer and supplier onboarding, early-customer/design-partner signup and supplier account/profile setup. First real-service pilot remains Salt Lake City plumbing.
- `/register?type=customer`: name, email, city/service, optional agent and design-partner preference. Every early customer gets $50 off their first real GoLocal booking once services are available in their area; one per person, no cash value. No redemption or payment happens in the demo.
- `/register?type=business`: supplier interest registration. The separate supplier account/profile portal handles account identity, profile review and test-request acceptance or decline.

### The public MCP

`https://getgolocal.com/demo/mcp` uses Streamable HTTP with **No authentication**. No signup, Google login, email link or API key is needed to simulate the journey. It exposes `connector_status`, `scope_request`, `search_providers`, `get_availability`, `prepare_booking`, `confirm_booking` and `get_booking_status`. The same tools serve the website playground.

The public relay is a fixed, credential-free connection to `/demo/mcp` and allowlisted `/demo/api/tools/…` routes on the existing local pilot. It forwards neither cookies nor authorization headers. The public backend receives no account/CRM store; offers and confirmations are signed fictional snapshots, and retrying an approved quote returns the same simulated confirmation. Initialization notifications preserve their empty 202 acknowledgements. No real service, supplier contact, charge, account history, image analysis or credit redemption is available.

**Availability:** the backend and tunnel still run from the founder's awake, internet-connected machine. No new persistent cloud backend was provisioned. If it is offline, requests fail visibly with 503; they never claim confirmation.

### Separate assisted pilot

`https://camryn-mechanomorphic-ellis.ngrok-free.dev/mcp` remains customer-bound OAuth with DCR and scope `golocal:assisted`. It requires the customer's own sign-in and consent. Google currently supports invited test accounts; email sign-in is the fallback. A test request stays pending until its supplier explicitly accepts. Publishing the public simulation did not change that behavior or the existing account data. Supplier decisions are in the portal, not public demo MCP tools.

## Signup storage and email

`POST /api/waitlist` validates customer, business, agent and channel-partner registrations. Only after private Vercel Blob persistence succeeds does it return success. Customer storage keys are HMACs of normalized email: changing city or feedback preference cannot issue another credit record. Credit amount/status are fixed server-side, not accepted from the browser. Original records remain immutable; verified corrections are handled by the team.

Private registration records are the durable email outbox. Resend sends a fixed-recipient alert to `pulkitwalia099@gmail.com`; a receipt and provider idempotency suppress duplicate alerts. No automatic customer verification email is needed for this interest signup. Signup is not a live booking account. The separate assisted account sign-in does verify identity.

Credentials live only in server environment/private local files; never commit, export or archive them. No ad trackers were added. Uploaded web-demo photos stay in the browser. Review `/privacy` for the dated public notice.

## Verification

All 60 connector and 24 website tests pass; Vercel production build/TypeScript pass. Desktop/mobile browser flow, saved customer credit signup, supplier registration, Gmail delivery, MCP initialization, full booking lifecycle and duplicate retry were verified. The ChatGPT no-auth public demo was connected and completed a separate simulated booking with independent status lookup. Production fulfillment, merchant availability, payments and representative demand are not validated.

### Founder-confirmed credit timing · October 13, 2026

The founder confirmed “Apply $50 to their first real booking.” Signup records reserve an unused entitlement, with `apply_on: first_real_booking`; the public wording promises $50 off the first real GoLocal booking. Existing reserved records retain the same first-booking entitlement. No credit is consumed at signup, local launch or during a simulated booking. Applying the discount to a real charge remains part of the real-service launch; current demo and assisted tools cannot redeem it.

## Homepage audience and mobile review · October 13, 2026

Desktop art, typography and motion retained. Customers and local businesses have the two primary paths, with a compact secondary area for personal AI agent companies and AI front-office/home-service software partners. Subtle sage and warm cream distinguish the sections. The network diagram is a numbered sequence, vertical on phones, with GoLocal linking personal agents to business software and local providers.

Mobile hero messages now follow the copy in normal document flow. Browser checks passed at 320, 390 and 768 pixels without horizontal overflow; agent logo links select the appropriate setup guide. ChatGPT is labelled pilot-tested; Claude has a setup guide without a verified-booking claim.

The booking preview uses one context label, concise visit/approval/confirmation copy, payment on-site and $0 due now, followed by the vendor verification-call note. Tool results still identify simulated state; no real call, service or payment is created. The $50 credit applies to the first real booking, not test bookings.

## Mobile onboarding verification · October 13, 2026

`/connectors?flow=pilot` now gives a prominent supplier-connected customer path, while `/connectors` retains the public instant preview. ChatGPT discovers OAuth endpoints, DCR and scope automatically; no user client credentials are needed. Customer signup points to the account-based guide. `/pilot` makes supplier account/profile signup the primary action.

New supplier email signup, profile review/activation, one mobile ChatGPT request, supplier acceptance, both emails and an independent agent confirmation passed. Nested Google sign-in during ChatGPT reconnection also passed, including a subsequent same-booking read. 320/390px browser layouts and copy controls passed; 60 connector and 24 website tests passed. Physical native phone apps and new public directory distribution are not verified. See `../resources/golocal-mobile-onboarding-e2e-2026-10-13.json`.

## Public Google signup · October 13, 2026

Google Auth Platform is External / In production. `/connectors?flow=pilot` and `/pilot` now tell customers and suppliers to use Google without an invitation. Email links are only needed for the email fallback. Fresh work-account signup → newly created ChatGPT MCP connector → empty history → first test request → separate supplier acceptance → independent confirmation passed at 390px. No existing customer connector was reused. The public Google identity client requests only basic identity scopes, and supplier listing still requires GoLocal review. [Verification](../resources/golocal-open-google-fresh-customer-2026-10-13.json).
