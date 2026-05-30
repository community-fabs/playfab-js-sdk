import constants, {
  AuthContext,
  AuthInfoMap, 
  type AuthType,
  type PlayfabConfig,
} from "./constants";
import {
  compose,
  type RequestMiddleware,
  type RequestContext
} from "./middleware";
export type { RequestMiddleware };

interface RequestOptions {
  method?: string;
  body?: any;
  authType?: AuthType;
  headers?: Record<string, string>;
}
  
export interface PlayfabClient {
  config: PlayfabConfig;

  sessionTicket?: string;
  entityToken?: string;
  authContext: AuthContext;

  request<T = any>(path: string, options?: RequestOptions): Promise<T>;

  with(mw: RequestMiddleware): PlayfabClient;

  getAuthInfo(request: any, authKey: AuthType): {
    header: string;
    authValue: string | undefined;
    error: string;
  };

  updateAuthContext(currentAuthContext: AuthContext, result: any): AuthContext;
}

/**
 * Initializes a PlayFab client with the provided configuration.
 * @param config - The configuration object containing the titleId and developerSecretKey.
 * @returns An instance of the PlayFab client.
 * @example
 * import getClientApi from '@community-fabs/playfab-sdk/client';
 * 
 * const playfab = initializePlayFab({
 *   titleId: 'YOUR_TITLE_ID',
 *   developerSecretKey: 'YOUR_DEV_SECRET_KEY',
 * });
 * const clientApi = getClientApi(playfab);
 */
export function initializePlayFab(config: PlayfabConfig): PlayfabClient {
  const middleware: RequestMiddleware[] = [];

  const baseUrl =
    `https://${config.titleId}.playfabapi.com`;

  let authContext: AuthContext = {};

  const client = {
    get config() {
      return config;
    },

    set sessionTicket(ticket: string | undefined) {
      authContext.SessionTicket = ticket;
    },

    get sessionTicket() {
      return authContext.SessionTicket;
    },

    set entityToken(value: string | undefined) {
      authContext.EntityToken = value;
    },

    get entityToken() {
      return authContext.EntityToken;
    },

    get authContext() {
      return authContext;
    },

    async request<T = any>(
      path: string,
      options: RequestOptions = {}
    ): Promise<T> {
      let authHeaders: Record<string, string> = {};
      if (options.authType) {
        const { header, authValue, error } = client.getAuthInfo(options.body, options.authType);
        if (!authValue) {
          throw new Error(error);
        }
        authHeaders[header] = authValue;
      }
      const ctx: RequestContext = {
        url: `${baseUrl}${path}`,
        method: options.method ?? "POST",
        headers: {
          "Content-Type": "application/json",
          "X-PlayFabSDK": `CommunityJSSDK-${constants.sdkVersion}`,
          ...authHeaders,
          ...options.headers,
        },
        body: options.body,
      };

      const runner = compose(middleware);
      const result = await runner(ctx);

      if (result.data?.error && result.data?.errorMessage) {
        throw new Error(`${result.data.error} - ${result.data.errorMessage}`);
      } else if (!result.response.ok) {
        throw new Error(`HTTP ${result.response.status}`);
      }

      return result.data.data as T;
    },

    /**
     * Adds a middleware function to the request pipeline. Middleware is executed
     * in the order they are added, allowing you to modify requests and responses as needed.
     * @param mw 
     * @returns the PlayFab client instance, allowing for chaining multiple middleware calls.
     * @example
     * function loggerMiddleware(): RequestMiddleware {
     *   return async (req, next) => {
     *     console.log('Request:', req);
     *     const res = await next(req)
     *     console.log('Response:', res)
     *     return res
     *   };
     * }
     *
     * const playfab = initializePlayFab({
     *   titleId: 'YOUR_TITLE_ID',
     *   developerSecretKey: 'YOUR_DEV_SECRET_KEY'
     * }).with(loggerMiddleware());
     */
    with(mw: RequestMiddleware) {
      middleware.push(mw);
      return client;
    },

    getAuthInfo(request: any, authKey: AuthType) {
      // Use the most-recently saved authKey, unless one was provided in the request via the AuthenticationContext
      const { header, error } = AuthInfoMap[authKey as keyof typeof AuthInfoMap];
      let defaultAuthValue: string | undefined;
      if (authKey === "EntityToken")
        defaultAuthValue = this.entityToken;
      else if (authKey === "SessionTicket")
        defaultAuthValue = this.sessionTicket;
      else if (authKey === "SecretKey")
        defaultAuthValue = config.developerSecretKey;
      const authValue = request.AuthenticationContext?.[authKey] ?? defaultAuthValue;
      return { header, authValue, error };
    },

    updateAuthContext(currentAuthContext: AuthContext, result: any) {
      let authenticationContextUpdates = {} as AuthContext;
      if (result?.PlayFabId) {
        authenticationContextUpdates.PlayFabId = result.PlayFabId;
      }
      if (result?.SessionTicket) {
        authenticationContextUpdates.SessionTicket = result.SessionTicket;
      }
      if (result?.EntityToken) {
        authenticationContextUpdates.EntityId = result.EntityToken.Entity.Id;
        authenticationContextUpdates.EntityType = result.EntityToken.Entity.Type;
        authenticationContextUpdates.EntityToken = result.EntityToken.EntityToken;
      }
      // Update the authenticationContext with values from the result
      currentAuthContext = Object.assign(
        currentAuthContext,
        authenticationContextUpdates
      );

      authContext = currentAuthContext;

      return currentAuthContext;
    }
  };

  return client;
}