// backend/controllers/juntasController_reportes.js
import ExcelJS from 'exceljs';
import { Document, Packer, Paragraph, Table, TableCell, TableRow } from 'docx';
import PDFDocument from 'pdfkit';

export const exportarReporte = async (req, res) => {
  const { tipo } = req.params;  // edades, comisiones, activas, etc.
  const { format } = req.query; // excel, word, pdf
  const { municipios } = req.query; // para reporte de municipios
  
  try {
    // 1. Obtener los datos del reporte (reutilizar funciones existentes)
    let data;
    switch(tipo) {
      case 'edades':
        data = await obtenerReporteEdades();
        break;
      case 'comisiones':
        data = await obtenerReporteComisiones();
        break;
      // ... otros casos
    }
    
    // 2. Generar el archivo según el formato
    if (format === 'excel') {
      const buffer = await generarExcel(data, tipo);
      res.setHeader('Content-Type', 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet');
      res.setHeader('Content-Disposition', `attachment; filename="${tipo}.xlsx"`);
      return res.send(buffer);
    }
    
    if (format === 'word') {
      const buffer = await generarWord(data, tipo);
      res.setHeader('Content-Type', 'application/vnd.openxmlformats-officedocument.wordprocessingml.document');
      res.setHeader('Content-Disposition', `attachment; filename="${tipo}.docx"`);
      return res.send(buffer);
    }
    
    if (format === 'pdf') {
      const buffer = await generarPDF(data, tipo);
      res.setHeader('Content-Type', 'application/pdf');
      res.setHeader('Content-Disposition', `attachment; filename="${tipo}.pdf"`);
      return res.send(buffer);
    }
    
  } catch (error) {
    console.error('Error generando reporte:', error);
    res.status(500).json({ error: 'Error al generar el reporte' });
  }
};

// Función helper para generar Excel
async function generarExcel(data, tipo) {
  const workbook = new ExcelJS.Workbook();
  const worksheet = workbook.addWorksheet(tipo);
  
  // Agregar headers
  worksheet.columns = [
    { header: data.labels ? 'Categoría' : 'Item', key: 'label', width: 30 },
    { header: 'Cantidad', key: 'value', width: 15 }
  ];
  
  // Agregar datos
  if (data.labels && data.series) {
    data.labels.forEach((label, i) => {
      worksheet.addRow({ label, value: data.series[i] });
    });
  }
  
  // Styling
  worksheet.getRow(1).font = { bold: true };
  worksheet.getRow(1).fill = {
    type: 'pattern',
    pattern: 'solid',
    fgColor: { argb: 'FF009E76' }
  };
  
  return await workbook.xlsx.writeBuffer();
}

// Función helper para generar Word
async function generarWord(data, tipo) {
  const doc = new Document({
    sections: [{
      children: [
        new Paragraph({ text: `Informe: ${tipo}`, heading: 'Heading1' }),
        new Table({
          rows: [
            new TableRow({
              children: [
                new TableCell({ children: [new Paragraph('Categoría')] }),
                new TableCell({ children: [new Paragraph('Cantidad')] })
              ]
            }),
            ...(data.labels || []).map((label, i) => 
              new TableRow({
                children: [
                  new TableCell({ children: [new Paragraph(label)] }),
                  new TableCell({ children: [new Paragraph(String(data.series[i]))] })
                ]
              })
            )
          ]
        })
      ]
    }]
  });
  
  return await Packer.toBuffer(doc);
}

// Función helper para generar PDF
function generarPDF(data, tipo) {
  return new Promise((resolve, reject) => {
    const doc = new PDFDocument();
    const chunks = [];
    
    doc.on('data', chunk => chunks.push(chunk));
    doc.on('end', () => resolve(Buffer.concat(chunks)));
    doc.on('error', reject);
    
    // Título
    doc.fontSize(20).text(`Informe: ${tipo}`, { align: 'center' });
    doc.moveDown();
    
    // Tabla
    doc.fontSize(12);
    (data.labels || []).forEach((label, i) => {
      doc.text(`${label}: ${data.series[i]}`);
    });
    
    doc.end();
  });
}