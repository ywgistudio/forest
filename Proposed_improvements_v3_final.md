# Forest App Ultimate Improvement Plan - Final Section

## 4. Performance Optimization (Continued)

#### 4.1.2 Virtualization for Large Graphs
- **Current State**: All nodes rendered regardless of visibility
- **Target State**: Only visible nodes rendered in large graphs
- **Detailed Implementation**:

  1. **Virtual Rendering Configuration**:
     ```tsx
     // UPDATED FILE: src/components/features/NodeGraph.tsx
     import ReactFlow, {
       ReactFlowProvider,
       useNodesState,
       useEdgesState,
       Panel,
       useViewport,
       useReactFlow,
     } from 'reactflow';
     
     export const NodeGraph: React.FC = () => {
       const { nodes, edges, onNodesChange, onEdgesChange, onConnect } = useStore(
         (state) => ({
           // State selectors...
         }),
         shallow
       );
       
       // Calculate visible area based on viewport
       const { x, y, zoom } = useViewport();
       const reactFlowInstance = useReactFlow();
       const { width, height } = reactFlowInstance.getViewportSize();
       
       // Define visible rect with some buffer
       const visibleRect = {
         x: -x / zoom - 100,
         y: -y / zoom - 100,
         width: width / zoom + 200,
         height: height / zoom + 200,
       };
       
       // Filter to only visible nodes (with buffer)
       const visibleNodes = useMemo(() => {
         if (nodes.length < 50) {
           // Don't optimize for small graphs
           return nodes;
         }
         
         return nodes.filter((node) => {
           const nodeX = node.position.x;
           const nodeY = node.position.y;
           const nodeWidth = 150; // Approximate node width
           const nodeHeight = 75; // Approximate node height
           
           return (
             nodeX + nodeWidth > visibleRect.x &&
             nodeX < visibleRect.x + visibleRect.width &&
             nodeY + nodeHeight > visibleRect.y &&
             nodeY < visibleRect.y + visibleRect.height
           );
         });
       }, [nodes, visibleRect]);
       
       return (
         <ReactFlow
           nodes={visibleNodes}
           edges={edges}
           onNodesChange={onNodesChange}
           onEdgesChange={onEdgesChange}
           onConnect={onConnect}
           // Other props...
         >
           {/* React Flow components */}
         </ReactFlow>
       );
     };
     ```

  2. **Performance Monitoring**:
     ```tsx
     // NEW FILE: src/utils/performance.ts
     
     // Track render times
     export const useRenderPerformance = (componentName: string) => {
       const renderStartTime = useRef(performance.now());
       
       useEffect(() => {
         const renderTime = performance.now() - renderStartTime.current;
         
         if (renderTime > 16) { // 60fps threshold
           console.warn(
             `Slow render detected in ${componentName}: ${renderTime.toFixed(2)}ms`
           );
         }
         
         renderStartTime.current = performance.now();
       });
     };
     
     // Monitor node count and performance
     export const useNodeCountMonitor = (nodeCount: number) => {
       const prevNodeCount = useRef(nodeCount);
       
       useEffect(() => {
         if (nodeCount > 200 && nodeCount > prevNodeCount.current) {
           console.warn(
             `High node count: ${nodeCount} nodes. Consider optimizing or using pagination.`
           );
         }
         
         prevNodeCount.current = nodeCount;
       }, [nodeCount]);
       
       return nodeCount > 200;
     };
     ```

- **Effort**: Medium (2 weeks)
- **Dependencies**: Component memoization (4.1.1)
- **Risk Assessment**: Medium
  - **Risks**: Edge rendering issues, selection state problems
  - **Mitigation**: Thorough testing with large graphs, performance benchmarks
- **Success Metrics**:
  - 60fps maintained with 500+ node graphs
  - Memory usage stabilized regardless of graph size
  - Smooth pan/zoom with large graphs

#### 4.2 API Streaming Optimization

