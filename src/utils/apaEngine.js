// src/utils/apaEngine.js

export const formatAPA = (type, data) => {
    const author = data.author ? data.author.trim() : 'Autor desconocido';
    const year = data.year ? data.year.trim() : 's.f.';
    const title = data.title ? data.title.trim() : 'Título desconocido';
    const siteName = data.siteName ? data.siteName.trim() : '';
    const url = data.url ? data.url.trim() : '';

    let retrievalStr = '';
    if (data.isDynamic) {
        const today = new Date();
        const months = ['enero', 'febrero', 'marzo', 'abril', 'mayo', 'junio', 'julio', 'agosto', 'septiembre', 'octubre', 'noviembre', 'diciembre'];
        retrievalStr = ` Recuperado el ${today.getDate()} de ${months[today.getMonth()]} de ${today.getFullYear()}, de `;
    } else {
        retrievalStr = ' ';
    }

    const segments = [];
    const add = (text, italic = false) => { if (text) segments.push({ text, italic }); };

    // Casos especiales que no inician con el estándar "Autor. (Año)."
    if (type === 'chatgpt') {
        add(`OpenAI. (${year}). `);
        add(`ChatGPT`, true);
        add(` [Modelo de lenguaje de gran tamaño]. ${url}`);
        return segments;
    }

    // Inicio estándar
    add(`${author}. (${year}). `);

    switch (type) {
        case 'academic':
            add(`${title}. `);
            if (siteName) add(`${siteName}.`, true);
            add(`${retrievalStr}${url}`);
            break;

        case 'news':
            add(`${title}. `);
            if (siteName) add(`${siteName}.`, true);
            add(`${retrievalStr}${url}`);
            break;

        case 'video':
            add(`${title}`, true);
            add(` [Archivo de Video]. ${siteName ? siteName + '.' : 'YouTube.'}${retrievalStr}${url}`);
            break;

        case 'book':
            add(`${title}.`, true);
            if (siteName) add(` ${siteName}.`); // Editorial
            if (url) add(`${retrievalStr}${url}`);
            break;

        case 'social':
            add(`${title}`, true);
            add(` [Publicación en red social]. ${siteName ? siteName + '.' : ''}${retrievalStr}${url}`);
            break;

        case 'dictionary':
            add(`${title}. En `);
            add(`${siteName ? siteName : 'Diccionario en línea'}`, true);
            add(`.${retrievalStr}${url}`);
            break;

        case 'wiki':
            add(`${title}. En `);
            add(`Wikipedia`, true);
            add(`.${retrievalStr}${url}`);
            break;

        case 'webpage':
        default:
            add(`${title}.`, true);
            if (siteName) add(` ${siteName}.`);
            add(`${retrievalStr}${url}`);
            break;
    }

    return segments;
};