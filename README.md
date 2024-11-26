# barcodes-handler

**barcodes-handler** is a lightweight Node.js library that allows reading and writing multiple barcodes (including QR codes) on a single image. It acts as a simple wrapper around the `zxing-wasm`, `sharp` and `napi-rs/canvas` libraries, ensuring seamless barcode processing with minimal effort.

- 🚀 Read multiple barcodes in an image in approx. 200ms, write multiple barcodes in an image in approx. 50ms.
- ✅ All binaries are included in the package, so there is no need to fetch anything from a CDN.
- 🌟 Read and write a wide variety of barcode types: `Aztec`, `Codabar`, `Code128`, `Code39`, `Code93`, `DataMatrix`, `EAN-13`, `EAN-8`, `ITF`, `PDF417`, `QRCode`, `UPC-A`, `UPC-E`.

## Installation

```bash
npm install barcodes-handler
```

## Documentation

Find the complete documentation [here](https://greenflag31.github.io/barcodes-handler/).

## Usage

### Read barcode(s)

```javascript
import { readBarCodes } from 'barcodes-handler';
import { ReaderOptions } from 'zxing-wasm';

const readerOptions: ReaderOptions = {
  // supported formats
  formats: ['QRCode'],
};
const filePath = path.join(__dirname, '../images/test.png');

const imageFileReadResults = await readBarCodes(filePath, readerOptions);
console.log('Detected QRCodes:', imageFileReadResults);
```

### Write barcode(s)

```javascript
import { writeBarCodes, defaultCreateBase } from 'barcodes-handler';

const outputImage = 'images/output.png';
const existingImage = path.join(__dirname, '../images/test.png');
const code1: WriterOptionsBarCodes = {
  format: 'QRCode',
  content: 'This is the content of my QR code',
  // generic positioning
  position: 'middle',
};
const code2: WriterOptionsBarCodes = {
  format: 'Code128',
  content: 'This is another content',
  position: 'bottom-left',
};

// write barcodes in an existing image
const createdImages = await writeBarCodes([code1, code2], outputImage, existingImage);

// write barcodes in a new image (use a default image base)
const createNewImage = defaultCreateBase;
const createdImages = await writeBarCodes([code1, code2], outputImage, createNewImage);
console.log('Created images:', createdImages);

// Create and write an image for each barcode
const createdImages = await writeBarCodes([code1, code2], outputImage);
console.log('Created images:', createdImages);
```

## Change logs

V0.0.4: Replacing canvas by napi-rs/canvas, adding tests.
