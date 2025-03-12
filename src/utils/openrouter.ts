import { yieldStream } from "yield-stream";

// Custom function to call OpenRouter API directly instead of relying on openai-streams
export async function callOpenRouter(
  endpoint: "chat" | "completions",
  params: any,
  apiKey: string
): Promise<ReadableStream<Uint8Array>[]> {
  const isChat = endpoint === "chat";
  const url = `https://openrouter.ai/api/v1/${isChat ? "chat/" : ""}completions`;
  
  // If n > 1, we need to make separate requests for each to ensure parallelism
  // OpenRouter may not support streaming with n > 1 properly
  const n = params.n || 1;
  
  // Make a single request if n=1, otherwise make multiple parallel requests
  if (n === 1) {
    // Ensure response streaming is enabled
    const requestParams = {
      ...params,
      stream: true,
      n: 1
    };
    
    console.log(`Calling OpenRouter API: ${url} with params:`, JSON.stringify(requestParams, null, 2));
    
    const response = await fetch(url, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "Authorization": `Bearer ${apiKey}`,
        "HTTP-Referer": window.location.href,
        "X-Title": "Forest"
      },
      body: JSON.stringify(requestParams)
    });
    
    if (!response.ok) {
      const errorData = await response.json().catch(() => null);
      throw new Error(
        errorData?.error?.message || 
        `OpenRouter API returned status ${response.status}: ${response.statusText}`
      );
    }
    
    return [response.body!];
  }
  
  // For multiple responses, make n separate requests in parallel
  console.log(`Making ${n} parallel requests to OpenRouter API to simulate n=${n}`);
  
  const streams: ReadableStream<Uint8Array>[] = [];
  const requestParams = {
    ...params,
    stream: true,
    n: 1 // Force n=1 for each individual request
  };
  
  // Make n parallel requests
  const requests = Array(n).fill(0).map(async (_, i) => {
    console.log(`Making request ${i+1}/${n}`);
    
    const response = await fetch(url, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "Authorization": `Bearer ${apiKey}`,
        "HTTP-Referer": window.location.href,
        "X-Title": "Forest"
      },
      body: JSON.stringify(requestParams)
    });
    
    if (!response.ok) {
      const errorData = await response.json().catch(() => null);
      throw new Error(
        errorData?.error?.message || 
        `OpenRouter API request ${i+1} returned status ${response.status}: ${response.statusText}`
      );
    }
    
    return { index: i, stream: response.body! };
  });
  
  // Wait for all requests to complete
  const results = await Promise.all(requests);
  
  // Sort by index to maintain order
  results.sort((a, b) => a.index - b.index);
  
  // Return just the streams
  return results.map(result => result.stream);
}

// Helper function to decode and parse stream chunks
export function createStreamProcessor() {
  const DECODER = new TextDecoder();
  
  return {
    decodeChunk: (chunk: Uint8Array) => {
      const text = DECODER.decode(chunk);
      // Split by newlines - OpenRouter sends data: events line by line
      const lines = text.split('\n').filter(line => line.trim() !== '');
      
      for (const line of lines) {
        // Process each SSE line
        if (line.startsWith("data: ")) {
          const data = line.slice(6).trim();
          if (data === "[DONE]") {
            return { done: true };
          }
          try {
            return { data: JSON.parse(data), done: false };
          } catch (e) {
            console.error("Error parsing JSON from stream:", e, "Line:", line);
            // Continue with other lines if this one fails
          }
        }
      }
      return { done: false };
    }
  };
}

// Utility function to adapt response format from OpenRouter to the format expected by the UI
function adaptOpenRouterResponse(response: any, isCompletion: boolean) {
  // If it already has the expected structure, return it as is
  if (response.choices && 
      response.choices.length > 0 && 
      ((isCompletion && response.choices[0].text) || 
       (!isCompletion && response.choices[0].delta))) {
    return response;
  }

  // If response has a different structure, adapt it to the expected format
  console.log("Adapting response format:", response);
  
  let adaptedResponse = { ...response };
  
  // For chat completions
  if (!isCompletion) {
    if (response.choices && response.choices.length > 0) {
      // Some OpenRouter responses might have the message directly instead of delta
      if (response.choices[0].message && !response.choices[0].delta) {
        adaptedResponse.choices = response.choices.map((choice: any, index: number) => ({
          ...choice,
          delta: {
            content: choice.message.content,
            role: choice.message.role
          },
          index: index
        }));
      }
    }
  } 
  // For completions
  else {
    if (response.choices && response.choices.length > 0) {
      // Some responses might have message.content instead of text
      if (response.choices[0].message && !response.choices[0].text) {
        adaptedResponse.choices = response.choices.map((choice: any, index: number) => ({
          ...choice,
          text: choice.message.content,
          index: index
        }));
      }
    }
  }
  
  return adaptedResponse;
}

