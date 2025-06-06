import type { NextApiRequest, NextApiResponse } from 'next';
import pdfkit from 'pdfkit';
import blobStream, { IBlobStream } from 'blob-stream';
import * as Buffer from 'node:buffer';
import path from "path";
import * as signatureService from '@/services/signatureService';
import { HttpError } from '@/models/errors';
import sharp from 'sharp';
import * as pdfjsLib from 'pdfjs-dist';
import { PDFDocument } from 'pdf-lib';
import { send } from 'node:process';
import { buffer } from 'stream/consumers';
// import { pdf } from 'pdf-to-img';
// import pdfimgconvert from 'pdf-img-convert'
// import { fromPath } from "pdf2pic";
// import { fromBuffer as convertPdfToPng } from 'pdf2pic'


type ImageProperties = {
  url: string;
  position: {
    x: number;
    y: number;
  };
  size: {
    width: number;
    height: number;
  };
  padding?: {
    top: 0;
    bottom: 0;
    left: 0;
    right: 0;
  }
//   scale?: number; // optional, to scale the image
//   scaleToFit?: boolean; // optional, to scale the image
};

type PolygonConfig = {
    x: number;
    y: number;
    height: number;
    width: number;
    color?: "string"; // optional color configuration
};

type TextProperties = {
    fontWidth: number;
    position: {
      x: number;
      y: number;
    };
    boxLength: number;
    fontName: string;
    fontColor: string;
  };
  
  type TextConfig = {
    defaultTextValue: string | number;
    textProperties: TextProperties;
    
  };
  
  type DocumentConfig = {
    size: string | [number, number];
    layout?: 'portrait' | 'landscape';
    backgroundImage?: ImageProperties;
  };
  
  type ConfigRequest = {
    textConfigs: { [key: string]: TextConfig };
    imageConfigs?: { [key: string]: ImageProperties }; // Optional image configs
    polygonConfig?:  { [key: string]: PolygonConfig };
    documentConfig: DocumentConfig;
  };
    

function writeText(doc: any, text: string, textProperties: TextProperties) {
    const { fontWidth, position: { x, y }, boxLength, fontName, fontColor } = textProperties;
    const fontSize = fontWidth * 1.25;
    const width = boxLength;

    // lineSpacing: 0.8
    doc.font(path.resolve("./public/fonts", fontName))
       .fontSize(fontSize)
       .fillColor(fontColor)
       .text(text, x, y, { width: width, align: 'left', lineGap: -0.2 * fontSize });
}

async function drawImage(doc: any, imageProperties: ImageProperties) {
    let { url, position, size, padding } = imageProperties;

    // validate that url starts with https or local: /public/
    if (!url.startsWith('https://') && !url.startsWith('/public/')) {
      throw new Error(`Invalid image url: ${url}`);
    }

    let imageData;
    // if local, get the file from public folder
    if (url.startsWith('/public/')) {    
        const localPath = path.resolve('./public', url.replace('/public/', ''));
        imageData = `${localPath}`;

    } else {
        const imageResponse = await fetch(url);
        imageData = await imageResponse.arrayBuffer();
    }

    padding = {
        top: padding?.top || 0,
        bottom: padding?.bottom || 0,
        left: padding?.left || 0,
        right: padding?.right || 0,
    };

    // Calculate the crop area
    let cropWidth = size.width - padding.left - padding.right;
    let cropHeight = size.height - padding.top - padding.bottom;

    // Draw the cropped image at the specified position
    doc.image(imageData, position.x, position.y, {
        cover: [cropWidth, cropHeight],
        crop: { 
            x: padding.left, 
            y: padding.top, 
            width: cropWidth, 
            height: cropHeight 
        } 
    });
}
  
function drawPolygonLine(doc: any, lineConfig: PolygonConfig) {
    const { x, y, height, width, color = 'white' } = lineConfig;
    doc.save()
       .moveTo(x, y)
       .lineTo(x, y + height)
       .lineWidth(width)
       .strokeColor(color)
       .stroke()
       .restore();
  }


async function createPDFBlob(config: ConfigRequest): Promise<Blob> {
    const docSettings = {
        margins: { top: 0, bottom: 0, left: 0, right: 0 },
        size: config.documentConfig.size,
        layout: config.documentConfig.layout || 'portrait'
    };

    const doc = new pdfkit(docSettings);
    const stream = doc.pipe(blobStream());

    if (config.documentConfig.backgroundImage) {
        drawImage(doc, config.documentConfig.backgroundImage);
    }

    for (const key in config.polygonConfig) {
        const property = config.polygonConfig[key];
        drawPolygonLine(doc, property);
    }

    for (const key in config.textConfigs) {
        const property = config.textConfigs[key];
        writeText(doc, property.defaultTextValue.toString(), property.textProperties);
    }

    if (config.imageConfigs) {
        for (const key in config.imageConfigs) {
          const imageConfig = config.imageConfigs[key];
          await drawImage(doc, imageConfig);
        }
    }

    doc.end();

    return new Promise((resolve, reject) => {
        stream.on('finish', async () => {
                resolve(stream.toBlob('application/pdf'));
        });
        stream.on('error', reject);
    });
}


// async function convertPdfStreamToPng(pdfStream: blobStream.IBlobStream) {
//     // Convert the stream to a Buffer

//     const pdfBuffer = Buffer.Buffer.concat(await streamToBuffer(pdfStream));

//     // Convert the first page to PNG (as an example)
//     const pngImage = await sharp(pdfBuffer, { 
//         pages: 1, 
//         page: 0,
//         density: 300
//     }).png().toBuffer();

//     return pngImage;
// }


export async function createPDF(config: ConfigRequest): Promise<Buffer.Buffer>  {
    const pdfBlob = await createPDFBlob(config);
    const chunks = [];
    // @ts-ignore Type 'ReadableStream<Uint8Array>' is not an array type or a string type.
    for await (const chunk of pdfBlob.stream()) {
        chunks.push(Buffer.Buffer.from(chunk));
    }

    return Buffer.Buffer.concat(chunks)
}

type Data = {
    data?: string,
    error?: string
};

export default async function handler(
    req: NextApiRequest,
    res: NextApiResponse<Data | Buffer>
) {

    try {
        signatureService.tryQueryAuthCheck(req);
    } catch (error) {
        if (error instanceof HttpError) {
            return res.status(error.statusCode).json({ error: error.message });
        } else {
            return res.status(400).json({ error: "Unknown error has occurred in auth checking" });
        }
    }


    try {
        // Get the config from the user request
        const configData: ConfigRequest = req.body;

        const pdfBuffer = await createPDF(configData);

        res.setHeader('Content-Type', 'image/png');
        res.setHeader('Content-Disposition', `attachment; filename="output.png"`);
        res.send(pdfBuffer);
        
    } catch (error) {
        console.error(error);
        return res.status(500).json({ error: 'Internal Server Error' });
    }
}
