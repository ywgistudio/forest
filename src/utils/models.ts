export function getAvailableModels(apiKey: string): Promise<string[]> {
    return new Promise(async (resolve, reject) => {
        try {
            const response = await fetch("https://openrouter.ai/api/v1/models", {
                method: "GET",
                headers: {
                    Authorization: `Bearer ${apiKey}`,
                    "HTTP-Referer": window.location.href,
                    "X-Title": "Forest",
                },
            });
            const data = await response.json();
            
            if (data.error) {
                console.error("OpenRouter API error:", data.error);
                reject(new Error(data.error.message || "Failed to fetch models"));
                return;
            }
            
            if (!data.data || !Array.isArray(data.data)) {
                console.error("Unexpected API response:", data);
                resolve([]);
                return;
            }
            
            resolve(data.data.map((model: any) => model.id).sort());
        } catch (err) {
            console.error("Error fetching models:", err);
            reject(err);
        }
    });
};

export function getAvailableChatModels(apiKey: string): Promise<string[]> {
    return new Promise((resolve, reject) => {
        getAvailableModels(apiKey)
            .then((models) => {
                // OpenRouter models use various prefixes, not just gpt-
                // We'll keep all models since OpenRouter mainly provides chat models
                resolve(models);
            })
            .catch((err) => {
                reject(err);
            });
    });
};
