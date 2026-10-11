# GoLocal website

Public site for local service businesses, agent companies and channel partners at https://getgolocal.com.

## Development

The Next.js app lives in `apps/web`. Run `npm ci` there, then `npm run dev`. Build with `npm run build`.

Vercel project: `homebase-agent-booking`, team `pulkitwalia099s-projects`. Framework: Next.js. Root directory: `apps/web`. Source repository: `Pulkitwalia099/homebase`.

## Registration

`POST /api/waitlist` validates the three audience forms and saves JSON records to the private Vercel Blob store `golocal-registrations`. `BLOB_READ_WRITE_TOKEN` is server-only and supplied by the connected Vercel store. Success is returned only after storage succeeds or an identical email/audience registration already exists. The first registration is retained; subsequent requests do not overwrite it. No email is automatically sent.

Review registrations in Vercel → Storage → golocal-registrations, or use the authenticated Vercel Blob CLI in a linked checkout. Records are under `registrations/<audience>/`. Keep exported registrations private. Delete individual records when a verified contact requests deletion. Do not commit environment files or registration exports.

The site provides pilot registration, not customer accounts or live service booking. The legacy booking prototype remains in source but public booking pages redirect to the illustrative demo. Production MCP access and business software integrations require separate implementation and authorization.

## Brand and research

Forest `#193C32`, cream `#F5F2E9` and sage `#DDE4D6` come from the supplied pitch deck. The neighborhood art is reused from its cover. The GoLocal symbol was generated for this launch. Orange is reserved for key actions.

See `docs/connector-research-2026-10-10.md` for inspected official sources and the integration sequence. The website's `/connectors` page is the public setup guide.
