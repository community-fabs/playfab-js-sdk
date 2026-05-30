import { describe, it, expect, beforeEach, jest } from "@jest/globals";

import type { PlayfabClient } from "@/core";
import getClientApi from "../src/apis/client";
import { createMockPlayfabClient } from "./mocks/core";

let playfab: jest.Mocked<PlayfabClient>;
let clientApi: ReturnType<typeof getClientApi>;

describe("ClientApi", () => {
  beforeEach(() => {
    playfab = createMockPlayfabClient();
    clientApi = getClientApi(playfab);
  });

  describe("when logging in", () => {
    beforeEach(async () => {
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
    })

    it("should store auth context", async () => {
      expect(playfab.request).toHaveBeenCalled();
  
      expect(playfab.entityToken).toEqual("mock_entity_token");
      expect(playfab.sessionTicket).toEqual("mock_session_ticket");
    });

    it("isLoggedIn should return true", async () => {
      expect(clientApi.isClientLoggedIn()).toBe(true);
    });
  });
});
