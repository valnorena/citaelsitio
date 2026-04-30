// src/utils/citationLogic.js

export const detectSiteType = (urlString) => {
    try {
        const validUrl = urlString.startsWith('http') ? urlString : `https://${urlString}`;
        const urlObj = new URL(validUrl);
        const hostname = urlObj.hostname.toLowerCase();

        // 1. Academia y Revistas
        if (hostname.endsWith('.edu') || hostname.endsWith('.edu.co') || hostname.includes('scielo') || hostname.includes('dialnet')) {
            return 'academic';
        }

        // 2. Noticias
        const newsSites = ['eltiempo.com', 'elespectador.com', 'nytimes.com', 'elpais.com', 'bbc.com'];
        if (newsSites.some(site => hostname.includes(site))) {
            return 'news';
        }

        // 3. Videos
        if (hostname.includes('youtube.com') || hostname.includes('youtu.be') || hostname.includes('vimeo.com')) {
            return 'video';
        }

        // 4. Wikis
        if (hostname.includes('wikipedia.org')) {
            return 'wiki';
        }

        // 5. Redes Sociales (NUEVO)
        if (hostname.includes('twitter.com') || hostname.includes('x.com') || hostname.includes('facebook.com') || hostname.includes('instagram.com')) {
            return 'social';
        }

        // 6. Diccionarios (NUEVO)
        if (hostname.includes('rae.es') || hostname.includes('merriam-webster.com') || hostname.includes('significados.com')) {
            return 'dictionary';
        }

        // 7. IA / ChatGPT (NUEVO)
        if (hostname.includes('chat.openai.com') || hostname.includes('chatgpt.com')) {
            return 'chatgpt';
        }

        return 'unknown';

    } catch (error) {
        console.error("URL inválida:", error);
        return 'invalid';
    }
};