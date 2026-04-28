// src/utils/citationLogic.js

export const detectSiteType = (urlString) => {
    try {
        // Forzamos a que tenga un protocolo si el usuario solo escribe "www.sitio.com"
        const validUrl = urlString.startsWith('http') ? urlString : `https://${urlString}`;
        const urlObj = new URL(validUrl);
        const hostname = urlObj.hostname.toLowerCase();

        // 1. Detección de sitios académicos
        if (hostname.endsWith('.edu') || hostname.endsWith('.edu.co') || hostname.includes('scielo') || hostname.includes('dialnet')) {
            return 'academic';
        }

        // 2. Detección de noticias / periódicos
        const newsSites = ['eltiempo.com', 'elespectador.com', 'nytimes.com', 'elpais.com', 'bbc.com'];
        if (newsSites.some(site => hostname.includes(site))) {
            return 'news';
        }

        // 3. Detección de videos (YouTube, Vimeo)
        if (hostname.includes('youtube.com') || hostname.includes('youtu.be') || hostname.includes('vimeo.com')) {
            return 'video';
        }

        // 4. Wikis
        if (hostname.includes('wikipedia.org')) {
            return 'wiki';
        }

        // Si no coincide con nada, retorna 'unknown' para que el usuario confirme
        return 'unknown';

    } catch (error) {
        console.error("URL inválida:", error);
        return 'invalid';
    }
};