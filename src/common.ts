import constants, {
  AuthInfoMap, 
  type AuthType,
  type PlayfabConfig,
  type PlayfabState,
} from "./constants";
import {
  compose,
  type Middleware,
  type RequestContext
} from "./middleware";

export type AuthContext = {
  PlayFabId?: string;
  EntityId?: string;
  EntityType?: string;
  SessionTicket?: string;
  EntityToken?: string;
};

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

  use(mw: Middleware): PlayfabClient;

  getAuthInfo(request: any, authKey: AuthType): {
    header: string;
    authValue: string | undefined;
    error: string;
  };

  updateAuthContext(currentAuthContext: AuthContext, result: any): AuthContext;
}

export function initializePlayFab(config: PlayfabConfig): PlayfabClient {
  const middleware: Middleware[] = [];

  const baseUrl =
    `https://${config.titleId}.playfabapi.com`;

  // const state: PlayfabState = {};

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

      if (!result.response.ok) {
        throw new Error(`HTTP ${result.response.status}`);
      }

      return result.data.data as T;
    },

    use(mw: Middleware) {
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