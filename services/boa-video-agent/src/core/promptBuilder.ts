
import { ArticleMetadata } from '../clients/boa';

export class PromptBuilder {
    static build(article: ArticleMetadata): string {
        const country = article.country || "Africa";
        const topic = article.topic || "Travel";

        // Use tourist variant if available, otherwise fall back to title + description
        const baseContext = article.variants?.tourist || `${article.title}. ${article.description}`;

        // Extract key visual elements (naive implementation for now)
        // Ideally we'd use an LLM here to summarize `baseContext` into a visual scene.
        // For MVP/Robustness, we use the deterministic template requested.

        // Sanitize inputs
        const cleanCountry = country.replace(/[^a-zA-Z\s]/g, '');
        const cleanTopic = topic.replace(/[^a-zA-Z\s]/g, '');

        // Construct the prompt using the strict template
        // “Cinematic 10-second travel montage in [Country], focusing on [Topic/City]: 
        // sweeping aerial shots, then close-ups of a traveler experiencing local culture. 
        // Warm golden-hour lighting, smooth camera motion, shallow depth of field.”

        return `Cinematic 10-second travel montage in ${cleanCountry}, focusing on ${cleanTopic}: sweeping aerial shots, then close-ups of a traveler experiencing local culture. Warm golden-hour lighting, smooth camera motion, shallow depth of field.`;
    }
}
