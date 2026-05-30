# Unofficial PlayFab JavaScript SDK

## 1. Overview:

Unofficial JavaScript SDK for the various PlayFab API suites.

> ⚠️ This SDK is auto-generated using the same resources the PlayFab team uses, but is not officially endorsed or supported by them in any way, shape, or form.

## 2. NPM support:

You may install the SDK with npm by running:

`npm install @community-fabs/playfab-sdk`

## 3. Features

- The SDK generator itself was rewritten using `eta` for templating (significantly reduces generation times) and now resides in the same repo as the SDK itself
- Additional API documentation and usage instructions are provided
- All calls use Promises
- Switched from CommonJS to ES Modules
- Tree-shakeable
- Dependency-free
- Support for custom request middleware (retries, logging, adding headers, etc)

## 3. Usage
### Basic example
```typescript
import { initializePlayFab } from '@community-fabs/playfab-sdk/core';
import getClientApi from '@community-fabs/playfab-sdk/client';

const playfab = initializePlayFab({
  titleId: 'YOUR_TITLE_ID',
  developerSecretKey: 'YOUR_DEV_SECRET_KEY',
});
const clientApi = getClientApi(playfab);

await clientApi.loginWithCustomID({
  CustomId: "test-custom-id",
});
```

### Example logging middleware
```typescript
import { initializePlayFab, type RequestMiddleware } from '@community-fabs/playfab-sdk/core';

function loggerMiddleware(): RequestMiddleware {
  return async (req, next) => {
    console.log('Request:', req);
    const res = await next(req)
    console.log('Response:', res)
    return res
  };
}

const playfab = initializePlayFab({
  titleId: 'YOUR_TITLE_ID',
  developerSecretKey: 'YOUR_DEV_SECRET_KEY',
}).with(loggerMiddleware());

// Then pass the `playfab` object to the desired API functions like normal
```

### Example retry middleware
```typescript
import { initializePlayFab, type RequestMiddleware } from '@community-fabs/playfab-sdk/core';

function retryMiddleware(retries = 2): RequestMiddleware {
  return async (req, next) => {
    let lastError: unknown;

    for (let i = 0; i <= retries; i++) {
      try {
        return await next(req);
      } catch (err) {
        lastError = err;
      }
    }

    throw lastError;
  };
}

const playfab = initializePlayFab({
  titleId: 'YOUR_TITLE_ID',
  developerSecretKey: 'YOUR_DEV_SECRET_KEY',
}).with(retryMiddleware(3));

// Then pass the `playfab` object to the desired API functions like normal
```

## 5. Acknowledgements

- The PlayFab team

## 6. Copyright and Licensing Information:

Apache License --
Version 2.0, January 2004
http://www.apache.org/licenses/

Full details available within the LICENSE file.
