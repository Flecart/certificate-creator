
import { registerFont, CanvasRenderingContext2D, createCanvas, loadImage, deregisterAllFonts } from 'canvas';
import type { NextApiRequest, NextApiResponse } from 'next';
import path from 'path';
import * as signatureService from '@/services/signatureService';
import { HttpError } from '@/models/errors';

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
  
export  type ConfigRequest = {
    textConfigs: { [key: string]: TextConfig };
    imageConfigs?: { [key: string]: ImageProperties }; // Optional image configs
    polygonConfig?:  { [key: string]: PolygonConfig };
    documentConfig: DocumentConfig;
  };
    

  // register all fonts in /public/fonts
  import fs from 'fs';


  function getName(font: string){
    return font.replace('.otf',"").replace('.ttf',"")
  }

  function getFamily(font: string){
    return getName(font).split('-')[0]
  }

  function getStyle(font: string){
    let elements =  getName(font).split('-')
    if(elements.length>1){
      elements.shift()
      console.log("a " + elements.join(' ').replace(/([a-z])([A-Z])/g, "$1 $2"))
      
      return elements.join(' ').replace(/([a-z])([A-Z])/g, "$1 $2")
    }
    return 'Regular'
    
  }

  const fonts = fs.readdirSync('./public/fonts');
  deregisterAllFonts()
  fonts.forEach(font => {
    
    registerFont(path.resolve(`./public/fonts/`, font), { 
      family: getFamily(font), 
      style: getStyle(font).indexOf("Italic")>-1? "italic" : undefined,
      weight: getStyle(font).indexOf("Bold")>-1? "bold" : undefined
    }
      )
    console.log({ 
      family: getFamily(font), 
      style: getStyle(font).indexOf("Italic")>-1? "italic" : undefined,
      weight: getStyle(font).indexOf("Bold")>-1? "bold" : undefined
    })
    })
 
  function wrapText(
            ctx: CanvasRenderingContext2D,
            text: string, 
            x: number, 
            y: number, 
            maxWidth: number, 
            lineHeight: number) {
    lineHeight*=1.3
    const words = text.split(' ');
    let line = '';
    let testLine, metrics;
    y+=lineHeight
    ctx.textDrawingMode = 'glyph';
    for (let n = 0; n < words.length; n++) {
      testLine = line + words[n] + ' ';
      metrics = ctx.measureText(testLine);
      if (metrics.width > maxWidth && n > 0) {
        ctx.fillText(line, x, y);
        line = words[n] + ' ';
        y += lineHeight;
      } else {
        line = testLine;
      }
    }
    ctx.fillText(line, x, y);
  }
  

export const generateImage = async (config: ConfigRequest) => {
  // Destructuring the configuration
  const { textConfigs, imageConfigs, polygonConfig, documentConfig } = config;

  // register all fonts before creating the canva


  // Create canvas
  const [width, height] = typeof documentConfig.size === 'string' ? documentConfig.size.split('x').map(Number) : documentConfig.size;
  const canvas = createCanvas(width, height);
  const ctx = canvas.getContext('2d', {alpha: false});
  // ctx.antialias = 'subpixel';
  // ctx.imageSmoothingEnabled = true;
  // ctx.patternQuality = 'best';
  
  // Draw background image if exists
  if (documentConfig.backgroundImage) {
    const bgImage = await loadImage("."+documentConfig.backgroundImage.url);

    const { top = 0, bottom = 0, left = 0, right = 0 } = documentConfig.backgroundImage.padding || {};  
    const drawX =  left * bgImage.width / documentConfig.backgroundImage.size.width;
    const drawY =  top * bgImage.height / documentConfig.backgroundImage.size.height;
    const drawWidth = bgImage.width *(documentConfig.backgroundImage.size.width - left - right) / documentConfig.backgroundImage.size.width;
    const drawHeight = bgImage.height *( documentConfig.backgroundImage.size.height - top - bottom) / documentConfig.backgroundImage.size.height;

    ctx.drawImage(bgImage, drawX, drawY, drawWidth, drawHeight,  0, 0, documentConfig.backgroundImage.size.width, documentConfig.backgroundImage.size.height);
  }

  // Draw images
  if (imageConfigs) {
    for (const key in imageConfigs) {
      const configImg = imageConfigs[key];
      const downloadedImg = await loadImage('./'+configImg.url);
  
      const { top = 0, bottom = 0, left = 0, right = 0 } = configImg.padding || {};  
      const drawX =  left * downloadedImg.width / configImg.size.width;
      const drawY =  top * downloadedImg.height / configImg.size.height;
      const drawWidth = downloadedImg.width *(configImg.size.width - left - right) / configImg.size.width;
      const drawHeight = downloadedImg.height *( configImg.size.height - top - bottom) / configImg.size.height;
  
      ctx.drawImage(downloadedImg, drawX, drawY, drawWidth, drawHeight,  configImg.position.x, configImg.position.y, configImg.size.width, configImg.size.height);
  
    }
  }

  // Draw polygons
  if (polygonConfig) {
    for (const key in polygonConfig) {
      const polygon = polygonConfig[key];
      ctx.fillStyle = polygon.color || 'white';
      ctx.fillRect(polygon.x, polygon.y, polygon.width, polygon.height);
    }
  }

  // Draw text

  if (textConfigs) {
    for (const key in textConfigs) {
      const textConfig = textConfigs[key];

      // Register and set the font
      // useFont(textConfig.textProperties.fontName, fontPath, textConfig.textProperties.fontWidth, ctx);
      let fontName = getFamily(textConfig.textProperties.fontName)
      let fontStyle = getStyle(textConfig.textProperties.fontName)
      ctx.font = `${fontStyle.toLowerCase()} ${textConfig.textProperties.fontWidth*1.3}px "${fontName}" `;

      console.log(ctx.font)
      ctx.fillStyle = textConfig.textProperties.fontColor;
      // Use boxLength as maxWidth for text wrapping
      wrapText(
        ctx,
        textConfig.defaultTextValue.toString(),
        textConfig.textProperties.position.x,
        textConfig.textProperties.position.y,
        textConfig.textProperties.boxLength,
        textConfig.textProperties.fontWidth);
    }
  }

  // Return the canvas as a buffer (or in another format as needed)
  return canvas.toBuffer('image/png', { resolution: 3000 });
};


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

      const pdfBuffer = await generateImage(configData);

      res.setHeader('Content-Type', 'image/png');
      res.setHeader('Content-Disposition', `attachment; filename="output.png"`);
      res.send(pdfBuffer);
          
  } catch (error) {
      console.error(error);
      return res.status(500).json({ error: 'Internal Server Error' });
  }
}
