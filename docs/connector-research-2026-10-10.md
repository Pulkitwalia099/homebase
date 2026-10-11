# GoLocal connector research — October 10, 2026

Scope: research for the public website, not implementation of a production booking network. The shipped registration site does not expose a production MCP endpoint or merchant booking integration.

## Conclusions

There are two independent authorization boundaries: the agent/user authorizes tools in GoLocal, and each business authorizes GoLocal's access to its software. A general vendor integration does not establish permission for every merchant.

MCP standardizes tool discovery and invocation; it does not supply merchant inventory, standardize every vendor's booking semantics, or establish a distribution agreement. Agent connection setup, directory publication and a completed booking are separate milestones.

OpenAI's current developer connection page resolves to its plugin workflow: add a custom MCP server in ChatGPT Plugins, configure the endpoint and authentication, review discovered tools, create/install the plugin, then test in a new conversation. An older Help Center article still describes developer mode and Apps settings. The website cites the current developer page and qualifies account/workspace differences rather than claiming universal one-click installation.

Claude's remote connector requests originate from Anthropic infrastructure, even when initiated in the desktop client. Account/organization connector permissions apply. Local stdio configuration is a different mechanism.

Jobber is one documented integration candidate. Its company administrator authorizes scoped account access using OAuth. It documents token refresh and disconnect webhooks. Public marketplace publication has a separate review process; no GoLocal approval or working integration has been verified.

## Proposed engineering sequence

1. Agree on one agent partner, service, city and explicit merchant permissions.
2. Map vendor API data to service coverage, visit/repair pricing, availability, quote requirements and booking states. Validate whether each requested operation is supported under current vendor terms.
3. Implement the business OAuth integration with state/PKCE where supported, encrypted tokens, refresh, tenant isolation and disconnect handling.
4. Implement a remote MCP endpoint with tool schemas, least-privilege scopes and the authorization discovery required by the target clients. Keep read operations distinct from writes.
5. Require explicit approval for the exact provider, appointment and charge. Implement durable idempotency, authoritative confirmation, timeout reconciliation, availability recheck and auditable state transitions.
6. Test against permitted sandbox accounts; then use an agreed controlled pilot. Do not treat a successful API response as fulfilled service evidence.
7. Publish installation instructions only for a tested endpoint and client combination. Treat directory submission as separate work.

## Primary sources inspected

- OpenAI connection/testing: https://developers.openai.com/apps-sdk/deploy/connect-chatgpt/
- OpenAI remote MCP API: https://developers.openai.com/api/docs/guides/tools-connectors-mcp
- Claude remote custom connectors: https://support.claude.com/en/articles/11175166-get-started-with-custom-connectors-using-remote-mcp
- MCP authorization (2025-11-25): https://modelcontextprotocol.io/specification/2025-11-25/basic/authorization
- Jobber OAuth: https://developer.getjobber.com/docs/building_your_app/app_authorization/
- Jobber app review: https://developer.getjobber.com/docs/publishing_your_app/app_review_process/

Official documentation demonstrates platform mechanics, not a GoLocal partnership or completed production booking. Platform pages can change after this review.
