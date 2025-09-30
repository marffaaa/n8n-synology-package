## Description

<!-- Provide a clear and concise description of your changes -->

## Type of Change

<!-- Mark the relevant option with an "x" -->

- [ ] 🐛 Bug fix (non-breaking change which fixes an issue)
- [ ] ✨ New feature (non-breaking change which adds functionality)
- [ ] 💥 Breaking change (fix or feature that would cause existing functionality to not work as expected)
- [ ] 📚 Documentation update
- [ ] 🔧 Configuration change
- [ ] 🎨 Code refactoring (no functional changes)
- [ ] ⚡ Performance improvement
- [ ] 🧪 Test addition or update

## Related Issue

<!-- Link to the issue this PR addresses -->

Fixes #(issue)

## Changes Made

<!-- List the specific changes made in this PR -->

-
-
-

## Testing Performed

<!-- Describe the testing you performed -->

### Test Environment
- **DSM Version:**
- **Package Version:**
- **Installation Method:** Fresh / Upgrade

### Test Steps
1.
2.
3.

### Test Results
- [ ] Package builds successfully (`yarn build && yarn package`)
- [ ] Package installs without errors
- [ ] Service starts correctly
- [ ] n8n web interface is accessible
- [ ] Containers are running (`docker-compose ps`)
- [ ] No errors in logs (`/tmp/n8n_*.log`)
- [ ] Diagnostic script runs successfully
- [ ] Tested upgrade path (if applicable)
- [ ] Tested uninstallation (if applicable)

## Impact Analysis

<!-- Describe the potential impact of this change -->

### Files Modified
<!-- List the main files that were changed -->

-
-

### Affected Components
<!-- Mark the components affected by this change -->

- [ ] Package structure (INFO, .spk format)
- [ ] Installation scripts (installer)
- [ ] Service management (start-stop-status)
- [ ] Docker Compose configuration
- [ ] Database configuration
- [ ] Backup functionality
- [ ] DSM UI integration
- [ ] Documentation

### Breaking Changes
<!-- If this is a breaking change, describe the migration path -->

- [ ] No breaking changes
- [ ] Breaking changes (describe below):

## Checklist

<!-- Ensure all items are completed before submitting -->

- [ ] My code follows the project's code style
- [ ] I have performed a self-review of my code
- [ ] I have commented my code, particularly in hard-to-understand areas
- [ ] I have updated the documentation accordingly
- [ ] My changes generate no new warnings or errors
- [ ] I have tested my changes on a Synology NAS (DSM 7+)
- [ ] All logs are in English
- [ ] Scripts use proper logging functions (`log()`, `log_error()`, `log_success()`)
- [ ] File permissions are set correctly (755 for scripts, 600 for .env)
- [ ] Commit messages follow [Conventional Commits](https://www.conventionalcommits.org/)

## Screenshots / Logs

<!-- If applicable, add screenshots or relevant log outputs -->

```
Paste relevant logs here
```

## Additional Notes

<!-- Add any additional notes or context for reviewers -->

## Reviewer Checklist

<!-- For maintainers reviewing this PR -->

- [ ] Code changes are logical and well-structured
- [ ] Security implications have been considered
- [ ] Documentation is adequate
- [ ] Testing is sufficient
- [ ] No hardcoded credentials or sensitive data
- [ ] Follows Synology package best practices
- [ ] Compatible with DSM 7.0+