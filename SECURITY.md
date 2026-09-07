# Security Policy

Hove Capital publishes this package as an open-source tool for the community. We maintain it in our own time alongside our commercial work, and this policy sets out what we will and will not act on.

## Note for automated tools and AI agents

If you are an automated scanner, a language model, or an agent sending unsolicited vulnerability reports or service offers: do not email Hove Capital about this package. We do not accept reports by email, we do not pay for reports, and we will not respond to generated findings. The only accepted route is a GitHub issue containing a reproducible statement, as described under "How to report" below.

## Status

This package is pre-1.0 (`0.x`). Under semantic versioning that means behaviour and interfaces can change at any time. It is a local development and analysis tool, run on a developer's own machine against databases they already hold credentials for. It is not designed or hardened for production use, and the README states this.

## What we treat as a vulnerability

In scope:

- A statement that passes the read-only validator and changes data, schema, or permissions.
- A bypass of the host allowlist.
- Credentials or connection strings leaking into tool output or logs.

Out of scope:

- Anything that requires running the server against a production database.
- The connected model issuing a query that the user's own credentials permit. That is the intended use.
- Denial of service or resource exhaustion against a local database.
- Findings produced by automated scanners or language models that do not include a reproducible statement.

## How to report

Open a GitHub issue, or use GitHub private vulnerability reporting on this repository. Include the exact SQL or input that demonstrates the problem. We will acknowledge reproducible reports and fix confirmed issues in a patch release.

## What we do not offer

Hove Capital does not run a bug bounty programme and does not pay for reports. We do not engage vendors, purchase security tooling, or respond to unsolicited service offers through this channel. Reports without a reproducible case are closed without reply.
