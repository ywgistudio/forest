# Forest App Improvement Plan: The Ultimate Guide

## Executive Summary

This comprehensive document details an enterprise-grade improvement plan for the Forest application. The plan combines technical architecture enhancements with UX improvements and new features, informed by deep analysis of the current codebase. Each improvement includes detailed implementation guidance, effort estimates, dependencies, risk assessments, and success metrics.

---

## Current State Analysis

### Technical Architecture Assessment

#### Component Structure Issues
- **Monolithic App.tsx (High Severity)**
  - 1000+ lines of code with mixed responsibilities
  - Contains UI rendering, state management, API integration, and event handling
  - Difficult to maintain, test, or extend
  - Example problematic section: Lines 84-321 blend node management with UI rendering

#### State Management Deficiencies
- **Scattered State Management (High Severity)**
  - 28+ useState hooks in App.tsx alone
  - Complex state dependencies managed manually
  - No centralized state model or data flow patterns
  - Observable in submitPrompt(), where state updates are cascaded manually

#### Style System Fragmentation
- **CSS Override Anti-patterns (Medium Severity)**
  - Frequent use of `!important` flags (32 instances in index.css)
  - Chakra UI theming capabilities underutilized
  - Direct style manipulation in component code
  - Component-specific styles mixed with global styles

#### Type Safety Gaps
- **TypeScript Implementation Issues (Medium Severity)**
  - Multiple "union type too complex to represent" errors
  - `any` types used in critical paths (25+ instances)
  - Missing interfaces for core data structures
  - Incomplete type coverage for external libraries

#### Performance Bottlenecks
- **Inefficient Rendering Patterns (Medium Severity)**
  - Missing memoization in pure components
  - Unnecessary re-renders during streaming
  - No virtualization for large node graphs
  - Unoptimized localStorage usage for conversation history

#### Testing Coverage Gaps
- **Limited Automated Testing (High Severity)**
  - No unit, integration, or E2E tests identified
  - Manual testing burden for core functionality
  - No test infrastructure or patterns established

### User Experience Assessment

#### Feedback System Limitations
- **Inconsistent User Feedback (Medium Severity)**
  - Limited toast notifications (primarily for errors)
  - Unclear success states for operations
  - Limited visual feedback during streaming
  - No loading states for network operations

#### Accessibility Concerns
- **Accessibility Implementation Gaps (High Severity)**
  - Missing ARIA attributes on interactive elements
  - Keyboard navigation not fully implemented
  - Focus management issues in modals and menus
  - Potential contrast issues in menu text

#### Mobile Experience Deficiencies
- **Limited Mobile Support (Low Severity)**
  - Interface not optimized for small screens
  - Touch interactions not fully supported
  - No responsive design patterns for core components

---

## Detailed Improvement Specifications

### 1. Architecture Modernization

#### 1.1 Component Decomposition

