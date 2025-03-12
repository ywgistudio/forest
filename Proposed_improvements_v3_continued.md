## Continuation of Proposed_improvements_v3.md

##### 2.1.1 Complete Theme Architecture (continued)
  2. **Semantic Color Tokens (continued)**:
     ```tsx
     // UPDATED FILE: src/theme/colors.ts (continued)
         warning: '#DD6B20',
         info: '#3182CE',
       },
     };
     ```

  3. **Complete Component Definitions**:
     ```tsx
     // NEW FILE: src/theme/components/tooltip.ts
     export const Tooltip = {
       baseStyle: {
         bg: 'ui.dark',
         color: 'text.primary',
         borderRadius: 'md',
         px: 3,
         py: 2,
       },
     };
     
     // UPDATED FILE: src/theme/components/index.ts
     import { Button } from './button';
     import { Menu } from './menu';
     import { Modal } from './modal';
     import { Tooltip } from './tooltip';
     
     export const components = {
       Button,
       Menu,
       Modal,
       Tooltip,
       // Add all other components...
     };
     ```

- **Effort**: Medium (2 weeks)
- **Dependencies**: None
- **Risk Assessment**: Low
  - **Risks**: Styling inconsistencies, potential visual regressions
  - **Mitigation**: Isolated component testing, theme preview tool
- **Success Metrics**:
  - All hardcoded colors replaced with tokens
  - Component-specific theme files for all Chakra components
  - Consistent styling across light and dark modes

##### 2.1.2 CSS Override Elimination
- **Current State**: Heavy use of global CSS and !important flags
- **Target State**: All styling through Chakra's theming system
- **Detailed Implementation**:

  1. **Audit and Categorize CSS Overrides**:
     - Create a spreadsheet listing all CSS selectors in index.css
     - Categorize by component, purpose, and priority
     - Identify corresponding Chakra components and props

  2. **Progressive Migration Strategy**:
     ```tsx
     // EXAMPLE CONVERSION: src/components/utils/NavigationBar.tsx
     
     // BEFORE:
     // In CSS:
     // .chakra-menu__menulist { background-color: #FFFFFF !important; color: #000000 !important; }
     
     // In component:
     <Menu>
       <MenuButton as={Button} rightIcon={<ChevronDownIcon />}>
         File
       </MenuButton>
       <MenuList width="300px">
         <MenuGroup title="Trees">
           <MenuItem onClick={onNewTree}>New conversation tree</MenuItem>
         </MenuGroup>
       </MenuList>
     </Menu>
     
     // AFTER:
     // In theme/components/menu.ts:
     export const Menu = {
       parts: ['button', 'list', 'item', 'groupTitle'],
       baseStyle: {
         list: {
           bg: 'brand.secondary',
           color: 'text.secondary',
           // Other styles...
         },
         // Other parts...
       },
     };
     
     // In component (unchanged):
     <Menu>
       <MenuButton as={Button} rightIcon={<ChevronDownIcon />}>
         File
       </MenuButton>
       <MenuList width="300px">
         <MenuGroup title="Trees">
           <MenuItem onClick={onNewTree}>New conversation tree</MenuItem>
         </MenuGroup>
       </MenuList>
     </Menu>
     ```

  3. **ReactFlow Specific Styling**:
     ```tsx
     // NEW FILE: src/components/features/NodeGraph/styles.ts
     import { css } from '@emotion/react';
     import { useColorModeValue } from '@chakra-ui/react';
     
     export const useReactFlowStyles = () => {
       const bgColor = useColorModeValue('white', 'brand.primary');
       const controlsBg = useColorModeValue('gray.100', 'ui.dark');
       const controlsBorder = useColorModeValue('gray.200', 'ui.medium');
       const controlsColor = useColorModeValue('gray.800', 'text.primary');
       
       return {
         containerStyles: {
           backgroundColor: bgColor,
         },
         additionalStyles: css`
           .react-flow__node {
             border-radius: 6px;
             border-width: 0px;
           }
           
           .react-flow__node:not(.selected):hover {
             box-shadow: 0 0 0 0.5px ${useColorModeValue('#AAAAAA', '#DDDDDD')};
           }
           
           .react-flow__controls {
             background-color: ${controlsBg};
             border-color: ${controlsBorder};
           }
           
           .react-flow__controls button {
             background-color: ${controlsBg};
             color: ${controlsColor};
             border-color: ${controlsBorder};
           }
           
           .selected {
             box-shadow: 0px 0px 0px 2px #CCCCCC, 0px 0px 20px 2px #AAAAAA;
           }
         `,
       };
     };
     ```

  4. **Global CSS Cleanup**:
     ```tsx
     // UPDATED FILE: src/index.css
     /* 
     This file is being phased out as we move to Chakra UI theming.
     Only remaining styles are for external libraries that cannot be themed directly.
     */
     
     /* Font definitions - will be moved to the FontLoader component */
     @font-face {
       font-family: 'Antique Legacy';
       src: url('/AntiqueLegacy-Regular.woff') format('woff'),
            url('/AntiqueLegacy-Regular.otf') format('opentype');
       font-weight: normal;
       font-style: normal;
     }
     ```