##### 4.2.1 Enhanced Stream Handling
- **Current State**: Basic streaming implementation
- **Target State**: Optimized streaming with error recovery
- **Detailed Implementation**:

  1. **Improved Stream Processing**:
     ```tsx
     // UPDATED FILE: src/utils/openrouter.ts
     
     export async function* processChatStream(
       stream: ReadableStream,
       abortController: AbortController
     ): AsyncGenerator<ChatCompletionChunk> {
       const reader = stream.getReader();
       const decoder = new TextDecoder('utf-8');
       let buffer = '';
       
       try {
         while (true) {
           const { done, value } = await reader.read();
           
           if (done || abortController.signal.aborted) {
             break;
           }
           
           // Append to buffer and process complete messages
           buffer += decoder.decode(value, { stream: true });
           
           // Process complete messages
           const lines = buffer.split('\n');
           buffer = lines.pop() || ''; // Keep the incomplete line in buffer
           
           for (const line of lines) {
             if (!line.startsWith('data: ') || line === 'data: [DONE]') continue;
             
             try {
               const parsed = JSON.parse(line.slice(6));
               if (isValidChunk(parsed)) {
                 yield parsed;
               }
             } catch (error) {
               console.warn('Error parsing stream chunk:', error);
               continue;
             }
           }
         }
         
         // Process any remaining data in buffer
         if (buffer && !abortController.signal.aborted) {
           if (buffer.startsWith('data: ') && buffer !== 'data: [DONE]') {
             try {
               const parsed = JSON.parse(buffer.slice(6));
               if (isValidChunk(parsed)) {
                 yield parsed;
               }
             } catch (error) {
               console.warn('Error parsing final stream chunk:', error);
             }
           }
         }
       } catch (error) {
         console.error('Stream processing error:', error);
         // Rethrow with context
         throw new Error(`Stream processing failed: ${error.message}`);
       } finally {
         reader.releaseLock();
       }
     }
     
     // Validate chunk structure
     function isValidChunk(chunk: unknown): chunk is ChatCompletionChunk {
       return (
         typeof chunk === 'object' &&
         chunk !== null &&
         'choices' in chunk &&
         Array.isArray((chunk as any).choices) &&
         (chunk as any).choices.length > 0
       );
     }
     ```

  2. **Stream Error Recovery**:
     ```tsx
     // NEW FILE: src/utils/streamRetry.ts
     
     export class StreamRetryManager {
       private maxRetries: number;
       private backoffFactor: number;
       private initialDelay: number;
       
       constructor({
         maxRetries = 3,
         backoffFactor = 1.5,
         initialDelay = 1000,
       } = {}) {
         this.maxRetries = maxRetries;
         this.backoffFactor = backoffFactor;
         this.initialDelay = initialDelay;
       }
       
       async fetchWithRetry<T>(
         fetchFn: () => Promise<T>,
         shouldRetry: (error: Error) => boolean = () => true
       ): Promise<T> {
         let lastError: Error;
         let delay = this.initialDelay;
         
         for (let retry = 0; retry <= this.maxRetries; retry++) {
           try {
             return await fetchFn();
           } catch (error) {
             lastError = error;
             
             if (retry >= this.maxRetries || !shouldRetry(error)) {
               break;
             }
             
             console.warn(
               `Stream error (attempt ${retry + 1}/${this.maxRetries + 1}): ${error.message}`
             );
             
             // Wait before retrying
             await new Promise((resolve) => setTimeout(resolve, delay));
             delay *= this.backoffFactor;
           }
         }
         
         throw lastError;
       }
     }
     ```

  3. **Service Integration**:
     ```tsx
     // UPDATED FILE: src/services/openRouterService.ts
     import { StreamRetryManager } from '../utils/streamRetry';
     
     export class OpenRouterService {
       private apiKey: string;
       private retryManager: StreamRetryManager;
       
       constructor(apiKey: string) {
         this.apiKey = apiKey;
         this.retryManager = new StreamRetryManager();
       }
       
       async streamChatCompletion(params: {
         // Parameter types...
       }): Promise<void> {
         const { model, messages, temperature, onToken, onComplete, onError } = params;
         
         try {
           await this.retryManager.fetchWithRetry(
             async () => {
               // Existing implementation with explicit error handling
               const streams = await callOpenRouter(
                 'chat',
                 {
                   model,
                   messages,
                   temperature,
                   stream: true,
                 },
                 this.apiKey
               );
               
               // Process streams...
               
               return true;
             },
             // Only retry network errors, not API errors
             (error) => error.message.includes('network') || error.message.includes('timeout')
           );
         } catch (error) {
           console.error('Failed to complete chat stream after retries:', error);
           onError(formatErrorMessage(error));
         }
       }
     }
     ```