##### 1.1.1 App.tsx Refactoring
- **Current State**: 1000+ line monolithic component with mixed concerns
- **Target State**: Modular component architecture with clear separation of concerns
- **Detailed Implementation**:
  
  1. **Extract Feature Components**:
     ```tsx
     // NEW FILE: src/components/features/NodeGraph.tsx
     import React from 'react';
     import ReactFlow, { ... } from 'reactflow';
     
     interface NodeGraphProps {
       nodes: Node<FluxNodeData>[];
       edges: Edge[];
       onNodesChange: OnNodesChange;
       onEdgesChange: OnEdgesChange;
       onConnect: OnConnect;
       onNodeClick: (event: React.MouseEvent, node: Node) => void;
       // Other props...
     }
     
     export const NodeGraph: React.FC<NodeGraphProps> = ({
       nodes,
       edges,
       onNodesChange,
       onEdgesChange,
       onConnect,
       onNodeClick,
       // Other props...
     }) => {
       return (
         <ReactFlow
           nodes={nodes}
           edges={edges}
           onNodesChange={onNodesChange}
           onEdgesChange={onEdgesChange}
           onConnect={onConnect}
           onNodeClick={onNodeClick}
           // Other props...
         >
           <Background />
           {/* Other components */}
         </ReactFlow>
       );
     };
     ```
     
     ```tsx
     // NEW FILE: src/components/features/ChatPanel.tsx
     import React from 'react';
     import { Box } from '@chakra-ui/react';
     import { Prompt } from '../Prompt';
     
     interface ChatPanelProps {
       lineage: Node<FluxNodeData>[];
       onType: (text: string) => void;
       submitPrompt: () => void;
       // Other props...
     }
     
     export const ChatPanel: React.FC<ChatPanelProps> = ({
       lineage,
       onType,
       submitPrompt,
       // Other props...
     }) => {
       return (
         <Box height="100%" width="100%" overflowY="scroll" p={4}>
           {lineage.length >= 1 ? (
             <Prompt
               lineage={lineage}
               onType={onType}
               submitPrompt={submitPrompt}
               // Other props...
             />
           ) : (
             <EmptyState />
           )}
         </Box>
       );
     };
     ```
  
  2. **Create Container Components**:
     ```tsx
     // NEW FILE: src/components/layout/MainLayout.tsx
     import React from 'react';
     import { Column, Row } from '../../utils/chakra';
     import { Resizable } from 're-resizable';
     
     interface MainLayoutProps {
       leftPanel: React.ReactNode;
       rightPanel: React.ReactNode;
       defaultSize?: { width: string; height: string };
       onResize?: (ref: HTMLElement) => void;
     }
     
     export const MainLayout: React.FC<MainLayoutProps> = ({
       leftPanel,
       rightPanel,
       defaultSize = { width: '50%', height: 'auto' },
       onResize,
     }) => {
       return (
         <Row mainAxisAlignment="flex-start" crossAxisAlignment="stretch" expand>
           <Resizable
             maxWidth="75%"
             minWidth="15%"
             defaultSize={defaultSize}
             enable={{
               top: false,
               right: true,
               bottom: false,
               left: false,
               topRight: false,
               bottomRight: false,
               bottomLeft: false,
               topLeft: false,
             }}
             onResizeStop={(_, __, ref) => {
               if (onResize) onResize(ref);
             }}
           >
             {leftPanel}
           </Resizable>
           {rightPanel}
         </Row>
       );
     };
     ```

  3. **Refactor App.tsx**:
     ```tsx
     // UPDATED FILE: src/components/App.tsx
     import React from 'react';
     import { MainLayout } from './layout/MainLayout';
     import { NodeGraph } from './features/NodeGraph';
     import { ChatPanel } from './features/ChatPanel';
     import { useNodeManagement } from '../hooks/useNodeManagement';
     import { useSettings } from '../hooks/useSettings';
     import { useKeyboardShortcuts } from '../hooks/useKeyboardShortcuts';
     
     const App: React.FC = () => {
       const {
         nodes,
         edges,
         selectedNodeLineage,
         onNodesChange,
         onEdgesChange,
         onConnect,
         onNodeClick,
         // Other node-related state and handlers...
       } = useNodeManagement();
       
       const {
         settings,
         isSettingsModalOpen,
         onOpenSettingsModal,
         onCloseSettingsModal,
         // Other settings-related state and handlers...
       } = useSettings();
       
       useKeyboardShortcuts({
         // Pass required handlers...
       });
       
       return (
         <>
           <APIKeyModal />
           <SettingsModal
             isOpen={isSettingsModalOpen}
             onClose={onCloseSettingsModal}
             // Other props...
           />
           <MainLayout
             leftPanel={
               <NodeGraph
                 nodes={nodes}
                 edges={edges}
                 onNodesChange={onNodesChange}
                 onEdgesChange={onEdgesChange}
                 onConnect={onConnect}
                 onNodeClick={onNodeClick}
                 // Other props...
               />
             }
             rightPanel={
               <ChatPanel
                 lineage={selectedNodeLineage}
                 onType={handleType}
                 submitPrompt={submitPrompt}
                 // Other props...
               />
             }
           />
         </>
       );
     };
     
     export default App;
     ```

