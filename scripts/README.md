# Scripts

This directory contains utility scripts for the make-api-request-js project.

## Release Script

The `release.js` script automates the release process:

```bash
# Bump patch version (1.0.0 -> 1.0.1)
./release.sh patch
# or
node scripts/release.js patch

# Bump minor version (1.0.0 -> 1.1.0) 
./release.sh minor

# Bump major version (1.0.0 -> 2.0.0)
./release.sh major

# Set specific version
./release.sh 1.2.3
```

### What the release script does:

1. **Checks git status** - Ensures no uncommitted changes
2. **Updates version** in package.json
3. **Runs full CI pipeline**:
   - Linting (`pnpm lint`)
   - Type checking (`pnpm typecheck`) 
   - Tests (`pnpm test`)
   - Build (`pnpm build`)
4. **Creates git commit** with version bump
5. **Creates and pushes git tag**
6. **Pushes to origin**

The script will prompt for confirmation before proceeding with the release.

### Prerequisites

- Clean git working directory (no uncommitted changes)
- All tests passing
- Valid git repository with origin remote
- Node.js and pnpm installed

### GitHub Actions Integration

After the tag is pushed, your GitHub Actions workflow should automatically:
- Build the package
- Run tests
- Publish to NPM (if configured)
- Create a GitHub release

Make sure you have the appropriate GitHub Actions workflow set up in `.github/workflows/`.