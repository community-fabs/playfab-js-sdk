import { jest } from "@jest/globals";
import type { PlayfabClient } from "@/core";

export function createMockPlayfabClient(
  overrides: Partial<PlayfabClient> = {}
): jest.Mocked<PlayfabClient> {
  const request = jest.fn() as jest.MockedFunction<PlayfabClient["request"]>;

  const withFn: jest.MockedFunction<PlayfabClient["with"]> =
    jest.fn();

  const getAuthInfo: jest.MockedFunction<PlayfabClient["getAuthInfo"]> =
    jest.fn();
  getAuthInfo.mockReturnValue({
      header: "X-EntityToken",
      authValue: "mock_entity_token",
      error: "",
    });

  const updateAuthContext: jest.MockedFunction<PlayfabClient["updateAuthContext"]> =
    jest.fn();

  const client = {
    config: {
      titleId: "TEST_TITLE",
      developerSecretKey: "TEST_SECRET",
    },

    sessionTicket: undefined,
    entityToken: undefined,
    authContext: {},

    request,
    with: withFn,
    getAuthInfo,
    updateAuthContext,

    ...overrides
  } as unknown as jest.Mocked<PlayfabClient>;

  client.with.mockImplementation(() => client);

  return client;
}