- **Effort**: Large (3-4 weeks)
- **Dependencies**: None
- **Risk Assessment**: Medium
  - **Risks**: Functionality regression during refactoring, complex state migration
  - **Mitigation**: Incremental approach, thorough manual testing
- **Success Metrics**:
  - Average component size reduced by 70%
  - No single component over 300 lines
  - Clear separation of UI, state, and logic concerns

##### 1.1.2 Custom Hook Extraction
- **Current State**: Logic mixed with UI rendering, repeated patterns across components
- **Target State**: Logic extracted into reusable hooks with clear interfaces
- **Detailed Implementation**:

  1. **Node Management Hook**:
     ```tsx
     // NEW FILE: src/hooks/useNodeManagement.ts
     import { useState, useCallback } from 'react';
     import { useNodesState, useEdgesState, useReactFlow } from 'reactflow';
     import {
       getFluxNodeLineage,
       markOnlyNodeAsSelected,
       // Other node utilities...
     } from '../utils/fluxNode';
     
     export const useNodeManagement = () => {
       const [nodes, setNodes, onNodesChange] = useNodesState([]);
       const [edges, setEdges, onEdgesChange] = useEdgesState([]);
       const [selectedNodeId, setSelectedNodeId] = useState<string | null>(null);
       const [lastSelectedNodeId, setLastSelectedNodeId] = useState<string | null>(null);
       
       const selectedNodeLineage = selectedNodeId !== null
         ? getFluxNodeLineage(nodes, edges, selectedNodeId)
         : [];
       
       const selectNode = useCallback((id: string) => {
         setLastSelectedNodeId(selectedNodeId);
         setSelectedNodeId(id);
         setNodes((nodes) => markOnlyNodeAsSelected(nodes, id));
       }, [selectedNodeId, setNodes]);
       
       // Other node management methods...
       
       return {
         nodes,
         edges,
         selectedNodeId,
         lastSelectedNodeId,
         selectedNodeLineage,
         setNodes,
         setEdges,
         onNodesChange,
         onEdgesChange,
         selectNode,
         // Other exposed methods...
       };
     };
     ```
  
  2. **API Integration Hook**:
     ```tsx
     // NEW FILE: src/hooks/useOpenRouter.ts
     import { useState, useCallback } from 'react';
     import { useToast } from '@chakra-ui/react';
     import { TOAST_CONFIG } from '../utils/constants';
     import {
       callOpenRouter,
       processChatStream,
       processCompletionsStream,
     } from '../utils/openrouter';
     
     export const useOpenRouter = (apiKey: string) => {
       const [isStreaming, setIsStreaming] = useState(false);
       const [streamError, setStreamError] = useState<string | null>(null);
       const toast = useToast();
       
       const streamChatCompletion = useCallback(async ({
         model,
         temperature,
         messages,
         onToken,
         onComplete,
         onError,
       }) => {
         setIsStreaming(true);
         setStreamError(null);
         
         try {
           const streams = await callOpenRouter(
             'chat',
             {
               model,
               temperature,
               messages,
               // Other params...
             },
             apiKey
           );
           
           // Stream processing logic...
         } catch (err) {
           // Error handling logic...
           
           setStreamError(errorMessage);
           onError?.(errorMessage);
           
           toast({
             title: errorMessage,
             status: 'error',
             ...TOAST_CONFIG,
           });
         } finally {
           setIsStreaming(false);
         }
       }, [apiKey, toast]);
       
       // Similar implementation for completions...
       
       return {
         isStreaming,
         streamError,
         streamChatCompletion,
         streamCompletion,
       };
     };
     ```

