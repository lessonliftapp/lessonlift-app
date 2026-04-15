export function downloadAsText(content: string, filename: string): void {
  const blob = new Blob([content], { type: 'text/plain;charset=utf-8' });
  const url = URL.createObjectURL(blob);
  const link = document.createElement('a');
  link.href = url;
  link.download = `${filename}.txt`;
  link.style.display = 'none';
  document.body.appendChild(link);
  link.click();
  setTimeout(() => {
    document.body.removeChild(link);
    URL.revokeObjectURL(url);
  }, 100);
}

export function downloadAsPDF(htmlContent: string, filename: string): void {
  const printWindow = window.open('', '_blank');
  if (!printWindow) {
    alert('Please allow pop-ups to download PDF files.');
    return;
  }

  const styles = `
    <style>
      @media print {
        @page {
          margin: 0.5in;
        }
        body {
          font-family: Arial, sans-serif;
          padding: 0;
          color: #000;
          -webkit-print-color-adjust: exact;
          print-color-adjust: exact;
        }
        .lesson-header {
          margin-bottom: 20px;
          border-bottom: 2px solid #4CAF50;
          padding-bottom: 10px;
        }
        .lesson-header h1 {
          color: #4CAF50;
          font-size: 24px;
          margin: 0 0 10px 0;
        }
        .lesson-meta {
          display: flex;
          gap: 20px;
          flex-wrap: wrap;
          font-size: 14px;
        }
        .meta-item {
          color: #666;
        }
        .lesson-content {
          margin-top: 20px;
        }
        .section-heading {
          color: #2c5f2d;
          margin-top: 20px;
          margin-bottom: 10px;
          font-size: 18px;
          font-weight: bold;
        }
        .subsection {
          color: #4CAF50;
          margin-top: 15px;
          margin-bottom: 8px;
          font-size: 16px;
          font-weight: bold;
        }
        h1, h2, h3, h4 {
          page-break-after: avoid;
        }
        li {
          margin-bottom: 5px;
          line-height: 1.6;
        }
        .nested-item {
          margin-left: 20px;
        }
        p {
          line-height: 1.6;
          margin-bottom: 10px;
        }
        ul, ol {
          page-break-inside: avoid;
        }
      }
      body {
        font-family: Arial, sans-serif;
        padding: 20px;
        color: #000;
      }
    </style>
  `;

  printWindow.document.write(`
    <!DOCTYPE html>
    <html>
      <head>
        <meta charset="utf-8">
        <title>${filename}</title>
        ${styles}
      </head>
      <body>
        ${htmlContent}
      </body>
    </html>
  `);

  printWindow.document.close();

  setTimeout(() => {
    printWindow.print();
  }, 750);
}

export function downloadAsDOCX(htmlContent: string, filename: string): void {
  const header = `
    <html xmlns:o='urn:schemas-microsoft-com:office:office'
          xmlns:w='urn:schemas-microsoft-com:office:word'
          xmlns='http://www.w3.org/TR/REC-html40'>
    <head>
      <meta charset='utf-8'>
      <title>${filename}</title>
      <!--[if gte mso 9]>
      <xml>
        <w:WordDocument>
          <w:View>Print</w:View>
          <w:Zoom>100</w:Zoom>
          <w:DoNotOptimizeForBrowser/>
        </w:WordDocument>
      </xml>
      <![endif]-->
      <style>
        body {
          font-family: Calibri, Arial, sans-serif;
          font-size: 11pt;
          line-height: 1.5;
          margin: 1in;
        }
        h1 {
          color: #4CAF50;
          font-size: 20pt;
          font-weight: bold;
          margin-top: 12pt;
          margin-bottom: 6pt;
        }
        h2 {
          color: #2c5f2d;
          font-size: 16pt;
          font-weight: bold;
          margin-top: 12pt;
          margin-bottom: 6pt;
        }
        h3 {
          color: #2c5f2d;
          font-size: 14pt;
          font-weight: bold;
          margin-top: 10pt;
          margin-bottom: 6pt;
        }
        h4 {
          color: #4CAF50;
          font-size: 12pt;
          font-weight: bold;
          margin-top: 8pt;
          margin-bottom: 4pt;
        }
        p {
          margin-bottom: 6pt;
          line-height: 1.5;
        }
        li {
          margin-bottom: 4pt;
          line-height: 1.5;
        }
        ul, ol {
          margin-top: 6pt;
          margin-bottom: 6pt;
        }
        .lesson-meta {
          font-size: 10pt;
          color: #666666;
          margin-bottom: 12pt;
        }
        .lesson-header {
          border-bottom: 2pt solid #4CAF50;
          padding-bottom: 6pt;
          margin-bottom: 12pt;
        }
      </style>
    </head>
    <body>
  `;

  const footer = '</body></html>';
  const fullContent = header + htmlContent + footer;

  const blob = new Blob(['\ufeff', fullContent], {
    type: 'application/vnd.openxmlformats-officedocument.wordprocessingml.document'
  });
  const url = URL.createObjectURL(blob);
  const link = document.createElement('a');
  link.href = url;
  link.download = `${filename}.docx`;
  link.style.display = 'none';
  document.body.appendChild(link);
  link.click();
  setTimeout(() => {
    document.body.removeChild(link);
    URL.revokeObjectURL(url);
  }, 100);
}

export function sanitizeFilename(subject: string, topic: string): string {
  const combined = `${subject}_${topic}`;
  return combined
    .replace(/[^a-z0-9]/gi, '_')
    .replace(/_+/g, '_')
    .toLowerCase();
}
