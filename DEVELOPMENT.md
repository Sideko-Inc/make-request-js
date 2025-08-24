# Development

This document describes how to develop and maintain this package.

## Available Commands

You can use either `pnpm` directly or the `Makefile` for common tasks:

### Development

```bash
# Install dependencies
pnpm install
# or
make install

# Run in development mode (watch mode)
pnpm dev
# or  
make dev

# Build the project
pnpm build
# or
make build

# Clean build artifacts
pnpm clean
# or
make clean
```

### Code Quality

```bash
# Run linting
pnpm lint
# or
make lint

# Run type checking  
pnpm typecheck
# or
make typecheck

# Format code
pnpm format
# or
make format

# Run quick checks (lint + typecheck)
pnpm check
```

### Testing

```bash
# Run tests
pnpm test
# or
make test

# Run tests with coverage
pnpm test:coverage
# or  
make test-cov

# Run tests in watch mode
pnpm test:watch
```

### CI/Release

```bash
# Run full CI pipeline (lint, typecheck, test, build)
pnpm run ci-checks
# or
make ci

# Release new version
./release.sh patch   # 1.0.0 -> 1.0.1
./release.sh minor   # 1.0.0 -> 1.1.0  
./release.sh major   # 1.0.0 -> 2.0.0
./release.sh 1.2.3   # Specific version

# or using make
make release-patch
make release-minor  
make release-major
```

### Help

```bash
# Show all available make targets
make help
```

## Project Structure

```
├── src/                 # Source TypeScript files
├── test/               # Test files  
├── dist/               # Built JavaScript files (generated)
├── scripts/            # Utility scripts
│   ├── release.js      # Release automation
│   └── README.md       # Scripts documentation
├── .github/workflows/  # GitHub Actions
├── Makefile           # Development commands
├── package.json       # Package configuration
├── tsconfig.json      # TypeScript configuration
├── jest.config.cjs    # Jest test configuration  
├── eslint.config.js   # ESLint configuration
└── release.sh         # Release script wrapper
```

## Release Process

1. Make sure all changes are committed
2. Run `./release.sh patch|minor|major` 
3. The script will:
   - Update package.json version
   - Run full CI pipeline (lint, typecheck, test, build)
   - Create git commit and tag
   - Push to GitHub
4. GitHub Actions will automatically publish to NPM

## Development Workflow

1. **Make changes** to source files in `src/`
2. **Add tests** in `test/` directory
3. **Run checks**: `make ci` or `pnpm ci`
4. **Commit changes**
5. **Release**: `./release.sh patch|minor|major`

## Testing

- All source files should have corresponding test files
- Maintain 80%+ test coverage
- Tests run automatically in CI/CD pipeline
- Use `pnpm test:coverage` to check coverage locally

## Code Style

- ESLint enforces code style and quality rules
- Prettier formats code automatically  
- TypeScript provides type safety
- Run `pnpm format` to format code
- Run `pnpm lint` to check for issues