- **Effort**: Large (3-4 weeks)
- **Dependencies**: Complete theme architecture (2.1.1)
- **Risk Assessment**: Medium
  - **Risks**: Visual regressions, missed style overrides
  - **Mitigation**: Phased approach, comprehensive visual testing
- **Success Metrics**:
  - Zero !important flags in codebase
  - All component styling through Chakra theme or component props
  - Minimal global CSS (only for font definitions and third-party libraries)

#### 2.2 Menu and Dialog Improvements

##### 2.2.1 Menu Accessibility and Styling
- **Current State**: Legibility issues in dropdown menus
- **Target State**: Accessible, properly themed menus
- **Detailed Implementation**:

  1. **Menu Component Theme**:
     ```tsx
     // UPDATED FILE: src/theme/components/menu.ts
     export const Menu = {
       parts: ['button', 'list', 'item', 'groupTitle', 'command', 'divider'],
       baseStyle: (props: any) => ({
         button: {
           fontWeight: 'medium',
         },
         list: {
           bg: props.colorMode === 'dark' ? 'ui.dark' : 'white',
           color: props.colorMode === 'dark' ? 'text.primary' : 'text.secondary',
           border: '1px solid',
           borderColor: props.colorMode === 'dark' ? 'ui.medium' : 'ui.light',
           boxShadow: 'md',
           p: 2,
           zIndex: 10,
         },
         item: {
           bg: 'transparent',
           _hover: {
             bg: props.colorMode === 'dark' ? 'whiteAlpha.200' : 'blackAlpha.100',
           },
           _focus: {
             bg: props.colorMode === 'dark' ? 'whiteAlpha.200' : 'blackAlpha.100',
           },
           _active: {
             bg: props.colorMode === 'dark' ? 'whiteAlpha.300' : 'blackAlpha.200',
           },
           color: props.colorMode === 'dark' ? 'text.primary' : 'text.secondary',
         },
         groupTitle: {
           fontWeight: 'bold',
           fontSize: 'sm',
           color: props.colorMode === 'dark' ? 'text.primary' : 'text.secondary',
         },
         command: {
           color: props.colorMode === 'dark' ? 'whiteAlpha.700' : 'blackAlpha.700',
           fontFamily: 'mono',
         },
         divider: {
           borderColor: props.colorMode === 'dark' ? 'ui.medium' : 'ui.light',
           my: 2,
         },
       }),
     };
     ```

  2. **Menu Component Updates**:
     ```tsx
     // EXAMPLE UPDATED: src/components/utils/NavigationBar.tsx
     import { useColorModeValue } from '@chakra-ui/react';
     
     export function NavigationBar({ /* props... */ }) {
       // Other code...
       
       const menuBg = useColorModeValue('white', 'ui.dark');
       const menuItemHoverBg = useColorModeValue('gray.100', 'whiteAlpha.200');
       
       return (
         <Row /* other props... */>
           <Menu>
             <MenuButton
               as={Button}
               rightIcon={<ChevronDownIcon />}
               variant="ghost"
               aria-label="File menu"
             >
               File
             </MenuButton>
             <MenuList
               width="300px"
               data-testid="file-menu"
               aria-label="File options"
             >
               <MenuGroup title="Trees">
                 <MenuItem
                   command={`⇧${modifierKeyText}P`}
                   onClick={newUserNodeLinkedToANewSystemNode}
                   data-testid="new-tree-option"
                 >
                   New conversation tree
                 </MenuItem>
               </MenuGroup>
               {/* Other menu items... */}
             </MenuList>
           </Menu>
           {/* Other menus... */}
         </Row>
       );
     }
     ```