- **Effort**: Medium (2-3 weeks)
- **Dependencies**: Component decomposition (1.1.1)
- **Risk Assessment**: Low
  - **Risks**: Logic duplication during transition, potential state management issues
  - **Mitigation**: Thorough testing, progressive implementation
- **Success Metrics**:
  - 80% of business logic extracted to hooks
  - Hook reuse across multiple components
  - Clean component rendering functions

#### 1.2 State Management Implementation

##### 1.2.1 Zustand Store Implementation
- **Current State**: Direct React state with manual cross-component updates
- **Target State**: Centralized state management with clean update patterns
- **Detailed Implementation**:

  1. **Core Store Creation**:
     ```tsx
     // NEW FILE: src/store/index.ts
     import create from 'zustand';
     import { devtools, persist } from 'zustand/middleware';
     import { Node, Edge } from 'reactflow';
     import { FluxNodeData, Settings } from '../utils/types';
     import { DEFAULT_SETTINGS } from '../utils/constants';
     
     interface AppState {
       // Node Graph State
       nodes: Node<FluxNodeData>[];
       edges: Edge[];
       selectedNodeId: string | null;
       lastSelectedNodeId: string | null;
       
       // Settings State
       settings: Settings;
       
       // API State
       apiKey: string | null;
       availableModels: string[] | null;
       
       // UI State
       isSettingsModalOpen: boolean;
       chatPanelWidth: string;
       
       // Actions
       setNodes: (nodes: Node<FluxNodeData>[]) => void;
       setEdges: (edges: Edge[]) => void;
       selectNode: (id: string) => void;
       updateSettings: (settings: Partial<Settings>) => void;
       setApiKey: (key: string | null) => void;
       setAvailableModels: (models: string[] | null) => void;
       toggleSettingsModal: () => void;
       setChatPanelWidth: (width: string) => void;
       
       // Complex Actions
       addNode: (node: Node<FluxNodeData>) => void;
       removeNode: (id: string) => void;
       updateNodeText: (id: string, text: string, asHuman?: boolean) => void;
       // Other actions...
     }
     
     export const useStore = create<AppState>()(
       devtools(
         persist(
           (set, get) => ({
             // Initial State
             nodes: [],
             edges: [],
             selectedNodeId: null,
             lastSelectedNodeId: null,
             settings: DEFAULT_SETTINGS,
             apiKey: null,
             availableModels: null,
             isSettingsModalOpen: false,
             chatPanelWidth: '50%',
             
             // Actions
             setNodes: (nodes) => set({ nodes }),
             setEdges: (edges) => set({ edges }),
             selectNode: (id) => {
               const { nodes } = get();
               set({
                 selectedNodeId: id,
                 lastSelectedNodeId: get().selectedNodeId,
                 nodes: markOnlyNodeAsSelected(nodes, id),
               });
             },
             // Other action implementations...
             
             // Complex Actions
             addNode: (node) => {
               set((state) => ({
                 nodes: [...state.nodes, node],
               }));
             },
             removeNode: (id) => {
               set((state) => ({
                 nodes: state.nodes.filter((node) => node.id !== id),
               }));
             },
             // Other complex action implementations...
           }),
           {
             name: 'forest-storage',
             partialize: (state) => ({
               settings: state.settings,
               apiKey: state.apiKey,
               chatPanelWidth: state.chatPanelWidth,
             }),
           }
         )
       )
     );
     ```

  2. **Component Integration**:
     ```tsx
     // EXAMPLE COMPONENT: src/components/features/NodeGraph.tsx
     import React from 'react';
     import { shallow } from 'zustand/shallow';
     import { useStore } from '../../store';
     
     export const NodeGraph: React.FC = () => {
       const {
         nodes,
         edges,
         onNodesChange,
         onEdgesChange,
         onConnect,
         onNodeClick,
       } = useStore(
         (state) => ({
           nodes: state.nodes,
           edges: state.edges,
           onNodesChange: (changes) => {
             // Update nodes with changes
             // (simplified, would use the actual ReactFlow logic)
             state.setNodes(/* updated nodes */);
           },
           onEdgesChange: (changes) => {
             // Update edges with changes
             // (simplified, would use the actual ReactFlow logic)
             state.setEdges(/* updated edges */);
           },
           onConnect: (connection) => {
             // Add new edge
             // (simplified, would use the actual ReactFlow logic)
             state.setEdges(/* updated edges */);
           },
           onNodeClick: (_, node) => {
             state.selectNode(node.id);
           },
         }),
         shallow
       );
       
       return (
         <ReactFlow
           nodes={nodes}
           edges={edges}
           onNodesChange={onNodesChange}
           onEdgesChange={onEdgesChange}
           onConnect={onConnect}
           onNodeClick={onNodeClick}
           // Other props...
         >
           <Background />
           {/* Other components */}
         </ReactFlow>
       );
     };
     ```