- **Effort**: Medium (2 weeks)
- **Dependencies**: API integration layer (1.3.2)
- **Risk Assessment**: Medium
  - **Risks**: Increased complexity, API compatibility issues
  - **Mitigation**: Comprehensive error handling, fallback options
- **Success Metrics**:
  - 99.9% successful completion rate for streams
  - Automatic recovery from transient network errors
  - Improved error messages for debugging

#### 4.3 Storage Optimization

##### 4.3.1 Local Storage Management
- **Current State**: Uncompressed localStorage usage with potential overflow
- **Target State**: Optimized, compressed storage with fallbacks
- **Detailed Implementation**:

  1. **Storage Compression**:
     ```tsx
     // NEW FILE: src/utils/storage/compression.ts
     import { compressToUTF16, decompressFromUTF16 } from 'lz-string';
     
     export function compressData<T>(data: T): string {
       return compressToUTF16(JSON.stringify(data));
     }
     
     export function decompressData<T>(compressed: string): T {
       try {
         const decompressed = decompressFromUTF16(compressed);
         return JSON.parse(decompressed);
       } catch (error) {
         console.error('Failed to decompress data:', error);
         throw new Error('Storage data corruption detected');
       }
     }
     ```

  2. **Enhanced Storage Service**:
     ```tsx
     // NEW FILE: src/utils/storage/storageService.ts
     import { compressData, decompressData } from './compression';
     
     const STORAGE_PREFIX = 'forest_app_';
     const MAX_STORAGE_SIZE = 4.5 * 1024 * 1024; // 4.5MB (5MB is typical limit)
     
     export class StorageService {
       private async isStorageAvailable(): Promise<boolean> {
         try {
           const testKey = `${STORAGE_PREFIX}test`;
           localStorage.setItem(testKey, 'test');
           localStorage.removeItem(testKey);
           return true;
         } catch (error) {
           return false;
         }
       }
       
       private getKeyWithPrefix(key: string): string {
         return `${STORAGE_PREFIX}${key}`;
       }
       
       async getItem<T>(key: string, defaultValue: T): Promise<T> {
         if (!(await this.isStorageAvailable())) {
           console.warn('LocalStorage not available, returning default value');
           return defaultValue;
         }
         
         const prefixedKey = this.getKeyWithPrefix(key);
         const value = localStorage.getItem(prefixedKey);
         
         if (!value) return defaultValue;
         
         try {
           return decompressData<T>(value);
         } catch (error) {
           console.error(`Error retrieving ${key}:`, error);
           return defaultValue;
         }
       }
       
       async setItem<T>(key: string, value: T): Promise<boolean> {
         if (!(await this.isStorageAvailable())) {
           console.error('LocalStorage not available, data not saved');
           return false;
         }
         
         const prefixedKey = this.getKeyWithPrefix(key);
         
         try {
           const compressed = compressData(value);
           
           // Check if we're near storage limit
           if (compressed.length > MAX_STORAGE_SIZE) {
             console.error('Data too large for storage');
             return false;
           }
           
           localStorage.setItem(prefixedKey, compressed);
           return true;
         } catch (error) {
           console.error(`Error saving ${key}:`, error);
           return false;
         }
       }
       
       async removeItem(key: string): Promise<boolean> {
         if (!(await this.isStorageAvailable())) {
           return false;
         }
         
         try {
           localStorage.removeItem(this.getKeyWithPrefix(key));
           return true;
         } catch (error) {
           console.error(`Error removing ${key}:`, error);
           return false;
         }
       }
       
       async getAllKeys(): Promise<string[]> {
         if (!(await this.isStorageAvailable())) {
           return [];
         }
         
         return Object.keys(localStorage)
           .filter(key => key.startsWith(STORAGE_PREFIX))
           .map(key => key.slice(STORAGE_PREFIX.length));
       }
       
       async getStorageUsage(): Promise<{ used: number, total: number }> {
         if (!(await this.isStorageAvailable())) {
           return { used: 0, total: 0 };
         }
         
         let used = 0;
         
         for (let i = 0; i < localStorage.length; i++) {
           const key = localStorage.key(i);
           if (key && key.startsWith(STORAGE_PREFIX)) {
             used += localStorage.getItem(key)?.length || 0;
           }
         }
         
         return {
           used,
           total: MAX_STORAGE_SIZE,
         };
       }
     }
     
     export const storageService = new StorageService();
     ```

  3. **Zustand Middleware Integration**:
     ```tsx
     // NEW FILE: src/store/middlewares/storageMiddleware.ts
     import { StateCreator } from 'zustand';
     import { storageService } from '../../utils/storage/storageService';
     
     export const storageMiddleware = <T extends object>(
       config: StateCreator<T>,
       options: {
         name: string;
         partialize?: (state: T) => Partial<T>;
         version?: number;
         migrate?: (persistedState: unknown, version: number) => T;
         onRehydrateStorage?: (state: T | undefined) => void;
       }
     ): StateCreator<T> => {
       return (set, get, api) => {
         const {
           name,
           partialize = (state) => state,
           version = 0,
           migrate = (state) => state as T,
           onRehydrateStorage,
         } = options;
         
         // Implementation details...
         
         // Hydrate store with persisted data
         (async () => {
           try {
             const persistedState = await storageService.getItem<{
               state: Partial<T>;
               version: number;
             }>(name, { state: {}, version });
             
             if (persistedState.version !== version) {
               const migratedState = migrate(persistedState.state, persistedState.version);
               set(migratedState as Partial<T>);
             } else {
               set(persistedState.state as Partial<T>);
             }
             
             onRehydrateStorage?.(get());
           } catch (error) {
             console.error('Failed to hydrate store:', error);
             onRehydrateStorage?.(undefined);
           }
         })();
         
         return config(
           (updates, replace) => {
             set(updates, replace);
             
             const state = get();
             const partializedState = partialize(state);
             
             // Persist to storage
             storageService.setItem(name, {
               state: partializedState,
               version,
             }).catch((error) => {
               console.error('Failed to persist state:', error);
             });
           },
           get,
           api
         );
       };
     };
     ```

