import React from "react";
import ReactDOM from "react-dom/client";
import { ReactFlowProvider } from "reactflow";
import { ChakraProvider, ColorModeScript } from "@chakra-ui/react";
import mixpanel from "mixpanel-browser";
import App from "./components/App";
import { theme } from "./theme";
import { FontLoader } from "./components/FontLoader";

// We're moving away from global CSS but keeping critical styles
import "./index.css";

export const MIXPANEL_TOKEN = import.meta.env.VITE_MIXPANEL_TOKEN;

if (MIXPANEL_TOKEN) mixpanel.init(MIXPANEL_TOKEN);

ReactDOM.createRoot(document.getElementById("root") as HTMLElement).render(
  <React.StrictMode>
    <ColorModeScript initialColorMode={theme.config.initialColorMode} />
    <ReactFlowProvider>
      <ChakraProvider theme={theme}>
        <FontLoader />
        <App />
      </ChakraProvider>
    </ReactFlowProvider>
  </React.StrictMode>
);