- **Effort**: Small (1 week)
- **Dependencies**: CSS override elimination (2.1.2) 
- **Risk Assessment**: Low
  - **Risks**: Menu behavior inconsistencies across browsers
  - **Mitigation**: Cross-browser testing, accessibility validation
- **Success Metrics**:
  - Menu text passing WCAG AA contrast requirements
  - Keyboard navigation working for all menus
  - Screen reader compatibility

##### 2.2.2 Modal Dialog Improvements
- **Current State**: Basic modal implementation
- **Target State**: Enhanced modals with proper keyboard and focus management
- **Detailed Implementation**:

  1. **Modal Component Theme**:
     ```tsx
     // UPDATED FILE: src/theme/components/modal.ts
     export const Modal = {
       parts: ['overlay', 'dialog', 'header', 'closeButton', 'body', 'footer'],
       baseStyle: (props: any) => ({
         overlay: {
           bg: 'blackAlpha.600',
           backdropFilter: 'blur(2px)',
         },
         dialog: {
           bg: props.colorMode === 'dark' ? 'ui.dark' : 'white',
           color: props.colorMode === 'dark' ? 'text.primary' : 'text.secondary',
           borderColor: props.colorMode === 'dark' ? 'ui.medium' : 'ui.light',
           borderWidth: '1px',
           borderRadius: 'md',
           boxShadow: 'xl',
         },
         header: {
           fontWeight: 'bold',
           fontSize: 'lg',
           pb: 2,
         },
         closeButton: {
           top: 3,
           right: 3,
         },
         body: {
           py: 2,
         },
         footer: {
           pt: 2,
         },
       }),
     };
     ```

  2. **Modal Component Refactoring**:
     ```tsx
     // EXAMPLE UPDATED: src/components/modals/APIKeyModal.tsx
     import React, { useState, useRef, useEffect } from 'react';
     import {
       Modal,
       ModalOverlay,
       ModalContent,
       ModalHeader,
       ModalFooter,
       ModalBody,
       ModalCloseButton,
       Button,
       Text,
       useDisclosure,
       FocusLock,
     } from '@chakra-ui/react';
     import { isValidAPIKey } from '../../utils/apikey';
     import { APIKeyInput } from '../utils/APIKeyInput';
     
     export function APIKeyModal({ apiKey, setApiKey }) {
       const { isOpen, onClose } = useDisclosure({ defaultIsOpen: !isValidAPIKey(apiKey) });
       const [key, setKey] = useState(apiKey || '');
       const initialFocusRef = useRef(null);
       
       const handleSave = () => {
         setApiKey(key);
         onClose();
       };
       
       const handleKeyPress = (e: React.KeyboardEvent) => {
         if (e.key === 'Enter' && isValidAPIKey(key)) {
           handleSave();
         }
       };
       
       return (
         <Modal
           isOpen={isOpen}
           onClose={onClose}
           closeOnOverlayClick={false}
           closeOnEsc={false}
           initialFocusRef={initialFocusRef}
           isCentered
           size="md"
           aria-labelledby="api-key-modal-title"
         >
           <ModalOverlay />
           <FocusLock>
             <ModalContent>
               <ModalHeader id="api-key-modal-title">OpenRouter API Key</ModalHeader>
               <ModalBody>
                 <Text mb={4}>
                   Enter your OpenRouter API key to get started:
                 </Text>
                 <APIKeyInput
                   value={key}
                   onChange={setKey}
                   onKeyPress={handleKeyPress}
                   ref={initialFocusRef}
                   aria-describedby="api-key-help"
                 />
                 <Text id="api-key-help" fontSize="sm" mt={2}>
                   You can get an API key at{' '}
                   <Button
                     as="a"
                     href="https://openrouter.ai/keys"
                     target="_blank"
                     variant="link"
                     colorScheme="blue"
                     size="sm"
                   >
                     openrouter.ai/keys
                   </Button>
                 </Text>
               </ModalBody>
               <ModalFooter>
                 <Button
                   colorScheme="blue"
                   onClick={handleSave}
                   isDisabled={!isValidAPIKey(key)}
                 >
                   Save
                 </Button>
               </ModalFooter>
             </ModalContent>
           </FocusLock>
         </Modal>
       );
     }
     ```

