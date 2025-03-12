# Forest (formerly Flux) Update Plan

This document outlines the changes required to transform the application from "Flux" to "Forest" - a conversation tree tool with LLM integration. Most changes have already been implemented, but this plan documents all updates for completeness.

## 1. Branding Changes ✅

### App Name Change
- ✅ Changed project name in package.json from "flux" to "forest"
- ✅ Updated all page titles and metadata in index.html to "Forest"
- ✅ Changed UI branding in NavigationBar.tsx from "Flux by [photos]" to "Forest by YWGI"

### Storage Keys
- ✅ Updated all localStorage keys in constants.ts to use "FOREST_" prefix:
  - `API_KEY_LOCAL_STORAGE_KEY = "FOREST_OPENROUTER_API_KEY"`
  - `REACT_FLOW_LOCAL_STORAGE_KEY = "FOREST_REACT_FLOW_DATA"`
  - `MODEL_SETTINGS_LOCAL_STORAGE_KEY = "FOREST_MODEL_SETTINGS"`
  - `SAVED_CHAT_SIZE_LOCAL_STORAGE_KEY = "FOREST_SAVED_CHAT_SIZE"`

## 2. Theme Changes ✅

### Color Scheme
- ✅ Updated index.css to use a dark theme with black background and monochrome UI
- ✅ Modified color values to use grayscale (black, white, grays)
- ✅ Updated component styles for Chakra UI to match the monochrome theme

### UI Components
- ✅ Updated ReactFlow node and control styling to match the monochrome theme
- ✅ Set appropriate text colors and border colors for all UI elements

## 3. Font Integration ✅

- ✅ Added Antique Legacy font files to the project:
  - AntiqueLegacy-Regular.otf
  - AntiqueLegacy-Regular.woff
- ✅ Configured font-face definition in index.css
- ✅ Set Antique Legacy as the default font for all text

## 4. API Integration ✅

### OpenRouter API
- ✅ Updated API endpoint in App.tsx to use OpenRouter API (https://openrouter.ai/api/v1)
- ✅ Added required headers for OpenRouter:
  - "HTTP-Referer": window.location.href
  - "X-Title": "Forest"
- ✅ Modified models.ts to fetch models from OpenRouter API with additional headers and error handling
- ✅ Updated model selection in constants.ts to use anthropic/claude-3.7-sonnet by default
- ✅ Replaced OpenAI-streams library with custom implementation in openrouter.ts:
  - Added proper streaming support to handle SSE format
  - Implemented format adapters to make OpenRouter responses match expected UI format
  - Added buffering and improved error handling
  - Ensured 'stream: true' parameter is correctly set for all API calls

### OpenRouter-specific Error Handling
- ✅ Enhanced error handling in App.tsx for OpenRouter-specific error messages
- ✅ Updated error message text to reference OpenRouter for clarity

## 5. UI Text Updates ✅

- ✅ Changed button text from "Generate GPT-4 Response" to "Generate Response"
- ✅ Updated various UI text elements to be model-agnostic

## 6. Code Organization and Cleanup

- ✅ Updated internal references from flux to forest where appropriate
- ✅ Maintained compatibility with existing user data
- ✅ Preserved core functionality while updating branding and API integration

## Testing Plan

1. **API Integration Testing**:
   - Test OpenRouter API key validation
   - Verify model listing from OpenRouter
   - Test error handling for invalid API keys and other failures
   - Confirm streaming responses work correctly

2. **Visual Verification**:
   - Verify black background and monochrome UI
   - Check font rendering across all components
   - Inspect UI elements for consistent styling

3. **Functional Testing**:
   - Create new conversation trees
   - Generate responses using OpenRouter
   - Test navigation, editing, and undo/redo functionality
   - Verify localStorage persistence

## Next Steps

The majority of changes have been implemented successfully. The application has been rebranded from "Flux" to "Forest" with a dark monochrome theme.

### Streaming Implementation
- ✅ Created custom streaming implementation that properly handles chunked SSE responses
- ✅ Added data buffering to ensure complete JSON objects are parsed
- ✅ Implemented response format adapter to convert various model outputs to a consistent format
- ✅ Added debug logging to help troubleshoot any potential issues with different models

Going forward, consider:

1. Adding more robust error handling for OpenRouter API responses
2. Improving the TypeScript compatibility between OpenAI-streams and OpenRouter
3. Adding additional OpenRouter-specific features like model fallbacks
4. Creating documentation specific to Forest's integration with OpenRouter

The application is ready for use with its new branding and API integration.
