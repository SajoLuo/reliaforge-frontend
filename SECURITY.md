# Security Policy

## Supported versions

Security fixes are provided for the latest released minor version. Pre-release branches are supported on a best-effort basis.

## Reporting a vulnerability

Please use a private security advisory on the repository hosting service. Do not open a public issue for an unpatched vulnerability and do not include credentials, session data, private addresses, or production traces in a report.

Include the affected version, a minimal reproduction, expected impact, and any safe mitigation you
have tested. You should receive an acknowledgement within seven days.

## Frontend trust boundary

This client does not accept production API keys through build variables and does not send
cross-origin credentials. Authorization decisions, direct-peer proxy validation, and identity
header injection remain server-side backend concerns.
