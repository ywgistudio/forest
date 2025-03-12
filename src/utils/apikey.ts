export function isValidAPIKey(apiKey: string | null) {
  return apiKey != null && (
    apiKey.startsWith("sk-") || 
    apiKey.startsWith("sk-proj-") || 
    apiKey.startsWith("sk-or-")
  );
}
