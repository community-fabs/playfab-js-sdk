import { describe, it, expect, beforeEach, jest } from "@jest/globals";

import {
  initializePlayFab,
  type PlayfabClient
} from "@/core";

let playfab: PlayfabClient;

describe("Core", () => {
  beforeEach(() => {
    playfab = initializePlayFab({
      titleId: "TEST_TITLE",
      developerSecretKey: "TEST_SECRET",
    });
  });

  describe("getAuthInfo", () => {
    it("returns the correct header for SecretKey auth requests", async () => {
      const { header, authValue } = playfab.getAuthInfo({}, 'SecretKey');

      expect(header).toEqual("X-SecretKey");
      expect(authValue).toEqual("TEST_SECRET");
    });

    it("returns the correct header for EntityToken auth requests", async () => {
      playfab.entityToken = 'TEST_ENTITY_TOKEN';

      const { header, authValue } = playfab.getAuthInfo({}, 'EntityToken');

      expect(header).toEqual("X-EntityToken");
      expect(authValue).toEqual("TEST_ENTITY_TOKEN");
    });

    it("returns the correct header for SessionTicket auth requests", async () => {
      playfab.sessionTicket = 'TEST_SESSION_TICKET';

      const { header, authValue } = playfab.getAuthInfo({}, 'SessionTicket');

      expect(header).toEqual("X-Authorization");
      expect(authValue).toEqual("TEST_SESSION_TICKET");
    });
  });
});