import { describe, it, expect, beforeEach, jest } from "@jest/globals";

import type { PlayfabClient } from "@/core";
import getAuthenticationApi, { GetEntityTokenResponse } from "../src/apis/authentication";
import { createMockPlayfabClient } from "./mocks/core";

let playfab: jest.Mocked<PlayfabClient>;
let authenticationApi: ReturnType<typeof getAuthenticationApi>;

describe("AuthenticationApi", () => {
  beforeEach(() => {
    playfab = createMockPlayfabClient();
    authenticationApi = getAuthenticationApi(playfab);
  });

  describe("when calling getEntityToken", () => {
    it("should store entity token", async () => {
      playfab.request.mockResolvedValueOnce({
        EntityToken: "mock_entity_token",
      } as GetEntityTokenResponse);

      await authenticationApi.getEntityToken({});

      expect(playfab.request).toHaveBeenCalled();
  
      expect(playfab.entityToken).toEqual("mock_entity_token");
    });
  });
});
