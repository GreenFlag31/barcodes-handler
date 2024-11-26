import path from 'path';
import { writeBarCodes, readBarCodes, defaultCreateBase } from '../src/barcodes-handler';
import { WriterOptionsBarCodes } from '../src/types';
import { promises as fsPromises } from 'node:fs';
import { log } from 'console';
import { ReaderOptions } from 'zxing-wasm';

async function write() {
  await fsPromises.rm('output', { recursive: true, force: true });

  const QRCode1: WriterOptionsBarCodes = {
    format: 'QRCode',
    content: 'This is the content of my QR code',
    position: 'middle',
  };
  const QRCode2: WriterOptionsBarCodes = {
    format: 'QRCode',
    content: 'This is another content',
    position: 'bottom-left',
  };
  const outputImage = 'output/output.png';
  const existingImage = defaultCreateBase;
  // const existingImage = path.join(__dirname, '../tests/test.png');

  try {
    const createdImages = await writeBarCodes([QRCode1, QRCode2], outputImage, existingImage);

    log(createdImages);
    return createdImages;
  } catch (error) {
    console.error('Error processing image:', error);
  }
}

async function read() {
  const readerOptions: ReaderOptions = {
    formats: ['QRCode'],
  };
  const filePath = path.join(__dirname, '../output/output.png');

  const imageFileReadResults = await readBarCodes(filePath, readerOptions);
  log(imageFileReadResults);
  log(imageFileReadResults?.length);
  return imageFileReadResults;
}

write();
