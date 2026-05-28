import { describe, it, expect, beforeEach } from "@jest/globals";
import createClientClient from "../src/apis/client";
import {
  clearMockFetch,
  mockFetch,
  mockFetchResponse
} from "./fetchUtils";
import { generatePlayFabResponse } from "./utils";
import { initializePlayFab, type PlayfabClient } from "@/common";

mockFetch();

let playfab: PlayfabClient;
let clientApi: ReturnType<typeof createClientClient>;

describe("ClientApi", () => {
  beforeEach(() => {
    clearMockFetch();
    playfab = initializePlayFab({
      titleId: "test_title_id",
      developerSecretKey: "test_secret_key",
    });
    clientApi = createClientClient(playfab);
  });

  it("should store auth context on login", async () => {
    mockFetchResponse(
      generatePlayFabResponse({
        SessionTicket: "mock_session_ticket",
        PlayFabId: "dummy_playfab_id",
        NewlyCreated: false,
        SettingsForUser: {
          NeedsAttribution: false,
          GatherDeviceInfo: true,
          GatherFocusInfo: true,
        },
        EntityToken: {
          EntityToken: "mock_entity_token",
          TokenExpiration: "2025-06-16T22:23:51Z",
          Entity: {
            Id: "dummy_playfab_id",
            Type: "title_player_account",
            TypeString: "title_player_account",
          },
        },
        TreatmentAssignment: {
          Variants: [],
          Variables: [],
        },
      })
    );

    await clientApi.loginWithCustomID({
      CustomId: "test-custom-id",
    });

    expect(fetch).toHaveBeenCalled();

    expect(playfab.entityToken).toEqual("mock_entity_token");
    expect(playfab.sessionTicket).toEqual("mock_session_ticket");
  });
});
