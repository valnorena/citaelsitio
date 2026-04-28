// src/utils/apaEngine.js

export const formatAPA = (type, data) => {
    const author = data.author ? data.author.trim() : 'Autor desconocido';
    const year = data.year ? data.year.trim() : 's.f.';
    const title = data.title ? data.title.trim() : 'Título desconocido';
    const siteName = data.siteName ? data.siteName.trim() : '';
    const url = data.url ? data.url.trim() : '';

    // LÓGICA APA 7ma Edición: Recuperado de...
    let retrievalStr = '';

    if (data.isDynamic) {
        // Si la página es dinámica, generamos la fecha actual
        const today = new Date();
        const months = ['enero', 'febrero', 'marzo', 'abril', 'mayo', 'junio', 'julio', 'agosto', 'septiembre', 'octubre', 'noviembre', 'diciembre'];
        // Formato exacto APA: Recuperado el [DIA] de [MES] de [AÑO], de 
        retrievalStr = ` Recuperado el ${today.getDate()} de ${months[today.getMonth()]} de ${today.getFullYear()}, de `;
    } else {
        // Si es estática, la URL va directamente separada por un espacio
        retrievalStr = ' ';
    }

    // NUEVA LÓGICA: Separamos el texto en segmentos para aplicar cursiva (Italics)
    const segments = [];
    const add = (text, italic = false) => { if (text) segments.push({ text, italic }); };

    add(`${author}. (${year}). `);

    // Estructuras APA según tipo
    switch (type) {
        case 'academic': // El nombre de la revista va en cursiva
            add(`${title}. `);
            if (siteName) add(`${siteName}.`, true);
            add(`${retrievalStr}${url}`);
            break;

        case 'news': // El nombre del periódico va en cursiva
            add(`${title}. `);
            if (siteName) add(`${siteName}.`, true);
            add(`${retrievalStr}${url}`);
            break;

        case 'video': // El título del video va en cursiva
            add(`${title}`, true);
            add(` [Archivo de Video]. ${siteName ? siteName + '.' : 'YouTube.'}${retrievalStr}${url}`);
            break;

        case 'webpage':
        default: // El título de la página web va en cursiva
            add(`${title}.`, true);
            if (siteName) add(` ${siteName}.`);
            add(`${retrievalStr}${url}`);
            break;
    }

    return segments;
};