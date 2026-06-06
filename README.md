# Unofficial PlayFab JavaScript SDK

## 1. Overview:

Unofficial JavaScript SDK for the various PlayFab API suites.

> This SDK is auto-generated using the same resources the PlayFab team uses, but this project is not affiliated with or endorsed by PlayFab.

## 2. NPM support:

You may install the SDK with npm by running:

`npm install @community-fabs/playfab-sdk`

## 3. Features

- The SDK generator itself was written using `eta` for templating and resides in the same repo as the SDK itself
- API documentation, sample requests, and usage instructions are provided
- All API calls use Promises and are `await`able
- Switched from CommonJS to ES Modules
- Tree-shakeable
- Dependency-free
- Support for [custom request middleware](https://community-fabs.github.io/sdks/js/middleware) (retries, logging, adding headers, etc)

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

### Example with logging middleware
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

More information on middleware can be found [here](https://community-fabs.github.io/sdks/js/middleware).

## 5. Acknowledgements

- The PlayFab team

## 6. Copyright and Licensing Information:

Apache License --
Version 2.0, January 2004
http://www.apache.org/licenses/

Full details available within the LICENSE file.