- **Effort**: Small (1 week)
- **Dependencies**: CSS override elimination (2.1.2)
- **Risk Assessment**: Low
  - **Risks**: Focus management edge cases in complex modals
  - **Mitigation**: Accessibility testing, comprehensive keyboard interaction testing
- **Success Metrics**:
  - All modals properly manage focus
  - Keyboard trap within modals when open
  - ARIA attributes properly implemented

### 3. TypeScript and Type Safety Enhancements

#### 3.1 Type Definition Improvements

##### 3.1.1 Core Data Types
- **Current State**: Incomplete or missing type definitions
- **Target State**: Comprehensive type coverage for all data structures
- **Detailed Implementation**:

  1. **FluxNode Type Refinement**:
     ```tsx
     // UPDATED FILE: src/utils/types.ts
     import { Node, Edge, NodeProps, EdgeProps } from 'reactflow';
     
     export enum FluxNodeType {
       User = 'User',
       System = 'System',
       GPT = 'GPT',
       TweakedGPT = 'TweakedGPT',
     }
     
     export interface FluxNodeData {
       fluxNodeType: FluxNodeType;
       text: string;
       label?: string;
       hasCustomlabel?: boolean;
       streamId?: string;
     }
     
     export type FluxNode = Node<FluxNodeData>;
     export type FluxEdge = Edge;
     
     export interface FluxNodeProps extends NodeProps<FluxNodeData> {}
     export interface FluxEdgeProps extends EdgeProps {}
     
     export interface NodeModification {
       id: string;
       text?: string;
       label?: string;
       hasCustomlabel?: boolean;
       streamId?: string;
       fluxNodeType?: FluxNodeType;
     }
     
     export interface NodeCreationParams {
       id?: string;
       x: number;
       y: number;
       fluxNodeType: FluxNodeType;
       text: string;
       streamId?: string;
     }
     
     export interface FluxNodeLineage {
       node: FluxNode;
       parent?: FluxNode;
       children: FluxNode[];
       siblings: FluxNode[];
     }
     
     // Other type definitions...
     ```

  2. **API Types**:
     ```tsx
     // NEW FILE: src/api/types.ts
     export interface ChatMessage {
       role: 'system' | 'user' | 'assistant';
       content: string;
     }
     
     export interface ChatCompletionRequest {
       model: string;
       messages: ChatMessage[];
       temperature?: number;
       top_p?: number;
       n?: number;
       stream?: boolean;
       stop?: string | string[];
       max_tokens?: number;
       presence_penalty?: number;
       frequency_penalty?: number;
       logit_bias?: Record<string, number>;
       user?: string;
     }
     
     export interface CompletionRequest {
       model: string;
       prompt: string;
       temperature?: number;
       top_p?: number;
       n?: number;
       stream?: boolean;
       stop?: string | string[];
       max_tokens?: number;
       presence_penalty?: number;
       frequency_penalty?: number;
       logit_bias?: Record<string, number>;
       user?: string;
     }
     
     export interface ChatCompletionChoice {
       index: number;
       message: ChatMessage;
       finish_reason: string | null;
     }
     
     export interface ChatCompletionChunk {
       id: string;
       object: string;
       created: number;
       model: string;
       choices: {
         index: number;
         delta: Partial<ChatMessage>;
         finish_reason: string | null;
       }[];
     }
     
     export interface CompletionChoice {
       text: string;
       index: number;
       logprobs: any;
       finish_reason: string | null;
     }
     
     export interface CompletionChunk {
       id: string;
       object: string;
       created: number;
       model: string;
       choices: CompletionChoice[];
     }
     
     // Other API-related types...
     ```