- **Effort**: Large (3-4 weeks)
- **Dependencies**: Custom hook extraction (1.1.2)
- **Risk Assessment**: Medium
  - **Risks**: State migration complexity, potential bugs during transition
  - **Mitigation**: Parallel implementation, comprehensive testing
- **Success Metrics**:
  - 90% of application state in centralized store
  - Elimination of prop drilling
  - Consistent state update patterns

##### 1.2.2 History and Undo System
- **Current State**: Custom implementation with limited capabilities
- **Target State**: Robust history tracking with unlimited undo/redo
- **Detailed Implementation**:

  1. **History Middleware for Zustand**:
     ```tsx
     // NEW FILE: src/store/middlewares/historyMiddleware.ts
     import { StateCreator, StoreApi } from 'zustand';
     
     type HistoryState<T> = {
       past: T[];
       future: T[];
       canUndo: boolean;
       canRedo: boolean;
     };
     
     type HistoryActions<T> = {
       takeSnapshot: () => void;
       undo: () => void;
       redo: () => void;
       clearHistory: () => void;
     };
     
     const MAX_HISTORY_SIZE = 100;
     
     export const historyMiddleware = <
       T extends object,
       Mps extends [StoreMutatorIdentifier, unknown][] = [],
       Mcs extends [StoreMutatorIdentifier, unknown][] = []
     >(
       config: StateCreator<T, Mps, Mcs>,
       options: {
         historyStates: (keyof T)[];
         maxSize?: number;
       }
     ): StateCreator<T & HistoryState<Pick<T, typeof options.historyStates[number]>> & HistoryActions<Pick<T, typeof options.historyStates[number]>>, Mps, Mcs> => {
       return (set, get, api) => {
         const { historyStates, maxSize = MAX_HISTORY_SIZE } = options;
         
         // Implementation details for history middleware...
         
         return {
           ...config(set, get, api),
           past: [],
           future: [],
           canUndo: false,
           canRedo: false,
           takeSnapshot: () => {/* Implementation */},
           undo: () => {/* Implementation */},
           redo: () => {/* Implementation */},
           clearHistory: () => {/* Implementation */},
         };
       };
     };
     ```

  2. **Integration with Store**:
     ```tsx
     // UPDATED FILE: src/store/index.ts
     import { historyMiddleware } from './middlewares/historyMiddleware';
     
     export const useStore = create<AppState>()(
       devtools(
         persist(
           historyMiddleware(
             (set, get) => ({
               // State and actions...
             }),
             {
               historyStates: ['nodes', 'edges', 'selectedNodeId', 'lastSelectedNodeId'],
               maxSize: 50,
             }
           ),
           {
             name: 'forest-storage',
             partialize: (state) => ({
               settings: state.settings,
               apiKey: state.apiKey,
               chatPanelWidth: state.chatPanelWidth,
             }),
           }
         )
       )
     );
     ```

- **Effort**: Medium (1-2 weeks)
- **Dependencies**: Zustand store implementation (1.2.1)
- **Risk Assessment**: Medium
  - **Risks**: Performance impact with large history, memory usage
  - **Mitigation**: Limit history size, selective state tracking
