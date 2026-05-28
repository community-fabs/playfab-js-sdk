export interface IPlayFabRequestCommon {}
export interface IPlayFabError {
  code: number;
  status: string;
  error: string;
  errorCode: number;
  errorMessage: string;
  errorDetails?: Record<string, string[]>;
  request?: any;
  retryAfterSeconds?: number;
}

export interface IPlayFabResultCommon extends IPlayFabError {}

export interface EmptyResponse extends IPlayFabResultCommon {}
