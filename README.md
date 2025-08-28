# make-api-request-js

[![CI](https://github.com/sideko-inc/make-request-js/workflows/CI/badge.svg)](https://github.com/sideko-inc/make-request-js/actions)
[![npm version](https://badge.fury.io/js/make-api-request-js.svg)](https://badge.fury.io/js/make-api-request-js)
[![codecov](https://codecov.io/gh/sideko-inc/make-api-request-js/branch/main/graph/badge.svg)](https://codecov.io/gh/sideko-inc/make-api-request-js)

Modern TypeScript HTTP client for browser and Node.js environments.

## Features

- 🚀 **Universal**: Works in both browser and Node.js
- 🔒 **Type Safe**: Full TypeScript support with strict typing
- 🛡️ **Secure**: Built-in security features and authentication
- 🧪 **Well Tested**: Comprehensive test coverage
- 📦 **Zero Config**: Works out of the box
- 🔌 **Extensible**: Multiple authentication methods

## Installation

```bash
pnpm add make-api-request-js
```

Or with npm:
```bash
npm install make-api-request-js
```

## Quick Start

```typescript
import { CoreClient } from 'make-api-request-js';

const client = new CoreClient({
  baseUrl: 'https://api.example.com'
});

// Make a GET request
const response = await client.makeRequest({
  method: 'get',
  path: '/users'
});

const users = await response.json();
console.log(users);
```

## Authentication

### Bearer Token

```typescript
import { CoreClient, AuthBearer } from 'make-api-request-js';

const client = new CoreClient({
  baseUrl: 'https://api.example.com',
  auths: {
    bearer: new AuthBearer('your-token-here')
  }
});

const response = await client.makeRequest({
  method: 'get',
  path: '/protected',
  auth: ['bearer']
});
```

### API Key

```typescript
import { AuthKey } from 'make-api-request-js';

// Header-based API key
const headerAuth = new AuthKey('X-API-Key', 'your-api-key');

// Query parameter API key
const queryAuth = new AuthKey('api_key', 'your-api-key', 'query');
```

### OAuth2 Client Credentials

```typescript
import { OAuth2ClientCredentials } from 'make-api-request-js';

const oauth = new OAuth2ClientCredentials(
  'client-id',
  'client-secret',
  'https://auth.example.com/token'
);
```

## Development

```bash
# Install dependencies
pnpm install

# Run tests
pnpm test

# Run tests with coverage
pnpm test:coverage

# Build the project
pnpm build

# Run linting
pnpm lint

# Format code
pnpm format
```

## Contributing

1. Fork the repository
2. Create your feature branch (`git checkout -b feature/amazing-feature`)
3. Commit your changes (`git commit -m 'Add some amazing feature'`)
4. Push to the branch (`git push origin feature/amazing-feature`)
5. Open a Pull Request


## License

MIT License - see LICENSE file for details.