- **Success Metrics**:
  - Unlimited undo/redo operations
  - No performance degradation with extensive history
  - Intuitive history interaction

#### 1.3 Data Flow Optimization

##### 1.3.1 ReactFlow Integration Refactoring
- **Current State**: Direct manipulation of ReactFlow state and props
- **Target State**: Clean abstraction layer over ReactFlow
- **Detailed Implementation**:

  1. **Create Adapter Layer**:
     ```tsx
     // NEW FILE: src/adapters/reactFlowAdapter.ts
     import {
       Node,
       Edge,
       NodeChange,
       EdgeChange,
       Connection,
       applyNodeChanges,
       applyEdgeChanges,
       addEdge,
     } from 'reactflow';
     import { FluxNodeData } from '../utils/types';
     
     export class ReactFlowAdapter {
       // Methods for converting between domain models and ReactFlow models
       
       static applyNodeChanges(
         changes: NodeChange[],
         nodes: Node<FluxNodeData>[]
       ): Node<FluxNodeData>[] {
         return applyNodeChanges(changes, nodes);
       }
       
       static applyEdgeChanges(
         changes: EdgeChange[],
         edges: Edge[]
       ): Edge[] {
         return applyEdgeChanges(changes, edges);
       }
       
       static handleConnection(
         connection: Connection,
         edges: Edge[]
       ): Edge[] {
         return addEdge(connection, edges);
       }
       
       // Other ReactFlow-specific methods...
     }
     ```

  2. **Integration with Store Actions**:
     ```tsx
     // UPDATED FILE: src/store/index.ts
     import { ReactFlowAdapter } from '../adapters/reactFlowAdapter';
     
     export const useStore = create<AppState>()(
       // Middleware...
       (set, get) => ({
         // State...
         
         // Actions
         onNodesChange: (changes) => {
           set((state) => ({
             nodes: ReactFlowAdapter.applyNodeChanges(changes, state.nodes),
           }));
         },
         onEdgesChange: (changes) => {
           set((state) => ({
             edges: ReactFlowAdapter.applyEdgeChanges(changes, state.edges),
           }));
         },
         onConnect: (connection) => {
           set((state) => ({
             edges: ReactFlowAdapter.handleConnection(connection, state.edges),
           }));
         },
         // Other actions...
       })
     );
     ```

- **Effort**: Medium (2 weeks)
- **Dependencies**: Zustand store implementation (1.2.1)
- **Risk Assessment**: Low
  - **Risks**: Integration issues with ReactFlow updates
  - **Mitigation**: Comprehensive interface testing
- **Success Metrics**:
  - Clear separation between domain logic and ReactFlow library
  - Simplified component implementation
  - Easier upgrades of ReactFlow library

##### 1.3.2 API Integration Layer
- **Current State**: Direct API calls within components
- **Target State**: Clean API layer with proper error handling and caching
- **Detailed Implementation**:

  1. **Service Layer Creation**:
     ```tsx
     // NEW FILE: src/services/openRouterService.ts
     import {
       callOpenRouter,
       processChatStream,
       processCompletionsStream,
     } from '../utils/openrouter';
     
     export class OpenRouterService {
       private apiKey: string;
       
       constructor(apiKey: string) {
         this.apiKey = apiKey;
       }
       
       async getAvailableModels(): Promise<string[]> {
         try {
           // Implementation...
           return modelList;
         } catch (error) {
           console.error('Error fetching models:', error);
           throw new Error('Failed to load available models');
         }
       }
       
       async streamChatCompletion(params: {
         model: string;
         temperature: number;
         messages: any[];
         onToken: (token: string) => void;
         onComplete: () => void;
         onError: (error: string) => void;
       }): Promise<void> {
         try {
           // Implementation...
         } catch (error) {
           // Error handling...
           params.onError(errorMessage);
         }
       }
       
       // Other API methods...
     }
     ```

  2. **Store Integration**:
     ```tsx
     // UPDATED FILE: src/store/index.ts
     import { OpenRouterService } from '../services/openRouterService';
     
     export const useStore = create<AppState>()((set, get) => ({
       // State...
       
       // OpenRouter-related actions
       fetchAvailableModels: async () => {
         const { apiKey } = get();
         if (!apiKey) return;
         
         set({ isLoadingModels: true });
         
         try {
           const service = new OpenRouterService(apiKey);
           const models = await service.getAvailableModels();
           set({ availableModels: models, isLoadingModels: false });
         } catch (error) {
           console.error('Failed to fetch models:', error);
           set({ isLoadingModels: false });
         }
       },
       
       submitPrompt: async (overrideExisting: boolean = false) => {
         const {
           apiKey,
           settings,
           nodes,
           edges,
           selectedNodeId,
         } = get();
         
         if (!apiKey || !selectedNodeId) return;
         
         // Implementation using OpenRouterService...
       },
       
       // Other actions...
     }));
     ```

