# Getting Support

Thank you for using the n8n Synology Package! This document provides information on how to get help and support.

## Table of Contents

- [Documentation](#documentation)
- [Community Support](#community-support)
- [Reporting Issues](#reporting-issues)
- [Professional Support](#professional-support)
- [Frequently Asked Questions](#frequently-asked-questions)
- [Diagnostic Tools](#diagnostic-tools)

## Documentation

Before seeking support, please consult our comprehensive documentation:

### Project Documentation

- 📖 **[README.md](README.md)** - Installation guide and general usage
- 🐳 **[INSTALLATION-DOCKER.md](docs/INSTALLATION-DOCKER.md)** - Detailed Docker architecture and configuration
- 🔄 **[Breaking Changes DSM 7+](docs/breaking-changes-dsm7.md)** - DSM compatibility and migration guide
- 🔍 **[Log Recovery Guide](docs/log-recovery.md)** - Troubleshooting and diagnostic procedures
- 📦 **[Repository Setup](docs/REPOSITORY-SETUP.md)** - Package repository configuration
- ➕ **[Add Repository Guide](docs/ADD-REPOSITORY.md)** - Adding package source to Synology
- 👥 **[Contributing Guide](CONTRIBUTING.md)** - How to contribute to the project
- 🔒 **[Security Policy](SECURITY.md)** - Security best practices and vulnerability reporting

### n8n Documentation

- 📚 **[n8n Official Docs](https://docs.n8n.io)** - Complete n8n documentation
- 🎓 **[n8n Academy](https://docs.n8n.io/courses/)** - n8n learning resources
- 🔧 **[n8n API Reference](https://docs.n8n.io/api/)** - API documentation

## Community Support

### GitHub Discussions

The best place to get help is through our **[GitHub Discussions](https://github.com/josedacosta/n8n-synology-package/discussions)**:

- 💬 **[General](https://github.com/josedacosta/n8n-synology-package/discussions/categories/general)** - General discussions about the package
- ❓ **[Q&A](https://github.com/josedacosta/n8n-synology-package/discussions/categories/q-a)** - Ask questions and get answers from the community
- 💡 **[Ideas](https://github.com/josedacosta/n8n-synology-package/discussions/categories/ideas)** - Share feature requests and enhancement ideas
- 🎉 **[Show and Tell](https://github.com/josedacosta/n8n-synology-package/discussions/categories/show-and-tell)** - Share your workflows and use cases

### n8n Community

For n8n-specific questions (not related to Synology packaging):

- 🌐 **[n8n Community Forum](https://community.n8n.io)** - Official n8n community
- 💬 **[n8n Discord](https://discord.gg/n8n)** - Real-time chat with n8n users
- 🐦 **[n8n Twitter](https://twitter.com/n8n_io)** - Latest n8n news and updates

### Synology Community

For Synology-specific questions:

- 🏢 **[Synology Community](https://community.synology.com)** - Official Synology forum
- 📦 **[SynoCommunity](https://synocommunity.com)** - Community packages for Synology

## Reporting Issues

### Before Reporting an Issue

1. **Check existing issues**: Search [closed issues](https://github.com/josedacosta/n8n-synology-package/issues?q=is%3Aissue+is%3Aclosed) and [open issues](https://github.com/josedacosta/n8n-synology-package/issues)
2. **Run diagnostics**: Use the diagnostic script (see [Diagnostic Tools](#diagnostic-tools))
3. **Check logs**: Review installation and service logs
4. **Verify prerequisites**: Ensure Container Manager is installed and ports are available

### How to Report Issues

Report bugs and issues on our **[GitHub Issues](https://github.com/josedacosta/n8n-synology-package/issues)** page.

**When reporting, include:**

1. **Environment Information**:
   - Synology model (e.g., DS920+, RS1221+)
   - DSM version (e.g., DSM 7.2-64570)
   - Container Manager version
   - Package version
   - n8n version (from docker-compose logs)

2. **Problem Description**:
   - Clear description of the issue
   - Steps to reproduce
   - Expected vs. actual behavior
   - Error messages (if any)

3. **Diagnostic Information**:
   ```bash
   # Run diagnostic script and attach output
   sudo bash /var/packages/n8n/target/diagnose.sh
   ```

4. **Relevant Logs**:
   - Installation log: `/tmp/n8n_install.log`
   - Service log: `/tmp/n8n_service.log`
   - Docker logs: `docker-compose logs --tail=50`

5. **Screenshots** (if applicable)

### Security Issues

⚠️ **NEVER report security vulnerabilities in public issues!**

For security issues, please email: **security@josedacosta.info**

See our [Security Policy](SECURITY.md) for details.

## Professional Support

### Package Developer

For professional support, custom development, or enterprise deployments:

- 👤 **Developer**: Jose DA COSTA
- 🌐 **Website**: [josedacosta.com](https://josedacosta.com)
- 📧 **Contact**: contact@josedacosta.info
- 💼 **GitHub**: [@josedacosta](https://github.com/josedacosta)

### n8n Enterprise Support

For n8n enterprise features and support:

- 🏢 **[n8n Cloud](https://n8n.io/cloud/)** - Hosted n8n solution
- 💼 **[n8n Enterprise](https://n8n.io/enterprise/)** - Enterprise self-hosted solution
- 📧 **Sales**: sales@n8n.io

## Frequently Asked Questions

### Installation Issues

**Q: Container Manager is not found during installation**
- A: Install Container Manager from Synology Package Center first

**Q: Port 5678 is already in use**
- A: Either free the port or change it in `/var/packages/n8n/target/.env`

**Q: Installation fails with "insufficient permissions"**
- A: Ensure you're installing with an admin account

### Runtime Issues

**Q: n8n is not accessible after installation**
- A: Check if containers are running: `docker-compose ps`
- A: Verify firewall settings allow port 5678

**Q: Lost encryption key warning**
- A: The encryption key is in `/var/packages/n8n/target/.env`. Back it up immediately!

**Q: PostgreSQL connection errors**
- A: Check if PostgreSQL container is healthy: `docker-compose ps`
- A: Review PostgreSQL logs: `docker-compose logs postgres`

### Update Issues

**Q: How to update n8n to the latest version?**
```bash
cd /var/packages/n8n/target
docker-compose pull
docker-compose up -d
```

**Q: Package update fails**
- A: Check disk space and Docker status
- A: Manual update via SSH may be required

### Performance Issues

**Q: n8n is running slowly**
- A: Check available RAM (minimum 2GB, 4GB recommended)
- A: Review resource usage: `docker stats`
- A: Consider upgrading PostgreSQL resources

## Diagnostic Tools

### Built-in Diagnostic Script

The package includes a comprehensive diagnostic script:

```bash
# Run full diagnostics
sudo bash /var/packages/n8n/target/diagnose.sh

# Output is saved to /tmp/n8n_diagnostic_TIMESTAMP.txt
```

The diagnostic script checks:
- System information (DSM version, resources)
- Docker/Container Manager status
- Package installation status
- File permissions and structure
- Network configuration
- Container health
- Recent logs
- Common issues

### Manual Diagnostics

```bash
# Check package status
synopkg status n8n

# View containers
cd /var/packages/n8n/target
docker-compose ps

# Check logs
docker-compose logs --tail=100

# Test n8n connectivity
curl -I http://localhost:5678

# Check disk space
df -h /var/packages/n8n

# Verify permissions
ls -la /var/packages/n8n/target/
```

### Log Locations

- **Installation Log**: `/tmp/n8n_install.log`
- **Service Log**: `/tmp/n8n_service.log`
- **Diagnostic Reports**: `/tmp/n8n_diagnostic_*.txt`
- **Docker Logs**: Via `docker-compose logs`
- **n8n Application Logs**: `/var/packages/n8n/target/data/logs/`

## Getting Help Quickly

To get the fastest and most accurate help:

1. **Be Specific**: Provide clear, detailed information about your issue
2. **Include Context**: Share your environment details and what you were trying to achieve
3. **Show Your Work**: Include commands you ran and their output
4. **Use Diagnostics**: Always run and include diagnostic script output
5. **Check Documentation**: Review relevant documentation before asking
6. **Search First**: Look for similar issues or discussions
7. **Be Patient**: Community support is provided by volunteers

## Contributing Back

If you've solved an issue or improved the package:

- 📝 **Update Documentation**: Help others by improving our docs
- 🐛 **Report Bugs**: File detailed bug reports
- 💡 **Share Ideas**: Suggest enhancements in discussions
- 🔧 **Submit PRs**: Contribute code improvements
- 💬 **Help Others**: Answer questions in discussions
- ⭐ **Star the Project**: Show your support on GitHub

See our [Contributing Guide](CONTRIBUTING.md) for details.

## Additional Resources

### Tutorials and Guides

- 📺 **[n8n YouTube Channel](https://www.youtube.com/n8n-io)** - Video tutorials
- 📝 **[n8n Blog](https://n8n.io/blog/)** - Tips, tricks, and use cases
- 🎓 **[n8n Academy](https://docs.n8n.io/courses/)** - Structured learning paths

### Related Projects

- 🔧 **[n8n GitHub](https://github.com/n8n-io/n8n)** - n8n source code
- 📦 **[SynoCommunity](https://github.com/SynoCommunity/spksrc)** - Synology package framework
- 🐳 **[Docker Hub - n8n](https://hub.docker.com/r/n8nio/n8n)** - n8n Docker images

### Stay Updated

- 📰 **[GitHub Releases](https://github.com/josedacosta/n8n-synology-package/releases)** - Package updates
- 🔔 **[Watch Repository](https://github.com/josedacosta/n8n-synology-package)** - Get notifications
- 📧 **[n8n Newsletter](https://n8n.io/newsletter/)** - n8n news and updates

---

**Remember**: The community is here to help! Don't hesitate to ask questions, but please be respectful of everyone's time by doing basic troubleshooting first.

**Thank you for using n8n Synology Package!** 🎉