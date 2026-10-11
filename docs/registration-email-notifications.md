# GoLocal registration notifications

The business, agent-company and channel-partner registration forms use `/api/waitlist`. Each distinct valid submission is saved privately in Vercel Blob and emailed to `pulkitwalia099@gmail.com` from `GoLocal <notifications@getgolocal.com>`. The registrant's email is Reply-To. Website contact links also open the owner's personal email.

The email includes audience, name, email, company, website, category, service area, software, partnership text, consent and UTC submission time. User text is sent as plain text, and line breaks are removed from the subject. The recipient and sender are fixed on the server.

## Production setup

- Resend: existing account on the direct Free plan, not the paid Vercel Marketplace plans. Observed limits October 11, 2026: 100 emails/day, 3,000/month. Other applications on the same Resend account share these limits. No paid upgrade or overage option is enabled by this setup.
- Verified sender domain: `getgolocal.com`. DNS uses Resend's exact generated DKIM TXT plus `send` and `rsend` CNAME records. Website routing records are preserved; incoming email routing is not changed.
- Server-only production environment: `RESEND_API_KEY`, a sending-only key restricted to `getgolocal.com`; `CRON_SECRET`, a random secret protecting the retry endpoint; existing `BLOB_READ_WRITE_TOKEN` remains required. Never place these in browser code or the source bundle.
- `apps/web/vercel.json` schedules `/api/notifications/retry` daily at 09:00 UTC, compatible with Vercel Hobby scheduling. Cron requests must supply `Authorization: Bearer <CRON_SECRET>`.
- Gmail filter: `from:(notifications@getgolocal.com)` automatically stars and marks matching mail Important. SMTP priority headers are also included; the Gmail filter controls inbox labels.

## Delivery and retries

The immutable private `registrations/v2/` record doubles as an outbox. New details generate a new HMAC-derived record; repeated identical requests use the same record. Timestamp comes from the first saved request, making the provider payload stable across retries. Sent receipts live privately under `registration-email-receipts/`.

The request waits for an initial send attempt. If email fails, the registration still succeeds because the information was saved; the daily job retries missing receipts. Identical form retries also attempt outstanding email. Successful receipts suppress later sends. Resend's idempotency key additionally suppresses concurrent requests for 24 hours. If delivery succeeds but saving its receipt fails for longer than that window, a duplicate email is possible.

Daily retry scans stop after 45 seconds; this is intended for launch traffic. A large sustained backlog requires a paginated worker/queue and provider capacity planning. Provider acceptance is recorded as sent; it is not proof that every future message lands in Gmail. Review Resend delivery/bounce events and Vercel logs if alerts stop.

This change covers the public registration forms and contact links. The scripted booking demo does not collect or submit real booking inputs. Existing booking prototype routes are outside the registration email workflow. Earlier registrations are retained and are not automatically emailed retroactively.

## Validation

Run `node --experimental-strip-types --test tests/registration-notifications.test.mjs` from `apps/web`. Tests cover all audiences, fixed recipients, plain-text safety, stored details, duplicate suppression, provider failure, receipt-write failure, missing data, provider status handling and idempotency headers. Build the app and submit a clearly identified synthetic registration on the public site; verify the resulting Gmail message and Important/Starred labels.

Official references: [Resend send API](https://resend.com/docs/api-reference/emails/send-email), [idempotency keys](https://resend.com/docs/dashboard/emails/idempotency-keys), [Vercel cron limits](https://vercel.com/docs/cron-jobs/usage-and-pricing).