- **Effort**: Medium (2 weeks)
- **Dependencies**: None
- **Risk Assessment**: Medium
  - **Risks**: Data migration issues, potential data loss
  - **Mitigation**: Fallback mechanisms, data integrity validation
- **Success Metrics**:
  - 60% reduction in localStorage usage
  - No storage overflow errors
  - Graceful handling of storage limitations

### 5. User Experience Enhancements

#### 5.1 Feedback System

##### 5.1.1 Toast Notification System
- **Current State**: Limited notifications for errors only
- **Target State**: Comprehensive notification system for all user actions
- **Detailed Implementation**:

  1. **Toast Service**:
     ```tsx
     // NEW FILE: src/services/toastService.ts
     import { useToast, UseToastOptions } from '@chakra-ui/react';
     import { createContext, useContext, useCallback, ReactNode } from 'react';
     
     type ToastType = 'success' | 'error' | 'info' | 'warning';
     
     interface ToastOptions extends Omit<UseToastOptions, 'status'> {
       title?: string;
       description?: string;
     }
     
     interface ToastContextType {
       showToast: (type: ToastType, options: ToastOptions) => void;
       success: (options: ToastOptions) => void;
       error: (options: ToastOptions) => void;
       info: (options: ToastOptions) => void;
       warning: (options: ToastOptions) => void;
     }
     
     const ToastContext = createContext<ToastContextType | null>(null);
     
     export const ToastProvider: React.FC<{ children: ReactNode }> = ({ children }) => {
       const toast = useToast();
       
       const showToast = useCallback(
         (type: ToastType, options: ToastOptions) => {
           toast({
             status: type,
             position: 'bottom-right',
             isClosable: true,
             duration: 3000,
             ...options,
           });
         },
         [toast]
       );
       
       const success = useCallback(
         (options: ToastOptions) => showToast('success', options),
         [showToast]
       );
       
       const error = useCallback(
         (options: ToastOptions) => showToast('error', options),
         [showToast]
       );
       
       const info = useCallback(
         (options: ToastOptions) => showToast('info', options),
         [showToast]
       );
       
       const warning = useCallback(
         (options: ToastOptions) => showToast('warning', options),
         [showToast]
       );
       
       return (
         <ToastContext.Provider
           value={{ showToast, success, error, info, warning }}
         >
           {children}
         </ToastContext.Provider>
       );
     };
     
     export const useToastService = () => {
       const context = useContext(ToastContext);
       
       if (!context) {
         throw new Error('useToastService must be used within a ToastProvider');
       }
       
       return context;
     };
     ```

  2. **Enhanced Action Feedback**:
     ```tsx
     // EXAMPLE INTEGRATION: src/store/index.ts
     
     export const useStore = create<AppState>()((set, get) => ({
       // State...
       
       // Actions with toast feedback
       selectNode: (id: string) => {
         set((state) => {
           const node = state.nodes.find((n) => n.id === id);
           
           // Show toast for selected node
           if (node) {
             toastService.info({
               title: `Selected ${node.data.fluxNodeType}`,
               description: node.data.label || 'Node selected',
               duration: 1500,
             });
           }
           
           return {
             selectedNodeId: id,
             lastSelectedNodeId: state.selectedNodeId,
             nodes: markOnlyNodeAsSelected(state.nodes, id),
           };
         });
       },
       
       deleteSelectedNodes: () => {
         set((state) => {
           const selectedNodes = state.nodes.filter((n) => n.selected);
           const count = selectedNodes.length;
           
           if (count > 0) {
             toastService.success({
               title: `Deleted ${count} node${count > 1 ? 's' : ''}`,
               duration: 2000,
             });
           }
           
           return {
             nodes: state.nodes.filter((n) => !n.selected),
           };
         });
       },
       
       // Other actions...
     }));
     ```