- **Effort**: Medium (2 weeks)
- **Dependencies**: None
- **Risk Assessment**: Low
  - **Risks**: Type compatibility with external libraries
  - **Mitigation**: Incremental implementation, type guard fallbacks
- **Success Metrics**:
  - No any types in core data structures
  - Improved TypeScript autocompletion
  - Reduced type errors

##### 3.1.2 React Component Props
- **Current State**: Inconsistent prop types with some inline definitions
- **Target State**: Clear prop interfaces for all components
- **Detailed Implementation**:

  1. **Component Prop Interfaces**:
     ```tsx
     // EXAMPLE: src/components/utils/BigButton.tsx
     
     // BEFORE:
     export function BigButton({
       color,
       tooltip,
       ...others
     }: { color: string; tooltip: string } & ButtonProps) {
       // Component implementation...
     }
     
     // AFTER:
     interface BigButtonProps {
       color: string;
       tooltip: string;
       onClick?: () => void;
       children: React.ReactNode;
       width?: string | number;
       height?: string | number;
       fontSize?: string;
       disabled?: boolean;
       isLoading?: boolean;
     }
     
     export const BigButton = forwardRef<HTMLButtonElement, BigButtonProps>(
       ({ color, tooltip, children, ...rest }, ref) => {
         // Component implementation...
       }
     );
     
     BigButton.displayName = 'BigButton';
     ```

  2. **Properly Typed Function Components**:
     ```tsx
     // EXAMPLE: src/components/utils/NavigationBar.tsx
     
     interface NavigationBarProps {
       newUserNodeLinkedToANewSystemNode: () => void;
       newConnectedToSelectedNode: (nodeType: FluxNodeType) => void;
       submitPrompt: () => void;
       regenerate: () => void;
       completeNextWords: () => void;
       deleteSelectedNodes: () => void;
       undo: () => void;
       redo: () => void;
       onClear: () => void;
       copyMessagesToClipboard: () => void;
       showRenameInput: () => void;
       moveToParent: () => void;
       moveToChild: () => void;
       moveToLeftSibling: () => void;
       moveToRightSibling: () => void;
       autoZoom: () => void;
       onOpenSettingsModal: () => void;
     }
     
     export const NavigationBar: React.FC<NavigationBarProps> = ({
       newUserNodeLinkedToANewSystemNode,
       newConnectedToSelectedNode,
       // Other props...
     }) => {
       // Component implementation...
     };
     ```

- **Effort**: Medium (2 weeks)
- **Dependencies**: Core data types (3.1.1)
- **Risk Assessment**: Low
  - **Risks**: Over-typing of simple components
  - **Mitigation**: Start with core components, pragmatic typing approach
- **Success Metrics**:
  - All components have explicit prop interfaces
  - Better prop autocompletion
  - Improved component documentation

#### 3.2 Type Safety Enhancements

