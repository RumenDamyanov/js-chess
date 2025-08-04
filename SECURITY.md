# Security Policy

## Supported Versions

We release patches for security vulnerabilities for the following versions:

| Version | Supported          |
| ------- | ------------------ |
| 1.x.x   | ✅                |
| < 1.0   | ❌                |

## Reporting a Vulnerability

We take the security of JS Chess seriously. If you discover a security vulnerability, please follow these steps:

### 1. Do NOT open a public GitHub issue

Security vulnerabilities should be reported privately to allow us to fix them before they are publicly disclosed.

### 2. Send a report via email

Email your findings to: **security@rumenx.com**

Please include:
- Description of the vulnerability
- Steps to reproduce the issue
- Potential impact
- Suggested fix (if any)

### 3. Response timeline

- **Initial response**: Within 48 hours
- **Status update**: Within 7 days
- **Fix timeline**: Depends on severity, typically within 30 days

### 4. Disclosure policy

- We will acknowledge receipt of your vulnerability report
- We will investigate and validate the issue
- We will work on a fix and release it as soon as possible
- We will coordinate with you on the disclosure timeline
- We will publicly credit you for the discovery (unless you prefer to remain anonymous)

## Security best practices

When using JS Chess:

1. **HTTPS in production** - Always use HTTPS for production deployments
2. **Input validation** - Validate all user inputs and API parameters
3. **Rate limiting** - Implement rate limiting for API endpoints
4. **Access control** - Secure your deployment appropriately
5. **Regular updates** - Keep dependencies updated to the latest versions

## Security considerations

- This is a demo application designed for development/educational purposes
- Default setup is not production-ready and requires additional security hardening
- Game data is stored in memory and browser localStorage by default
- API endpoints are publicly accessible in demo mode

## Contact

For any security-related questions or concerns, please contact:

**Email:** security@rumenx.com  
**Maintainer:** Rumen Damyanov

Thank you for helping keep JS Chess and our users safe!
