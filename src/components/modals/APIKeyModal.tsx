import mixpanel from "mixpanel-browser";

import { Modal, ModalOverlay, ModalContent, Link, Text } from "@chakra-ui/react";

import { MIXPANEL_TOKEN } from "../../main";

import { Column } from "../../utils/chakra";
import { isValidAPIKey } from "../../utils/apikey";
import { APIKeyInput } from "../utils/APIKeyInput";

export function APIKeyModal({
  apiKey,
  setApiKey,
}: {
  apiKey: string | null;
  setApiKey: (apiKey: string) => void;
}) {
  const setApiKeyTracked = (apiKey: string) => {
    setApiKey(apiKey);

    if (isValidAPIKey(apiKey)) {
      if (MIXPANEL_TOKEN) mixpanel.track("Entered API Key"); // KPI

      // Hacky way to get the prompt box to focus after the
      // modal closes. Long term should probably use a ref.
      setTimeout(() => window.document.getElementById("promptBox")?.focus(), 50);
    }
  }
}