##### 3.2.1 TSConfig Improvements
- **Current State**: Basic TypeScript configuration
- **Target State**: Stricter type checking
- **Detailed Implementation**:

  1. **Enhanced TSConfig**:
     ```json
     // UPDATED FILE: tsconfig.json
     {
       "compilerOptions": {
         "target": "ESNext",
         "useDefineForClassFields": true,
         "lib": ["DOM", "DOM.Iterable", "ESNext"],
         "allowJs": false,
         "skipLibCheck": true,
         "esModuleInterop": false,
         "allowSyntheticDefaultImports": true,
         "strict": true,
         "forceConsistentCasingInFileNames": true,
         "module": "ESNext",
         "moduleResolution": "Node",
         "resolveJsonModule": true,
         "isolatedModules": true,
         "noEmit": true,
         "jsx": "react-jsx",
         "noImplicitAny": true,
         "noImplicitThis": true,
         "strictNullChecks": true,
         "strictFunctionTypes": true,
         "strictBindCallApply": true,
         "noFallthroughCasesInSwitch": true,
         "noImplicitReturns": true,
         "noUncheckedIndexedAccess": true,
         "noPropertyAccessFromIndexSignature": true
       },
       "include": ["src"],
       "references": [{ "path": "./tsconfig.node.json" }]
     }
     ```

  2. **ESLint TypeScript Rules**:
     ```json
     // NEW FILE: .eslintrc
     {
       "extends": [
         "eslint:recommended",
         "plugin:react/recommended",
         "plugin:react-hooks/recommended",
         "plugin:@typescript-eslint/recommended",
         "plugin:@typescript-eslint/recommended-requiring-type-checking"
       ],
       "parser": "@typescript-eslint/parser",
       "parserOptions": {
         "ecmaFeatures": {
           "jsx": true
         },
         "ecmaVersion": 2020,
         "sourceType": "module",
         "project": "./tsconfig.json"
       },
       "plugins": ["react", "react-hooks", "@typescript-eslint"],
       "rules": {
         "@typescript-eslint/explicit-function-return-type": ["warn", {
           "allowExpressions": true,
           "allowTypedFunctionExpressions": true
         }],
         "@typescript-eslint/no-explicit-any": "warn",
         "@typescript-eslint/no-unnecessary-type-assertion": "error",
         "@typescript-eslint/no-unsafe-assignment": "warn",
         "@typescript-eslint/no-unsafe-call": "warn",
         "@typescript-eslint/no-unsafe-member-access": "warn",
         "@typescript-eslint/no-unsafe-return": "warn",
         "react-hooks/rules-of-hooks": "error",
         "react-hooks/exhaustive-deps": "warn"
       },
       "settings": {
         "react": {
           "version": "detect"
         }
       }
     }
     ```

- **Effort**: Small (1 week)
- **Dependencies**: None
- **Risk Assessment**: Medium
  - **Risks**: Breaking changes with stricter settings
  - **Mitigation**: Incremental enablement, starting with least disruptive
- **Success Metrics**:
  - Improved type inference
  - Early detection of null/undefined errors
  - Better static analysis capabilities

