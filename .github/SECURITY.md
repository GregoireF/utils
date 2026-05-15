# Security Policy

## Supported Versions

All packages in this repository follow semantic versioning. Only the latest published version of each package receives security fixes.

| Package | Supported |
|---|---|
| latest minor | ✅ |
| previous minor | fixes backported on a case-by-case basis |
| older versions | ❌ |

## Reporting a Vulnerability

**Do not open a public GitHub issue for security vulnerabilities.**

You have two options:

1. **[GitHub private security advisory](https://github.com/GregoireF/utils/security/advisories/new)** _(preferred)_ — allows coordinated disclosure without public exposure.
2. **Email** — [gfavreau.wrprojects@gmail.com](mailto:gfavreau.wrprojects@gmail.com) with subject `[SECURITY] @gregoiref/utils — <package>`.

Please include in your report:

- A clear description of the vulnerability
- Steps to reproduce (minimal reproduction case if possible)
- Potential impact assessment
- Suggested fix or mitigation (optional)

**Response SLA:**
- Acknowledgement within 48 hours
- Triage status within 7 days
- Fix timeline communicated within 14 days for confirmed vulnerabilities

## Security Architecture

This repository employs multiple independent layers of protection:

| Control | Scope | Trigger |
|---|---|---|
| `pnpm audit --audit-level=moderate` | Dependency CVEs | Every CI run |
| `secretlint` | Hardcoded secrets | Every `git push` (pre-push hook) |
| **CodeQL** (`security-extended`) | Static code analysis | Push to `main` + weekly schedule |
| **OSSF Scorecard** | Supply chain posture | Weekly schedule |
| **Renovate** | Dependency freshness | Weekly (auto-merge minor/patch) |
| `@biomejs/biome` | Code quality gates | Every commit (pre-commit hook) |
| **Jazzer.js** | Coverage-guided fuzzing | Weekly schedule (3 fuzz targets) |
| **Dependency Review** | License + CVE gate on PRs | Every pull request |

## Scope

Security reports are accepted for:

- Vulnerabilities in published packages (`@gregoiref/*`) that could affect consumers
- Insecure patterns in source code that could be copied and misused
- Supply chain issues (compromised dependency, malicious PR, typosquatting)

Not in scope:

- Vulnerabilities in development-only dependencies that cannot affect published packages
- Theoretical issues without a realistic attack vector
- Issues requiring physical access to the developer's machine

## Disclosure Policy

After a fix is published, vulnerabilities will be disclosed via GitHub's security advisory following a 7-day embargo to allow consumers time to update.
