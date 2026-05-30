import { describe, it, expect, beforeEach, jest } from "@jest/globals";

import type { PlayfabClient } from "@/core";
import createClientClient, { LoginResult } from "../src/apis/client";
import { createMockPlayfabClient } from "./mocks/core";

let playfab: jest.Mocked<PlayfabClient>;
let clientApi: ReturnType<typeof createClientClient>;

describe("ClientApi", () => {
  beforeEach(() => {
    playfab = createMockPlayfabClient();
    clientApi = createClientClient(playfab);
  });

  it("should store auth context on login", async () => {
    playfab.request.mockResolvedValueOnce({
      SessionTicket: "mock_session_ticket",
      PlayFabId: "dummy_playfab_id",
      NewlyCreated: false,
      EntityToken: {
        EntityToken: "mock_entity_token",
        TokenExpiration: "2025-06-16T22:23:51Z",
        Entity: {
          Id: "dummy_playfab_id",
          Type: "title_player_account",
          TypeString: "title_player_account",
        },
      }
    });

    await clientApi.loginWithCustomID({
      CustomId: "test-custom-id",
    });

    expect(playfab.request).toHaveBeenCalled();

    expect(playfab.entityToken).toEqual("mock_entity_token");
    expect(playfab.sessionTicket).toEqual("mock_session_ticket");
  });
});
