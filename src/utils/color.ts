import { FluxNodeType } from "./types";

export function adjustColor(color: string, amount: number) {
  return (
    "#" +
    color
      .replace(/^#/, "")
      .replace(/../g, (color) =>
        (
          "0" + Math.min(255, Math.max(0, parseInt(color, 16) + amount)).toString(16)
        ).substr(-2)
      )
  );
}

export function getFluxNodeTypeColor(fluxNodeType: FluxNodeType) {
  switch (fluxNodeType) {
    case FluxNodeType.User:
      return "#222222";  // Very dark gray for user messages
    case FluxNodeType.GPT:
      return "#111111";  // Almost black for AI responses
    case FluxNodeType.TweakedGPT:
      return "#181818";  // Dark gray for edited AI responses
    case FluxNodeType.System:
      return "#000000";  // Black for system messages
  }
}

export function getFluxNodeTypeDarkColor(fluxNodeType: FluxNodeType) {
  switch (fluxNodeType) {
    case FluxNodeType.User:
      return "#FFFFFF";  // White for user labels/borders
    case FluxNodeType.GPT:
      return "#CCCCCC";  // Light gray for AI labels/borders
    case FluxNodeType.TweakedGPT:
      return "#AAAAAA";  // Medium gray for edited AI labels/borders
    case FluxNodeType.System:
      return "#888888";  // Darker gray for system labels/borders
  }
}
