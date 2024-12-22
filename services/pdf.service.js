import PDFDocument from 'pdfkit';

export default {
  async generateArticlePDF(article) {
    const doc = new PDFDocument();
    let buffers = [];

    doc.on('data', buffers.push.bind(buffers));
    doc.on('end', () => {});

    doc.fontSize(18).text(article.title, { align: 'center' });
    doc.moveDown();
    doc.fontSize(12).text(article.content);

    doc.end();

    return Buffer.concat(buffers);
  },
};