##### 3.2.2 Runtime Type Checking
- **Current State**: Limited runtime validation
- **Target State**: Strategic runtime checks for critical paths
- **Detailed Implementation**:

  1. **Type Validation Utilities**:
     ```tsx
     // NEW FILE: src/utils/validation.ts
     
     export const isFluxNodeData = (data: unknown): data is FluxNodeData => {
       return (
         typeof data === 'object' &&
         data !== null &&
         'fluxNodeType' in data &&
         'text' in data &&
         typeof data.text === 'string' &&
         Object.values(FluxNodeType).includes(data.fluxNodeType as FluxNodeType)
       );
     };
     
     export const isValidChatMessage = (message: unknown): message is ChatMessage => {
       return (
         typeof message === 'object' &&
         message !== null &&
         'role' in message &&
         'content' in message &&
         typeof message.content === 'string' &&
         ['system', 'user', 'assistant'].includes(
           (message as { role: string }).role
         )
       );
     };
     
     // Other type guards...
     ```

  2. **API Response Validation**:
     ```tsx
     // UPDATED FILE: src/utils/openrouter.ts
     
     import { isValidChatMessage } from './validation';
     
     // Example validation in API interaction
     export async function* processChatStream(
       stream: ReadableStream,
       abortController: AbortController
     ): AsyncGenerator<ChatCompletionChunk> {
       const reader = stream.getReader();
       const decoder = new TextDecoder('utf-8');
       
       try {
         while (true) {
           const { done, value } = await reader.read();
           
           if (done || abortController.signal.aborted) {
             break;
           }
           
           const chunk = decoder.decode(value);
           const lines = chunk
             .split('\n')
             .filter((line) => line.startsWith('data: ') && line !== 'data: [DONE]')
             .map((line) => JSON.parse(line.slice(6)));
           
           for (const parsed of lines) {
             // Validate the structure
             if (
               !parsed ||
               !parsed.choices ||
               !Array.isArray(parsed.choices) ||
               parsed.choices.length === 0
             ) {
               console.warn('Invalid chunk format', parsed);
               continue;
             }
             
             // Validate the content
             const choice = parsed.choices[0];
             if (
               choice.delta &&
               typeof choice.delta === 'object' &&
               'content' in choice.delta &&
               typeof choice.delta.content === 'string'
             ) {
               yield parsed as ChatCompletionChunk;
             } else {
               console.warn('Invalid choice format', choice);
             }
           }
         }
       } finally {
         reader.releaseLock();
       }
     }
     ```

- **Effort**: Medium (2 weeks)
- **Dependencies**: Core data types (3.1.1)
- **Risk Assessment**: Low
  - **Risks**: Performance impact from excessive validation
  - **Mitigation**: Strategic placement in critical paths only
- **Success Metrics**:
  - Robust error handling for unexpected data
  - Clearer error messages for API issues
  - Fewer runtime type errors

### 4. Performance Optimization

#### 4.1 Rendering Efficiency

##### 4.1.1 Component Memoization
- **Current State**: Limited use of memoization
- **Target State**: Strategic memoization for performance-critical components
- **Detailed Implementation**:

  1. **Memoized Node Components**:
     ```tsx
     // NEW FILE: src/components/nodes/FluxNode.tsx
     import React, { memo } from 'react';
     import { Handle, Position } from 'reactflow';
     import { Box, Text } from '@chakra-ui/react';
     import { FluxNodeProps } from '../../utils/types';
     
     const FluxNodeComponent: React.FC<FluxNodeProps> = ({ 
       data, 
       isConnectable,
       selected,
     }) => {
       return (
         <>
           <Handle
             type="target"
             position={Position.Top}
             isConnectable={isConnectable}
           />
           <Box
             p={3}
             border="1px solid"
             borderColor={selected ? 'node.selected.border' : 'transparent'}
             boxShadow={selected ? '0 0 10px' : 'md'}
             borderRadius="md"
             maxWidth="200px"
           >
             <Text fontWeight="bold" fontSize="sm" mb={1}>
               {data.label || data.fluxNodeType}
             </Text>
             <Text fontSize="xs" noOfLines={3}>
               {data.text || ''}
             </Text>
           </Box>
           <Handle
             type="source"
             position={Position.Bottom}
             isConnectable={isConnectable}
           />
         </>
       );
     };
     
     export const FluxNodeDisplay = memo(FluxNodeComponent, (prev, next) => {
       // Custom comparison logic to reduce unnecessary re-renders
       return (
         prev.data.text === next.data.text &&
         prev.data.label === next.data.label &&
         prev.selected === next.selected &&
         prev.data.streamId === next.data.streamId
       );
     });
     ```

  2. **UseCallback for Event Handlers**:
     ```tsx
     // EXAMPLE IMPLEMENTATION: src/hooks/useNodeManagement.ts
     
     export const useNodeManagement = () => {
       // State...
       
       const selectNode = useCallback((id: string) => {
         setLastSelectedNodeId(selectedNodeId);
         setSelectedNodeId(id);
         setNodes((nodes) => markOnlyNodeAsSelected(nodes, id));
       }, [selectedNodeId, setNodes]);
       
       const updateNodeText = useCallback((id:
