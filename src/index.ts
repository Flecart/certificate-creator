import pdfkit from 'pdfkit';
import * as fs from 'fs';

async function createPDF() {

    const doc = new pdfkit({
        layout : 'landscape',
        margins : { // by default, all are 72
            top: 0,
           bottom:0,
            left: 0,
          right: 0
        }
    });

    doc.pipe(fs.createWriteStream('output.pdf'));

    doc.image('./image.png', {
        cover: [doc.page.width, doc.page.height],
    });

    doc
    .fontSize(25)
    .text('Nome Figo', 
        doc.page.width / 3, doc.page.height / 2, {
        width: doc.page.width / 3,
        align: 'center'
    });
    doc.end();
}

createPDF();