import { createCanvas, Image, ImageData, loadImage } from 'canvas';
import { Router } from 'express';
import { readFileSync } from 'fs';
import path, { resolve } from 'path';
import { getZXingModule, setZXingModuleOverrides } from 'zxing-wasm';
import { readBarcodesFromImageData, type ReaderOptions } from 'zxing-wasm/reader';
export const router = Router();

const originalFetch = global.fetch;
global.fetch = async function (...args) {
  console.log('Fetch request:', args);
  return originalFetch.apply(this, args);
};

setZXingModuleOverrides({
  wasmBinary: readFileSync(resolve(__dirname, '../src/assets/zxing_full.wasm')),
});

getZXingModule();

router.get('/qr', async (req, res) => {
  const readerOptions: ReaderOptions = {
    formats: ['QRCode'],
  };

  const filePath = path.join(__dirname, '../src/test QR.png');
  const myimg = await loadImage(filePath);

  const imgData = imageDataWithCanvas(myimg);

  const imageFileReadResults = await readBarcodesFromImageData(imgData, readerOptions);

  res.send(imageFileReadResults);
});

function imageDataWithCanvas(myimg: Image) {
  const { width, height } = myimg;

  const canvas = createCanvas(width, height);
  const context = canvas.getContext('2d');

  context.drawImage(myimg, 0, 0, width, height);

  return context.getImageData(0, 0, width, height) as ImageDataWithColorSpace;
}

interface ImageDataWithColorSpace extends ImageData {
  colorSpace: PredefinedColorSpace;
}
