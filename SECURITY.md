# Security Policy

## Supported Versions

Currently supported versions that receive security updates:

| Version | Supported          | Notes                                                  |
| ------- | ------------------ | ------------------------------------------------------ |
| 1.0.x   | :white_check_mark: | Current stable release                                |
| < 1.0   | :x:                | Beta versions - upgrade to latest stable              |

## Reporting a Vulnerability

We take the security of the n8n Synology Package seriously. If you have discovered a security vulnerability, we appreciate your help in disclosing it to us in a responsible manner.

### Reporting Process

**DO NOT** create a public GitHub issue for security vulnerabilities.

Instead, please report security vulnerabilities by email to:

📧 **security@josedacosta.info**

### What to Include

When reporting a vulnerability, please provide:

1. **Description**: Clear description of the vulnerability
2. **Impact**: Potential impact and severity assessment
3. **Steps to Reproduce**: Detailed steps to reproduce the issue
4. **Affected Components**: Which part of the package is affected (installer scripts, Docker configuration, etc.)
5. **Synology DSM Version**: Your DSM version and Container Manager version
6. **Package Version**: Version of n8n Synology Package affected
7. **Suggested Fix**: If you have ideas for how to fix it (optional)

### Response Timeline

- **Initial Response**: Within 48 hours of receipt
- **Assessment**: Within 5 business days
- **Fix Development**: Depends on severity (critical issues prioritized)
- **Public Disclosure**: After fix is released and users have time to update

### Security Vulnerability Criteria

We are especially interested in:

- **Installation Script Vulnerabilities**: Issues in installer, start-stop-status, or backup scripts
- **Permission Escalation**: Unauthorized access to system resources
- **Data Exposure**: Unintended exposure of sensitive data (encryption keys, passwords)
- **Docker Configuration**: Security misconfigurations in docker-compose.yml
- **Path Traversal**: File system access outside intended directories
- **Command Injection**: Potential for arbitrary command execution
- **Credential Storage**: Insecure storage or handling of credentials
- **Network Security**: Exposed services or insecure default configurations

### Out of Scope

The following are **not** considered vulnerabilities for this package:

- Vulnerabilities in n8n itself (report to https://github.com/n8n-io/n8n/security)
- Vulnerabilities in PostgreSQL (report to PostgreSQL security team)
- Issues requiring physical access to the NAS
- Social engineering attacks
- Denial of Service (DoS) attacks that require authenticated access
- Issues in third-party integrations configured by users

## Security Best Practices

To maintain security when using this package:

### During Installation

1. **Verify Package Integrity**:
   - Check SHA256 checksum before installation
   - Download only from official sources (GitHub releases or configured repository)

2. **Secure Environment**:
   - Ensure Container Manager is up to date
   - Use a dedicated user account for n8n service
   - Configure firewall rules before installation

### Post-Installation

1. **Protect Encryption Keys**:
   ```bash
   # Backup your encryption key immediately after installation
   cat /var/packages/n8n/target/.env | grep N8N_ENCRYPTION_KEY
   ```
   Store this key securely - it cannot be recovered if lost!

2. **Configure HTTPS**:
   - Use the provided nginx-reverse-proxy.conf as a template
   - Configure SSL certificates through DSM
   - Never expose n8n directly to the internet without HTTPS

3. **Enable Authentication**:
   ```bash
   # Edit /var/packages/n8n/target/.env
   N8N_BASIC_AUTH_ACTIVE=true
   N8N_BASIC_AUTH_USER=your_admin_user
   N8N_BASIC_AUTH_PASSWORD=strong_password_here
   ```

4. **Network Security**:
   - Configure DSM firewall to restrict access to port 5678
   - Use VPN for remote access when possible
   - Implement IP whitelisting if applicable

5. **Regular Updates**:
   - Monitor for package updates
   - Update n8n Docker image regularly:
     ```bash
     cd /var/packages/n8n/target
     docker-compose pull
     docker-compose up -d
     ```

6. **Backup Strategy**:
   - Use the included backup script regularly
   - Store backups in a secure, separate location
   - Test backup restoration procedures

### Security Checklist

Before deploying to production:

- [ ] Changed default PostgreSQL password
- [ ] Backed up N8N_ENCRYPTION_KEY
- [ ] Configured HTTPS via reverse proxy
- [ ] Enabled authentication (basic auth or n8n's built-in)
- [ ] Configured firewall rules
- [ ] Set up automated backups
- [ ] Reviewed file permissions
- [ ] Disabled unnecessary services
- [ ] Configured log rotation
- [ ] Tested disaster recovery procedure

## Security Features

This package includes several security features:

1. **Automatic Key Generation**: Encryption keys and database passwords are generated automatically during installation
2. **Permission Management**: Strict file permissions (600 for .env, 755 for directories)
3. **User Isolation**: Runs under dedicated n8n-user account
4. **Network Isolation**: Uses Docker network isolation between services
5. **Health Checks**: PostgreSQL health checks before n8n startup
6. **Secure Defaults**: Conservative default configuration
7. **Audit Logging**: Comprehensive logging of all operations

## Vulnerability Disclosure Policy

We follow a coordinated vulnerability disclosure policy:

1. **Private Disclosure**: Security issues are kept private until a fix is available
2. **Fix Development**: We work on fixes as quickly as possible
3. **Release**: Security updates are released with clear notes
4. **Grace Period**: Users are given time to update before public disclosure
5. **Public Disclosure**: After the grace period, details may be shared to help the community

## Credits

We thank the following researchers for responsibly disclosing security issues:

_This section will be updated as security researchers help improve our package._

## Additional Resources

- [n8n Security](https://docs.n8n.io/hosting/security/)
- [Synology Security](https://www.synology.com/security)
- [Docker Security Best Practices](https://docs.docker.com/engine/security/)
- [PostgreSQL Security](https://www.postgresql.org/docs/current/security.html)

---

**Remember**: Security is a shared responsibility. While we strive to make this package secure by default, proper configuration and maintenance by administrators is essential for maintaining security.

For non-security bugs and feature requests, please use the [GitHub issue tracker](https://github.com/josedacosta/n8n-synology-package/issues).