// Process stream for chat completions
export async function* processChatStream(
  stream: ReadableStream<Uint8Array>,
  abortController: AbortController
) {
  const DECODER = new TextDecoder();
  let buffer = '';
  
  for await (const chunk of yieldStream(stream, abortController)) {
    if (abortController.signal.aborted) break;
    
    try {
      // Add new chunk to buffer
      buffer += DECODER.decode(chunk, { stream: true });
      
      // Process complete lines
      const lines = buffer.split('\n');
      buffer = lines.pop() || ''; // Keep the last incomplete line in the buffer
      
      for (const line of lines) {
        const trimmedLine = line.trim();
        if (!trimmedLine) continue;
        
        if (trimmedLine.startsWith('data: ')) {
          const data = trimmedLine.slice(6).trim();
          
          if (data === '[DONE]') break;
          
          try {
            const parsed = JSON.parse(data);
            const adapted = adaptOpenRouterResponse(parsed, false);
            console.log("Adapted chat response:", adapted);
            
            // Only yield if the response has all the required fields for the UI
            if (adapted.choices && 
                adapted.choices.length > 0 && 
                adapted.choices[0].delta &&
                adapted.choices[0].index !== undefined) {
              yield adapted;
            }
          } catch (e) {
            console.error("Error parsing JSON from stream:", e, "Data:", data);
          }
        }
      }
    } catch (err) {
      console.error("Error processing chat stream:", err);
    }
  }
  
  // Process any remaining data in the buffer
  if (buffer.trim() && !abortController.signal.aborted) {
    try {
      if (buffer.startsWith('data: ')) {
        const data = buffer.slice(6).trim();
        if (data !== '[DONE]') {
          const parsed = JSON.parse(data);
          const adapted = adaptOpenRouterResponse(parsed, false);
          yield adapted;
        }
      }
    } catch (e) {
      console.error("Error processing final buffer:", e);
    }
  }
}

// Process stream for completions
export async function* processCompletionsStream(
  stream: ReadableStream<Uint8Array>,
  abortController: AbortController
) {
  const DECODER = new TextDecoder();
  let buffer = '';
  
  for await (const chunk of yieldStream(stream, abortController)) {
    if (abortController.signal.aborted) break;
    
    try {
      // Add new chunk to buffer
      buffer += DECODER.decode(chunk, { stream: true });
      
      // Process complete lines
      const lines = buffer.split('\n');
      buffer = lines.pop() || ''; // Keep the last incomplete line in the buffer
      
      for (const line of lines) {
        const trimmedLine = line.trim();
        if (!trimmedLine) continue;
        
        if (trimmedLine.startsWith('data: ')) {
          const data = trimmedLine.slice(6).trim();
          
          if (data === '[DONE]') break;
          
          try {
            const parsed = JSON.parse(data);
            const adapted = adaptOpenRouterResponse(parsed, true);
            console.log("Adapted completions response:", adapted);
            
            // Only yield if the response has all the required fields for the UI
            if (adapted.choices && 
                adapted.choices.length > 0 && 
                adapted.choices[0].text !== undefined) {
              yield adapted;
            }
          } catch (e) {
            console.error("Error parsing JSON from stream:", e, "Data:", data);
          }
        }
      }
    } catch (err) {
      console.error("Error processing completions stream:", err);
    }
  }
  
  // Process any remaining data in the buffer
  if (buffer.trim() && !abortController.signal.aborted) {
    try {
      if (buffer.startsWith('data: ')) {
        const data = buffer.slice(6).trim();
        if (data !== '[DONE]') {
          const parsed = JSON.parse(data);
          const adapted = adaptOpenRouterResponse(parsed, true);
          yield adapted;
        }
      }
    } catch (e) {
      console.error("Error processing final buffer:", e);
    }
  }
}
