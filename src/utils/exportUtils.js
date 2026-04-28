import { jsPDF } from "jspdf";
import { Document, Packer, Paragraph, TextRun, AlignmentType } from "docx";
import { saveAs } from "file-saver";

// 1. EXPORTAR A PDF (Formato APA Estricto - Texto Plano)
export const exportToPDF = (citations) => {
    if (citations.length === 0) return alert("La lista de referencias está vacía");

    // Ordenamos alfabéticamente usando el texto plano (rawText)
    const sortedCitations = [...citations].sort((a, b) => (a.rawText || "").localeCompare(b.rawText || ""));

    const doc = new jsPDF({ format: 'letter' });

    const margin = 25.4;
    const pageWidth = doc.internal.pageSize.getWidth();
    const hangingIndent = 12.7;
    const maxLineWidth = pageWidth - (margin * 2) - hangingIndent;

    doc.setFont("times", "bold");
    doc.setFontSize(12);

    const title = "Referencias";
    const titleWidth = doc.getTextWidth(title);
    doc.text(title, (pageWidth - titleWidth) / 2, margin);

    doc.setFont("times", "normal");
    let yPosition = margin + 10;

    sortedCitations.forEach((cit) => {
        // Usamos rawText para el PDF ya que jsPDF no maneja bien múltiples estilos por línea
        const textToPrint = cit.rawText || cit.formatted;
        const lines = doc.splitTextToSize(textToPrint, maxLineWidth);

        lines.forEach((line, index) => {
            if (yPosition > 250) {
                doc.addPage();
                yPosition = margin;
            }
            const xOffset = index === 0 ? margin : margin + hangingIndent;
            doc.text(line, xOffset, yPosition);
            yPosition += 8;
        });
    });

    doc.save("Referencias_APA.pdf");
};

// 2. EXPORTAR A DOCX (Word - Aplica Cursivas Nativas)
export const exportToDocx = async (citations) => {
    if (citations.length === 0) return alert("La lista de referencias está vacía");

    const sortedCitations = [...citations].sort((a, b) => (a.rawText || "").localeCompare(b.rawText || ""));

    const doc = new Document({
        styles: {
            default: {
                document: {
                    run: {
                        font: "Times New Roman",
                        size: 24,
                    },
                },
            },
        },
        sections: [{
            properties: {},
            children: [
                new Paragraph({
                    children: [new TextRun({ text: "Referencias", bold: true })],
                    alignment: AlignmentType.CENTER,
                    spacing: { after: 400 },
                }),
                ...sortedCitations.map(cit => new Paragraph({
                    // Mapeamos los segmentos para activar la cursiva nativa de Word
                    children: Array.isArray(cit.formatted)
                        ? cit.formatted.map(seg => new TextRun({ text: seg.text, italics: seg.italic }))
                        : [new TextRun({ text: cit.formatted })], // Fallback citas antiguas
                    indent: { hanging: 720, left: 720 },
                    spacing: { line: 480 },
                }))
            ],
        }],
    });

    const blob = await Packer.toBlob(doc);
    saveAs(blob, "Referencias_APA.docx");
};