- **Effort**: Small (1 week)
- **Dependencies**: None
- **Risk Assessment**: Low
  - **Risks**: UI clutter with excessive notifications
  - **Mitigation**: Intelligent grouping, short durations for common actions
- **Success Metrics**:
  - All user actions provide visual feedback
  - Notifications are informative but not intrusive
  - Users understand system state at all times

##### 5.1.2 Streaming State Visualization
- **Current State**: Basic animation for streaming
- **Target State**: Clear visual indication of streaming state and progress
- **Detailed Implementation**:

  1. **Streaming Status Component**:
     ```tsx
     // NEW FILE: src/components/feedback/StreamingStatus.tsx
     import React from 'react';
     import { Box, Flex, Text, Spinner } from '@chakra-ui/react';
     import { useStore } from '../../store';
     import { shallow } from 'zustand/shallow';
     
     export const StreamingStatus: React.FC = () => {
       const { isStreaming, streamProgress, streamingNodeId } = useStore(
         (state) => ({
           isStreaming: state.isStreaming,
           streamProgress: state.streamProgress,
           streamingNodeId: state.streamingNodeId,
         }),
         shallow
       );
       
       if (!isStreaming) return null;
       
       return (
         <Box
           position="fixed"
           bottom="20px"
           right="20px"
           bg="ui.dark"
           color="text.primary"
           borderRadius="md"
           boxShadow="md"
           p={3}
           zIndex={1000}
           maxWidth="300px"
         >
           <Flex align="center">
             <Spinner size="sm" mr={3} />
             <Box>
               <Text fontWeight="bold">Processing response</Text>
               <Text fontSize="sm" opacity={0.8}>
                 {streamProgress.tokens} tokens received
               </Text>
             </Box>
           </Flex>
         </Box>
       );
     };
     ```

  2. **Node Streaming Indicator**:
     ```tsx
     // UPDATED FILE: src/components/nodes/FluxNode.tsx
     import React, { memo } from 'react';
     import { Handle, Position } from 'reactflow';
     import { Box, Text, Flex, keyframes } from '@chakra-ui/react';
     import { FluxNodeProps } from '../../utils/types';
     
     const pulseKeyframes = keyframes`
       0% { box-shadow: 0 0 0 0 rgba(66, 153, 225, 0.6); }
       70% { box-shadow: 0 0 0 10px rgba(66, 153, 225, 0); }
       100% { box-shadow: 0 0 0 0 rgba(66, 153, 225, 0); }
     `;
     
     const pulse = `${pulseKeyframes} 2s infinite`;
     
     const FluxNodeComponent: React.FC<FluxNodeProps> = ({ 
       data, 
       isConnectable,
       selected,
     }) => {
       const isStreaming = !!data.streamId;
       
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
             boxShadow={isStreaming ? 'none' : (selected ? '0 0 10px' : 'md')}
             borderRadius="md"
             maxWidth="200px"
             animation={isStreaming ? pulse : undefined}
             position="relative"
           >
             <Flex justify="space-between" align="center" mb={1}>
               <Text fontWeight="bold" fontSize="sm">
                 {data.label || data.fluxNodeType}
               </Text>
               
               {isStreaming && (
                 <Box
                   w="8px"
                   h="8px"
                   borderRadius="full"
                   bg="blue.400"
                   animation={pulse}
                 />
               )}
             </Flex>
             
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
       // Custom comparison logic...
     });
     ```

