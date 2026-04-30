import React, { useState, useEffect } from 'react';
import { detectSiteType } from './utils/citationLogic';
import { formatAPA } from './utils/apaEngine';
import { exportToPDF, exportToDocx } from './utils/exportUtils';

function App() {
  const [darkMode, setDarkMode] = useState(false);
  const toggleDarkMode = () => setDarkMode(!darkMode);

  const [url, setUrl] = useState('');
  const [siteType, setSiteType] = useState(null);
  const [needsConfirmation, setNeedsConfirmation] = useState(false);

  // NUEVO: Añadimos isExtracted al estado inicial
  const [citationData, setCitationData] = useState({ author: '', year: '', title: '', siteName: '', isDynamic: false, isExtracted: false });
  const [finalCitation, setFinalCitation] = useState([]);

  const [isLoading, setIsLoading] = useState(false);

  const [citations, setCitations] = useState([]);
  const [currentPage, setCurrentPage] = useState(1);
  const itemsPerPage = 4;

  const [editingId, setEditingId] = useState(null);
  const [editData, setEditData] = useState(null);

  useEffect(() => {
    const savedCitations = localStorage.getItem('citeTheSite_history');
    if (savedCitations) {
      setCitations(JSON.parse(savedCitations));
    }
  }, []);

  useEffect(() => {
    localStorage.setItem('citeTheSite_history', JSON.stringify(citations));
  }, [citations]);

  const handleGenerateClick = async () => {
    if (!url.trim()) return alert("Por favor ingresa una URL válida");

    setFinalCitation([]);
    const detected = detectSiteType(url);

    if (detected === 'invalid') return alert("La URL no es válida.");

    setIsLoading(true);

    try {
      const response = await fetch(`https://api.microlink.io?url=${encodeURIComponent(url)}`);
      const apiData = await response.json();

      if (apiData.status === 'success') {
        const extracted = apiData.data;

        let yearExtracted = 's.f.';
        if (extracted.date) {
          yearExtracted = new Date(extracted.date).getFullYear().toString();
        }

        // NUEVO: Le decimos al estado que SÍ fue extraído por la API
        setCitationData({
          author: extracted.author || '',
          year: yearExtracted,
          title: extracted.title || '',
          siteName: extracted.publisher || '',
          isDynamic: false,
          isExtracted: true
        });
      }
    } catch (error) {
      console.error("Error al extraer datos:", error);
      // NUEVO: Si hay error, isExtracted es false
      setCitationData({ author: '', year: '', title: '', siteName: '', isDynamic: false, isExtracted: false });
    } finally {
      setIsLoading(false);

      if (detected === 'unknown') {
        setNeedsConfirmation(true);
        setSiteType(null);
      } else {
        setNeedsConfirmation(false);
        setSiteType(detected);
      }
    }
  };

  const confirmType = (type) => {
    setSiteType(type);
    setNeedsConfirmation(false);
  };

  const handleCreateCitation = () => {
    const dataToProcess = { ...citationData, url };
    const formattedSegments = formatAPA(siteType, dataToProcess);
    const rawTextString = formattedSegments.map(s => s.text).join('');

    setFinalCitation(formattedSegments);

    const newCitation = {
      id: Date.now().toString(),
      type: siteType,
      data: dataToProcess,
      formatted: formattedSegments,
      rawText: rawTextString
    };

    setCitations([newCitation, ...citations]);
    setSiteType(null);
    // NUEVO: Limpiamos la bandera al terminar
    setCitationData({ author: '', year: '', title: '', siteName: '', isDynamic: false, isExtracted: false });
    setUrl('');
  };

  const startEditing = (cit) => {
    setEditingId(cit.id);
    setEditData(cit.data);
  };

  const cancelEditing = () => {
    setEditingId(null);
    setEditData(null);
  };

  const handleUpdateCitation = () => {
    const citationToUpdate = citations.find(c => c.id === editingId);

    const newFormatted = formatAPA(citationToUpdate.type, editData);
    const newRawText = newFormatted.map(s => s.text).join('');

    const updatedCitations = citations.map(c => c.id === editingId ? { ...c, data: editData, formatted: newFormatted, rawText: newRawText } : c);

    setCitations(updatedCitations);
    setEditingId(null);
    setEditData(null);
  };

  const handleDelete = (id) => {
    setCitations(citations.filter(c => c.id !== id));
    if (editingId === id) cancelEditing();
  };

  const indexOfLastItem = currentPage * itemsPerPage;
  const indexOfFirstItem = indexOfLastItem - itemsPerPage;
  const currentCitations = citations.slice(indexOfFirstItem, indexOfLastItem);
  const totalPages = Math.ceil(citations.length / itemsPerPage);

  return (
    <div className={darkMode ? 'dark' : ''}>
      <div className="min-h-screen lg:h-screen flex flex-col font-sans text-slate-700 dark:text-slate-200 bg-gradient-to-br from-serenity-50 via-serenity-100 to-serenity-50 dark:from-slate-900 dark:via-slate-800 dark:to-slate-900 transition-colors duration-300">

        {/* HEADER */}
        <header className="h-auto py-3 lg:py-0 lg:h-12 flex flex-wrap lg:flex-nowrap items-center justify-between px-4 lg:px-6 bg-white/50 dark:bg-slate-800/50 backdrop-blur-lg border-b border-white/40 dark:border-slate-700/40 flex-shrink-0 sticky top-0 z-50">
          <div className="flex items-center gap-2 lg:gap-3 w-full lg:w-auto justify-between lg:justify-start mb-2 lg:mb-0">
            <h1 className="text-sm font-bold tracking-tight uppercase text-serenity-800 dark:text-serenity-200">CitaElSitio</h1>
            <button
              onClick={toggleDarkMode}
              className="w-7 h-7 flex items-center justify-center rounded-lg border border-serenity-200/60 dark:border-slate-600/60 bg-white/40 dark:bg-slate-700/40 text-serenity-500 dark:text-serenity-300 transition-colors"
              title={darkMode ? 'Modo claro' : 'Modo oscuro'}
            >
              {darkMode ? (
                <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 3v1m0 16v1m9-9h-1M4 12H3m15.364 6.364l-.707-.707M6.343 6.343l-.707-.707m12.728 0l-.707.707M6.343 17.657l-.707.707M16 12a4 4 0 11-8 0 4 4 0 018 0z" /></svg>
              ) : (
                <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M20.354 15.354A9 9 0 018.646 3.646 9.003 9.003 0 0012 21a9.003 9.003 0 008.354-5.646z" /></svg>
              )}
            </button>
          </div>

          <div className="flex items-center gap-2 lg:gap-3 w-full lg:w-auto justify-end">
            <a
              href="https://github.com/valnorena"
              target="_blank"
              rel="noopener noreferrer"
              className="flex items-center gap-2 bg-slate-800 hover:bg-slate-900 dark:bg-slate-100 dark:hover:bg-white text-white dark:text-slate-900 text-xs font-bold px-4 py-1.5 rounded-lg transition-all shadow-sm active:scale-95"
            >
              <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 24 24" aria-hidden="true"><path fillRule="evenodd" d="M12 2C6.477 2 2 6.484 2 12.017c0 4.425 2.865 8.18 6.839 9.504.5.092.682-.217.682-.483 0-.237-.008-.868-.013-1.703-2.782.605-3.369-1.343-3.369-1.343-.454-1.158-1.11-1.466-1.11-1.466-.908-.62.069-.608.069-.608 1.003.07 1.531 1.032 1.531 1.032.892 1.53 2.341 1.088 2.91.832.092-.647.35-1.088.636-1.338-2.22-.253-4.555-1.113-4.555-4.951 0-1.093.39-1.988 1.029-2.688-.103-.253-.446-1.272.098-2.65 0 0 .84-.27 2.75 1.026A9.564 9.564 0 0112 6.844c.85.004 1.705.115 2.504.337 1.909-1.296 2.747-1.027 2.747-1.027.546 1.379.202 2.398.1 2.651.64.7 1.028 1.595 1.028 2.688 0 3.848-2.339 4.695-4.566 4.943.359.309.678.92.678 1.855 0 1.338-.012 2.419-.012 2.747 0 .268.18.58.688.482A10.019 10.019 0 0022 12.017C22 6.484 17.522 2 12 2z" clipRule="evenodd" /></svg>
              Ver en GitHub
            </a>
          </div>
        </header>

        <main className="flex-1 p-4 flex flex-col lg:grid lg:grid-cols-3 lg:grid-rows-2 gap-4 lg:gap-3 lg:min-h-0 overflow-y-auto lg:overflow-hidden">

          {/* 1. GENERAR CITA */}
          <div className="order-1 lg:order-none lg:col-span-2 bg-white/50 dark:bg-slate-800/40 backdrop-blur-md border border-white/50 dark:border-slate-700/40 rounded-2xl p-4 lg:p-5 flex flex-col overflow-y-visible lg:overflow-y-auto shadow-sm lg:shadow-none">
            <h2 className="text-[10px] font-bold text-serenity-400 dark:text-serenity-300/60 tracking-[0.2em] uppercase mb-4 shrink-0">
              Generar Nueva Cita
            </h2>

            <div className="flex flex-col sm:flex-row gap-2 mb-4 shrink-0">
              <div className="flex-1 relative">
                <svg className="w-4 h-4 absolute left-3 top-2.5 text-serenity-300 dark:text-slate-500" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M21 12a9 9 0 01-9 9m9-9a9 9 0 00-9-9m9 9H3m9 9a9 9 0 01-9-9m9 9c1.657 0 3-4.03 3-9s-1.343-9-3-9m0 18c-1.657 0-3-4.03-3-9s1.343-9 3-9m-9 9a9 9 0 019-9" /></svg>
                <input
                  type="url"
                  value={url}
                  onChange={(e) => setUrl(e.target.value)}
                  placeholder="Pegar URL del sitio..."
                  className="w-full pl-9 pr-3 py-2 bg-white/60 dark:bg-slate-700/50 border border-serenity-100 dark:border-slate-600/50 rounded-xl text-sm dark:text-slate-100 placeholder-serenity-300 dark:placeholder-slate-500 focus:outline-none focus:border-serenity-400 transition-colors" />
              </div>
              <div className="flex gap-2 w-full sm:w-auto">
                <select className="bg-white/60 dark:bg-slate-700/50 border border-serenity-100 dark:border-slate-600/50 text-slate-600 dark:text-slate-300 text-sm rounded-xl px-3 py-2 focus:outline-none focus:border-serenity-400 w-full sm:w-auto">
                  <option>APA 7th</option>
                </select>
                <button
                  onClick={handleGenerateClick}
                  disabled={isLoading}
                  className={`w-full sm:w-auto text-sm font-bold px-5 py-2 rounded-xl transition-all ${isLoading
                    ? 'bg-slate-400 dark:bg-slate-600 cursor-not-allowed text-white'
                    : 'bg-slate-900 dark:bg-white text-white dark:text-slate-900 active:scale-95'}`}
                >
                  {isLoading ? 'Extrayendo...' : 'Citar Fuente'}
                </button>
              </div>
            </div>

            {needsConfirmation && (
              <div className="mb-4 p-4 border border-orange-200 dark:border-orange-900/50 bg-orange-50/80 dark:bg-orange-900/20 rounded-xl shrink-0">
                <p className="text-xs font-bold text-orange-800 dark:text-orange-300 mb-3">No logramos identificar la fuente exacta. Por favor, selecciona el tipo:</p>
                <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 text-xs">
                  <button onClick={() => confirmType('webpage')} className="px-2 py-2 bg-white dark:bg-slate-800 border border-orange-200 dark:border-orange-800 text-orange-800 dark:text-orange-300 rounded-lg shadow-sm hover:bg-orange-100 dark:hover:bg-orange-900 transition-colors">Pág. Web</button>
                  <button onClick={() => confirmType('academic')} className="px-2 py-2 bg-white dark:bg-slate-800 border border-orange-200 dark:border-orange-800 text-orange-800 dark:text-orange-300 rounded-lg shadow-sm hover:bg-orange-100 dark:hover:bg-orange-900 transition-colors">Artículo</button>
                  <button onClick={() => confirmType('news')} className="px-2 py-2 bg-white dark:bg-slate-800 border border-orange-200 dark:border-orange-800 text-orange-800 dark:text-orange-300 rounded-lg shadow-sm hover:bg-orange-100 dark:hover:bg-orange-900 transition-colors">Noticia</button>
                  <button onClick={() => confirmType('book')} className="px-2 py-2 bg-white dark:bg-slate-800 border border-orange-200 dark:border-orange-800 text-orange-800 dark:text-orange-300 rounded-lg shadow-sm hover:bg-orange-100 dark:hover:bg-orange-900 transition-colors">Libro</button>
                  <button onClick={() => confirmType('social')} className="px-2 py-2 bg-white dark:bg-slate-800 border border-orange-200 dark:border-orange-800 text-orange-800 dark:text-orange-300 rounded-lg shadow-sm hover:bg-orange-100 dark:hover:bg-orange-900 transition-colors">Social</button>
                  <button onClick={() => confirmType('video')} className="px-2 py-2 bg-white dark:bg-slate-800 border border-orange-200 dark:border-orange-800 text-orange-800 dark:text-orange-300 rounded-lg shadow-sm hover:bg-orange-100 dark:hover:bg-orange-900 transition-colors">Video</button>
                  <button onClick={() => confirmType('dictionary')} className="px-2 py-2 bg-white dark:bg-slate-800 border border-orange-200 dark:border-orange-800 text-orange-800 dark:text-orange-300 rounded-lg shadow-sm hover:bg-orange-100 dark:hover:bg-orange-900 transition-colors">Diccionario</button>
                  <button onClick={() => confirmType('chatgpt')} className="px-2 py-2 bg-white dark:bg-slate-800 border border-orange-200 dark:border-orange-800 text-orange-800 dark:text-orange-300 rounded-lg shadow-sm hover:bg-orange-100 dark:hover:bg-orange-900 transition-colors">ChatGPT</button>
                </div>
              </div>
            )}

            {siteType && (
              <div className="mb-4 p-4 bg-serenity-50/80 dark:bg-slate-700/30 border border-serenity-100 dark:border-slate-600/50 rounded-xl shrink-0">
                <div className="flex justify-between items-center mb-3">
                  <h3 className="text-xs font-bold text-slate-700 dark:text-slate-300 uppercase tracking-widest flex items-center gap-2 flex-wrap">
                    Revisar y Editar Datos ({siteType})
                    {/* NUEVO: Ahora solo brilla si la API realmente lo extrajo */}
                    {citationData.isExtracted && (
                      <span className="bg-green-100 text-green-700 text-[9px] px-2 py-0.5 rounded-full border border-green-200 tracking-normal hidden sm:inline-block">
                        Datos extraídos
                      </span>
                    )}
                  </h3>
                  <button onClick={() => setSiteType(null)} className="text-[10px] font-bold text-red-500 hover:text-red-400 transition-colors">✖ CANCELAR</button>
                </div>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-3 mb-3">
                  <input type="text" placeholder="Autor (Ej. Perez, J.)" value={citationData.author} onChange={e => setCitationData({ ...citationData, author: e.target.value })} className="w-full p-2.5 bg-white dark:bg-slate-800 border border-serenity-100 dark:border-slate-600 rounded-lg text-xs focus:outline-none focus:border-serenity-400 dark:text-white" />
                  <input type="text" placeholder="Año (Ej. 2024 o s.f.)" value={citationData.year} onChange={e => setCitationData({ ...citationData, year: e.target.value })} className="w-full p-2.5 bg-white dark:bg-slate-800 border border-serenity-100 dark:border-slate-600 rounded-lg text-xs focus:outline-none focus:border-serenity-400 dark:text-white" />
                  <input type="text" placeholder="Título del Artículo / Página / Video" value={citationData.title} onChange={e => setCitationData({ ...citationData, title: e.target.value })} className="w-full md:col-span-2 p-2.5 bg-white dark:bg-slate-800 border border-serenity-100 dark:border-slate-600 rounded-lg text-xs focus:outline-none focus:border-serenity-400 dark:text-white" />
                  <input type="text" placeholder="Nombre del Sitio Web o Revista" value={citationData.siteName} onChange={e => setCitationData({ ...citationData, siteName: e.target.value })} className="w-full md:col-span-2 p-2.5 bg-white dark:bg-slate-800 border border-serenity-100 dark:border-slate-600 rounded-lg text-xs focus:outline-none focus:border-serenity-400 dark:text-white" />
                </div>
                <div className="flex items-start sm:items-center gap-2 mb-4">
                  <input
                    type="checkbox"
                    id="dynamicCheck"
                    checked={citationData.isDynamic}
                    onChange={(e) => setCitationData({ ...citationData, isDynamic: e.target.checked })}
                    className="w-4 h-4 mt-0.5 sm:mt-0 text-serenity-600 bg-white border-serenity-300 rounded cursor-pointer shrink-0" />
                  <label htmlFor="dynamicCheck" className="text-[10px] font-bold text-slate-500 dark:text-slate-400 uppercase tracking-widest cursor-pointer leading-tight">
                    Página con actualizaciones frecuentes (Requiere fecha)
                  </label>
                </div>
                <button onClick={handleCreateCitation} className="w-full bg-serenity-600 hover:bg-serenity-700 dark:bg-serenity-500 dark:hover:bg-serenity-600 text-white text-xs font-bold py-3 rounded-lg transition-colors shadow-sm">
                  Guardar en Referencias
                </button>
              </div>
            )}

            <div className="flex-1 mt-4 lg:mt-auto bg-serenity-50/50 dark:bg-serenity-900/20 border-l-4 border-serenity-400 dark:border-serenity-500 rounded-r-xl p-4 flex items-center break-words">
              {finalCitation && finalCitation.length > 0 ? (
                <p className="text-sm text-slate-800 dark:text-slate-100 font-medium selection:bg-serenity-200">
                  {/* RENDERIZA LOS SEGMENTOS CON CURSIVA */}
                  {Array.isArray(finalCitation) ? finalCitation.map((seg, i) => (
                    <span key={i} className={seg.italic ? 'italic' : ''}>{seg.text}</span>
                  )) : finalCitation}
                </p>
              ) : (
                <p className="text-sm text-serenity-400 dark:text-slate-500 italic">Su última cita aparecerá aquí automáticamente.</p>
              )}
            </div>
          </div>

          {/* 2. REFERENCIAS */}
          <div className="order-3 lg:order-none lg:row-span-2 bg-white/50 dark:bg-slate-800/40 backdrop-blur-md border border-white/50 dark:border-slate-700/40 rounded-2xl p-4 lg:p-5 flex flex-col min-h-[400px] lg:min-h-0 shadow-sm lg:shadow-none">
            <div className="flex justify-between items-center mb-5 shrink-0">
              <h2 className="text-[10px] font-bold text-serenity-400 dark:text-serenity-300/60 tracking-[0.2em] uppercase">
                Referencias
              </h2>
              <span className="text-[10px] font-bold text-serenity-400 bg-serenity-50/60 dark:bg-slate-700/60 px-2 py-0.5 rounded">
                {citations.length} ENTRADAS
              </span>
            </div>

            <div className="flex-1 overflow-y-auto pr-1 flex flex-col gap-3">
              {citations.length === 0 ? (
                <div className="h-full flex flex-col items-center justify-center text-serenity-200 dark:text-slate-600">
                  <svg className="w-10 h-10 mb-3 opacity-50" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="1.5" d="M12 6.253v13m0-13C10.832 5.477 9.246 5 7.5 5S4.168 5.477 3 6.253v13C4.168 18.477 5.754 18 7.5 18s3.332.477 4.5 1.253m0-13C13.168 5.477 14.754 5 16.5 5c1.747 0 3.332.477 4.5 1.253v13C19.832 18.477 18.247 18 16.5 18c-1.746 0-3.332.477-4.5 1.253" /></svg>
                  <span className="text-[10px] font-bold tracking-widest uppercase">Lista Vacía</span>
                </div>
              ) : (
                currentCitations.map(cit => (
                  <div
                    key={cit.id}
                    onClick={() => startEditing(cit)}
                    className={`group p-3 rounded-xl border text-xs cursor-pointer transition-all break-words ${editingId === cit.id
                      ? 'bg-serenity-100 dark:bg-slate-700 border-serenity-400 dark:border-serenity-500 shadow-sm'
                      : 'bg-white dark:bg-slate-800 border-serenity-100 dark:border-slate-600 hover:border-serenity-300 dark:hover:border-slate-500'}`}
                  >
                    <p className="text-slate-700 dark:text-slate-200 line-clamp-4 leading-relaxed">
                      {Array.isArray(cit.formatted)
                        ? cit.formatted.map((seg, i) => <span key={i} className={seg.italic ? 'italic' : ''}>{seg.text}</span>)
                        : cit.formatted}
                    </p>
                    <div className="mt-3 flex justify-end opacity-100 lg:opacity-0 lg:group-hover:opacity-100 transition-opacity">
                      <button
                        onClick={(e) => { e.stopPropagation(); handleDelete(cit.id); }}
                        className="text-[10px] font-bold text-white bg-red-400 hover:bg-red-500 lg:text-red-400 lg:bg-transparent lg:hover:text-red-600 dark:text-red-400 px-3 py-1.5 lg:p-0 rounded-lg lg:rounded-none uppercase tracking-wider transition-colors"
                      >
                        Eliminar
                      </button>
                    </div>
                  </div>
                ))
              )}
            </div>

            {citations.length > itemsPerPage && (
              <div className="flex justify-between items-center pt-4 mt-2 border-t border-serenity-100/50 dark:border-slate-700/50 shrink-0">
                <button
                  disabled={currentPage === 1}
                  onClick={() => setCurrentPage(prev => prev - 1)}
                  className="text-xs text-slate-500 dark:text-slate-400 font-bold disabled:opacity-30 hover:text-slate-800 dark:hover:text-white transition-colors py-2"
                >← Anterior</button>
                <span className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">Pág {currentPage} de {totalPages}</span>
                <button
                  disabled={currentPage === totalPages}
                  onClick={() => setCurrentPage(prev => prev + 1)}
                  className="text-xs text-slate-500 dark:text-slate-400 font-bold disabled:opacity-30 hover:text-slate-800 dark:hover:text-white transition-colors py-2"
                >Siguiente →</button>
              </div>
            )}

            <div className="flex gap-2 pt-4 border-t border-serenity-100/50 dark:border-slate-700/50 mt-4 shrink-0">
              <button
                onClick={() => exportToPDF(citations)}
                className="flex-1 py-2.5 bg-serenity-100 dark:bg-slate-700 border border-serenity-300 dark:border-slate-500 rounded-lg text-xs font-bold text-serenity-700 dark:text-slate-300 flex items-center justify-center gap-1.5 hover:bg-serenity-200 dark:hover:bg-slate-600 transition-colors"
              >
                <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-4l-4 4m0 0l-4-4m4 4V4" /></svg>
                PDF
              </button>
              <button
                onClick={() => exportToDocx(citations)}
                className="flex-1 py-2.5 bg-serenity-100 dark:bg-slate-700 border border-serenity-300 dark:border-slate-500 rounded-lg text-xs font-bold text-serenity-700 dark:text-slate-300 flex items-center justify-center gap-1.5 hover:bg-serenity-200 dark:hover:bg-slate-600 transition-colors"
              >
                <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" /></svg>
                DOCX
              </button>
            </div>
          </div>

          {/* 3. GUIA APA */}
          <div className="order-4 lg:order-none bg-white/50 lg:bg-transparent dark:bg-slate-800/40 lg:dark:bg-transparent backdrop-blur-md lg:backdrop-blur-none border border-white/50 lg:border-none dark:border-slate-700/40 rounded-2xl p-4 lg:p-5 flex flex-col overflow-y-visible lg:overflow-y-auto shadow-sm lg:shadow-none">
            <h2 className="text-[10px] font-bold text-serenity-400 dark:text-serenity-300/60 tracking-[0.2em] uppercase mb-4 shrink-0">
              Guía APA
            </h2>

            <div className="flex flex-col gap-3">
              <div className="bg-serenity-700 dark:bg-serenity-800 rounded-xl p-3 text-white shadow-md shrink-0">
                <span className="text-[10px] font-bold text-serenity-200 tracking-wider uppercase">Los 4 Pilares</span>
                <p className="text-xs mt-1 text-white/90 font-mono">¿Quién? (Cuándo). ¿Qué? ¿Dónde?</p>
              </div>

              <ul className="text-xs text-slate-600 dark:text-slate-300 space-y-2 mt-1 px-1">
                <li className="flex gap-2">
                  <span className="font-black text-serenity-500">1.</span>
                  <p><strong className="text-slate-800 dark:text-slate-100">Autor:</strong> Apellido, Inicial. (O el nombre de la organización corporativa).</p>
                </li>
                <li className="flex gap-2">
                  <span className="font-black text-serenity-500">2.</span>
                  <p><strong className="text-slate-800 dark:text-slate-100">Fecha:</strong> (Año, 00 de mes) o la abreviatura (s.f.) si no hay fecha visible.</p>
                </li>
                <li className="flex gap-2">
                  <span className="font-black text-serenity-500">3.</span>
                  <p><strong className="text-slate-800 dark:text-slate-100">Título:</strong> Nombre exacto de la obra. (Usa cursiva si es un sitio web o libro).</p>
                </li>
                <li className="flex gap-2">
                  <span className="font-black text-serenity-500">4.</span>
                  <p><strong className="text-slate-800 dark:text-slate-100">Fuente:</strong> Medio, Editorial y URL directo. (Omitir si el autor es la misma fuente).</p>
                </li>
              </ul>

              {/* Callout Informativo Actualizado */}
              <div className="p-3 bg-orange-50 dark:bg-orange-900/20 border border-orange-100 dark:border-orange-800/50 rounded-lg mt-2 lg:mt-auto shrink-0 flex flex-col gap-2">
                <p className="text-[10px] text-orange-800 dark:text-orange-300 leading-relaxed">
                  <strong className="uppercase tracking-wider block mb-0.5">Uso de Cursivas:</strong>
                  En APA, la cursiva indica la <em>obra principal</em>. En libros, páginas web o videos, va en el título. En artículos o noticias, va en el nombre de la revista/periódico.
                </p>

                <div className="h-px w-full bg-orange-200/50 dark:bg-orange-800/50 my-0.5"></div>

                <p className="text-[10px] text-orange-800 dark:text-orange-300 leading-relaxed">
                  <strong className="uppercase tracking-wider block mb-0.5">Aviso de Extracción:</strong>
                  Si un sitio web cuenta con protección anti-bots o carece de etiquetas SEO (Metadatos), los campos quedarán en blanco. Deberás completarlos manualmente usando los 4 pilares superiores.
                </p>
              </div>
            </div>
          </div>

          {/* 4. AJUSTES */}
          <div className="order-2 lg:order-none bg-white/50 dark:bg-slate-800/40 backdrop-blur-md border border-white/50 dark:border-slate-700/40 rounded-2xl p-4 lg:p-5 flex flex-col overflow-hidden min-h-[300px] lg:min-h-0 shadow-sm lg:shadow-none">
            <h2 className="text-[10px] font-bold text-serenity-400 dark:text-serenity-300/60 tracking-[0.2em] uppercase mb-4 shrink-0">
              Últimos Ajustes
            </h2>

            {editingId && editData ? (
              <div className="flex flex-col h-full overflow-y-auto pr-1">
                <div className="flex flex-col gap-3 mb-3">
                  <div>
                    <label className="text-[10px] font-bold text-slate-400 dark:text-slate-500 uppercase tracking-widest">Autor</label>
                    <input type="text" value={editData.author} onChange={e => setEditData({ ...editData, author: e.target.value })} className="w-full mt-1 p-2 bg-white dark:bg-slate-800 border border-serenity-100 dark:border-slate-600 rounded-lg text-xs focus:outline-none focus:border-serenity-400 dark:text-white" />
                  </div>
                  <div>
                    <label className="text-[10px] font-bold text-slate-400 dark:text-slate-500 uppercase tracking-widest">Año</label>
                    <input type="text" value={editData.year} onChange={e => setEditData({ ...editData, year: e.target.value })} className="w-full mt-1 p-2 bg-white dark:bg-slate-800 border border-serenity-100 dark:border-slate-600 rounded-lg text-xs focus:outline-none focus:border-serenity-400 dark:text-white" />
                  </div>
                  <div>
                    <label className="text-[10px] font-bold text-slate-400 dark:text-slate-500 uppercase tracking-widest">Título / Nombre</label>
                    <input type="text" value={editData.title} onChange={e => setEditData({ ...editData, title: e.target.value })} className="w-full mt-1 p-2 bg-white dark:bg-slate-800 border border-serenity-100 dark:border-slate-600 rounded-lg text-xs focus:outline-none focus:border-serenity-400 dark:text-white" />
                  </div>
                </div>

                <div className="flex items-start sm:items-center gap-2 mb-4 shrink-0">
                  <input
                    type="checkbox"
                    id="editDynamicCheck"
                    checked={editData.isDynamic}
                    onChange={(e) => setEditData({ ...editData, isDynamic: e.target.checked })}
                    className="w-4 h-4 mt-0.5 sm:mt-0 text-serenity-600 bg-white border-serenity-300 rounded cursor-pointer shrink-0" />
                  <label htmlFor="editDynamicCheck" className="text-[9px] font-bold text-slate-500 dark:text-slate-400 uppercase tracking-widest cursor-pointer leading-tight">
                    Actualización constante
                  </label>
                </div>

                <div className="flex gap-2 mt-auto shrink-0 pt-2">
                  <button onClick={cancelEditing} className="flex-1 py-2.5 bg-slate-200 dark:bg-slate-700 text-slate-600 dark:text-slate-300 text-xs font-bold rounded-lg hover:bg-slate-300 dark:hover:bg-slate-600 transition-colors">Cancelar</button>
                  <button onClick={handleUpdateCitation} className="flex-1 py-2.5 bg-serenity-600 dark:bg-serenity-500 text-white text-xs font-bold rounded-lg hover:bg-serenity-700 dark:hover:bg-serenity-600 transition-colors">Actualizar</button>
                </div>
              </div>
            ) : (
              <div className="flex-1 flex flex-col items-center justify-center text-serenity-200 dark:text-slate-600">
                <svg className="w-7 h-7 mb-2 opacity-50" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="1.5" d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" /></svg>
                <span className="text-xs font-medium text-center px-4">Selecciona una cita de las referencias para editar sus datos.</span>
              </div>
            )}
          </div>

        </main>
      </div>
    </div>
  );
}

export default App;