import axios from 'axios';

export class Translator {
    private apiKey: string;
    private baseUrl: string;

    constructor() {
        this.apiKey = process.env.MOONSHOT_API_KEY || '';
        this.baseUrl = 'https://api.moonshot.cn/v1';

        if (!this.apiKey) {
            console.warn("MOONSHOT_API_KEY missing. Translations will be skipped.");
        }
    }

    async translate(text: string, targetLang: string): Promise<string | null> {
        if (!this.apiKey || !text) return null;

        try {
            const response = await axios.post(
                `${this.baseUrl}/chat/completions`,
                {
                    model: "moonshot-v1-8k",
                    messages: [
                        {
                            role: "system",
                            content: `Translate to ${targetLang}. Preserve facts, numbers, and style. Output ONLY the translated text.`
                        },
                        { role: "user", content: text }
                    ],
                    temperature: 0.3
                },
                {
                    headers: {
                        'Authorization': `Bearer ${this.apiKey}`,
                        'Content-Type': 'application/json'
                    }
                }
            );

            return response.data?.choices?.[0]?.message?.content?.trim() || null;
        } catch (error) {
            console.error(`Translation failed (to ${targetLang}):`, error);
            return null;
        }
    }
}

export const translator = new Translator();