- **Effort**: Small (1 week)
- **Dependencies**: None
- **Risk Assessment**: Low
  - **Risks**: Visual clutter
  - **Mitigation**: Subtle animations, clean design
- **Success Metrics**:
  - Clear visual indication of streaming state
  - No confusion about which node is being updated
  - Smooth animations without performance impact

#### 5.2 Accessibility Improvements

##### 5.2.1 Keyboard Navigation
- **Current State**: Limited keyboard support
- **Target State**: Full keyboard navigation throughout the application
- **Detailed Implementation**:

  1. **Focus Management System**:
     ```tsx
     // NEW FILE: src/hooks/useFocusNavigation.ts
     import { useRef, useEffect, useCallback } from 'react';
     
     export const useFocusNavigation = (
       containerRef: React.RefObject<HTMLElement>,
       options: {
         selector: string;
         onFocusChange?: (element: HTMLElement | null) => void;
         enabled?: boolean;
         loop?: boolean;
       }
     ) => {
       const { selector, onFocusChange, enabled = true, loop = true } = options;
       const currentFocusIndex = useRef(-1);
       
       const getFocusableElements = useCallback(() => {
         if (!containerRef.current) return [];
         
         return Array.from(
           containerRef.current.querySelectorAll<HTMLElement>(selector)
         ).filter((el) => {
           // Filter out hidden elements
           const style = window.getComputedStyle(el);
           return (
             style.display !== 'none' &&
             style.visibility !== 'hidden' &&
             el.getAttribute('aria-hidden') !== 'true'
           );
         });
       }, [containerRef, selector]);
       
       const focusNext = useCallback(() => {
         const elements = getFocusableElements();
         if (elements.length === 0) return;
         
         if (currentFocusIndex.current >= elements.length - 1) {
           if (loop) {
             currentFocusIndex.current = 0;
           } else {
             return;
           }
         } else {
           currentFocusIndex.current++;
         }
         
         elements[currentFocusIndex.current].focus();
         onFocusChange?.(elements[currentFocusIndex.current]);
       }, [getFocusableElements, loop, onFocusChange]);
       
       const focusPrevious = useCallback(() => {
         const elements = getFocusableElements();
         if (elements.length === 0) return;
         
         if (currentFocusIndex.current <= 0) {
           if (loop) {
             currentFocusIndex.current = elements.length - 1;
           } else {
             return;
           }
         } else {
           currentFocusIndex.current--;
         }
         
         elements[currentFocusIndex.current].focus();
         onFocusChange?.(elements[currentFocusIndex.current]);
       }, [getFocusableElements, loop, onFocusChange]);
       
       const handleKeyDown = useCallback(
         (event: KeyboardEvent) => {
           if (!enabled) return;
           
           if (event.key === 'Tab') {
             // Allow normal Tab behavior
             const elements = getFocusableElements();
             const focusedElement = document.activeElement as HTMLElement;
             const focusedIndex = elements.indexOf(focusedElement);
             
             if (focusedIndex !== -1) {
               currentFocusIndex.current = focusedIndex;
             }
             
             return;
           }
           
           if (event.key === 'ArrowDown') {
             event.preventDefault();
             focusNext();
           } else if (event.key === 'ArrowUp') {
             event.preventDefault();
             focusPrevious();
           }
         },
         [enabled, focusNext, focusPrevious, getFocusableElements]
       );
       
       useEffect(() => {
         if (!containerRef.current || !enabled) return;
         
         containerRef.current.addEventListener('keydown', handleKeyDown);
         
         return () => {
           containerRef.current?.removeEventListener('keydown', handleKeyDown);
         };
       }, [containerRef, enabled, handleKeyDown]);
       
       return {
         focusNext,
         focusP