- **Effort**: Medium (2 weeks)
- **Dependencies**: Zustand store implementation (1.2.1)
- **Risk Assessment**: Low
  - **Risks**: API compatibility changes
  - **Mitigation**: Robust error handling, fallback mechanisms
- **Success Metrics**:
  - Consistent error handling
  - Simplified API interaction
  - Better testability of API integration

### 2. UI and Styling Modernization

#### 2.1 Chakra UI Theme System Implementation

##### 2.1.1 Complete Theme Architecture
- **Current State**: Partial theme implementation with many overrides
- **Target State**: Comprehensive theme with full component coverage
- **Detailed Implementation**:

  1. **Extend Theme Structure**:
     ```tsx
     // UPDATED FILE: src/theme/index.ts
     import { extendTheme, ThemeConfig } from '@chakra-ui/react';
     import { mode } from '@chakra-ui/theme-tools';
     import { colors } from './colors';
     import { fonts } from './fonts';
     import { components } from './components';
     
     const config: ThemeConfig = {
       initialColorMode: 'dark',
       useSystemColorMode: true,
     };
     
     const styles = {
       global: (props: any) => ({
         body: {
           bg: mode('white', 'brand.primary')(props),
           color: mode('gray.800', 'text.primary')(props),
           fontFamily: 'body',
           transition: 'background-color 0.2s',
         },
         // Other global styles...
       }),
     };
     
     const breakpoints = {
       sm: '320px',
       md: '768px',
       lg: '960px',
       xl: '1200px',
       '2xl': '1536px',
     };
     
     const layerStyles = {
       nodeCard: {
         p: 4,
         borderRadius: 'md',
         boxShadow: 'md',
       },
       // Other layer styles...
     };
     
     const textStyles = {
       heading: {
         fontFamily: 'heading',
         fontWeight: 'bold',
       },
       node: {
         fontSize: 'sm',
         lineHeight: 'short',
       },
       // Other text styles...
     };
     
     export const theme = extendTheme({
       colors,
       fonts,
       components,
       config,
       styles,
       breakpoints,
       layerStyles,
       textStyles,
     });
     ```

  2. **Semantic Color Tokens**:
     ```tsx
     // UPDATED FILE: src/theme/colors.ts
     export const colors = {
       brand: {
         primary: '#000000',
         secondary: '#FFFFFF',
       },
       text: {
         primary: '#EEEEEE',
         secondary: '#222222',
         muted: '#999999',
       },
       node: {
         user: '#3182CE',
         system: '#2C7A7B',
         gpt: '#38A169',
         tweakedGpt: '#805AD5',
         selected: {
           border: '#F6E05E',
           shadow: '#F6AD55',
         },
       },
       ui: {
         dark: '#222222',
         medium: '#333333',
         light: '#DDDDDD',
         border: '#444444',
       },
       semantic: {
         success: '#38A169',
         error: '#E53E3E',
