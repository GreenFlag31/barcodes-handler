import assert from 'assert';
import { readFileSync } from 'fs';
import path, { resolve } from 'path';
import sharp from 'sharp';
import {
  getZXingModule,
  setZXingModuleOverrides,
  readBarcodesFromImageData,
  type ReaderOptions,
  writeBarcodeToImageFile,
  type WriterOptions,
} from 'zxing-wasm';
import {
  CompositeContent,
  CreateBase,
  GenericPositioning,
  WriterOptionsBarCodes,
  WriterOptionsOutput,
} from './types';
import { promises } from 'node:fs';
import { createCanvas, loadImage } from '@napi-rs/canvas';

const defaultWriterOptions: WriterOptionsBarCodes = {
  content: '',
  width: 200,
  height: 200,
  margin: 10,
  format: 'QRCode',
  characterSet: 'UTF8',
  eccLevel: -1,
};
export const defaultCreateBase: CreateBase = {
  width: 600,
  height: 800,
  channels: 3,
  background: { r: 255, g: 255, b: 255 },
};

setZXingModuleOverrides({
  wasmBinary: readFileSync(resolve(__dirname, '../zxing-wasm/dist/full/zxing_full.wasm')),
});

getZXingModule();

function initOptions(writerOptions: WriterOptionsBarCodes): WriterOptionsBarCodes {
  return Object.freeze({
    ...defaultWriterOptions,
    ...writerOptions,
  });
}

function initCreateBase(createBase: CreateBase | undefined): CreateBase {
  return Object.freeze({
    ...defaultCreateBase,
    ...createBase,
  });
}

async function writeBarCode(content: string, writerOptions: WriterOptions) {
  const writeOutput = await writeBarcodeToImageFile(content, writerOptions);

  const { image } = writeOutput;
  assert(image, 'Failed to write the barcode.');

  const blob = new Blob([image]);
  const arrayBuffer = await blob.arrayBuffer();

  return arrayBuffer;
}

async function createBaseDirectory(outputImage: string) {
  const baseDir = path.dirname(outputImage);
  await promises.mkdir(baseDir, { recursive: true });
}

/**
 * @param writerOptionsBarCodes The options of writing a barcode.
 * @param outputImage The name of the output image. Create directory if missing.
 * @param baseImage The path of an existing image or a base image. Without a base and an existing image, only the bar code is printed.
 * @returns An object with a success property and the outputInfo of the created image(s).
 */
export async function writeBarCodes(
  writerOptionsBarCodes: WriterOptionsBarCodes[],
  outputImage: string,
  baseImage?: string | CreateBase
): Promise<WriterOptionsOutput> {
  const writerImagesPromises: Promise<ArrayBuffer>[] = [];

  for (let index = 0; index < writerOptionsBarCodes.length; index++) {
    const writerOptionsBarCode = writerOptionsBarCodes[index];

    writerOptionsBarCodes[index] = initOptions(writerOptionsBarCode);
    const { content } = writerOptionsBarCode;
    const imageArrayBuffer = writeBarCode(content, writerOptionsBarCode);
    writerImagesPromises.push(imageArrayBuffer);
  }

  try {
    const imagesResolved = await Promise.all(writerImagesPromises);
    await createBaseDirectory(outputImage);

    if (!baseImage) {
      // no image support, print images one by one
      const created = await createMultipleImages(imagesResolved, outputImage);
      return { success: true, created };
    }

    const image = createBaseImage(baseImage);
    const compositeContents = await getCompositeContents(
      writerOptionsBarCodes,
      imagesResolved,
      image
    );

    const resultingImage = await image.composite(compositeContents).toFile(outputImage);

    return { success: true, created: [resultingImage] };
  } catch (error: any) {
    throw new Error('Error processing image: ' + error);
  }
}

async function createMultipleImages(imagesResolved: ArrayBuffer[], outputImage: string) {
  const resultingImages: Promise<sharp.OutputInfo>[] = [];
  const { dir: directory, name: basePath } = path.parse(outputImage);
  const extension = path.extname(outputImage);

  let index = 1;
  for (const imageArrayBuffer of imagesResolved) {
    const imageName = `${basePath}-${index.toString().padStart(3, '0')}${extension}`;
    const completeName = `${directory}/${imageName}`;

    const resultingImage = sharp(imageArrayBuffer).toFile(completeName);
    resultingImages.push(resultingImage);

    index += 1;
  }

  const createdImages = await Promise.all(resultingImages);
  return createdImages;
}

async function getCompositeContents(
  writerOptionsBarCodes: WriterOptionsBarCodes[],
  imagesResolved: ArrayBuffer[],
  baseImage: sharp.Sharp
) {
  const compositeContents: CompositeContent[] = [];
  let index = 0;

  const { width: containerWidth, height: containerHeight } = await baseImage.metadata();

  for (const imageArrayBuffer of imagesResolved) {
    const currentOption = writerOptionsBarCodes[index];
    const { position, width: elementWidth, height: elementHeight, location } = currentOption;

    assert(
      containerWidth && containerHeight && elementWidth && elementHeight,
      'Invalid parameters'
    );
    assert(
      containerWidth > 0 &&
        containerHeight > 0 &&
        elementWidth > 0 &&
        elementHeight > 0 &&
        containerWidth > elementWidth &&
        containerHeight > elementHeight,
      'Invalid parameters dimensions'
    );

    const located =
      location ||
      calculatePosition(position, containerWidth, containerHeight, elementWidth, elementHeight);

    compositeContents.push({
      input: Buffer.from(imageArrayBuffer),
      ...located,
    });
    index += 1;
  }

  return compositeContents;
}

function createBaseImage(baseImage?: string | CreateBase) {
  if (typeof baseImage === 'string') return sharp(baseImage);

  const base = initCreateBase(baseImage);
  const { background, channels, height, width } = base;

  const image = sharp({
    create: {
      width,
      height,
      channels,
      background,
    },
  });

  return image;
}

/**
 * @param existingImage The path of an existing image.
 * @param readerOptions The options of reading barcode(s).
 * @returns The read results.
 */
export async function readBarCodes(existingImage: string, readerOptions?: ReaderOptions) {
  try {
    const imgData = await getImageDataFromFile(existingImage);
    const imageFileReadResults = await readBarcodesFromImageData(imgData, readerOptions);

    return imageFileReadResults;
  } catch (error) {
    throw new Error('Error processing image: ' + error);
  }
}

async function getImageDataFromFile(imagePath: string): Promise<any> {
  const image = await loadImage(imagePath);

  const { width, height } = image;
  const canvas = createCanvas(width, height);
  const context = canvas.getContext('2d');

  context.drawImage(image, 0, 0, width, height);

  const imageData = context.getImageData(0, 0, width, height);
  return imageData;
}

function calculatePosition(
  position: GenericPositioning | undefined,
  containerWidth: number,
  containerHeight: number,
  elementWidth: number,
  elementHeight: number
) {
  const MARGIN = 10;
  const atRight = containerWidth - elementWidth - MARGIN;
  const atBottom = containerHeight - elementHeight - MARGIN;
  const middleTop = Math.floor(containerHeight / 2 - elementHeight / 2 - MARGIN / 2);
  const middleLeft = Math.floor(containerWidth / 2 - elementWidth / 2 - MARGIN / 2);

  switch (position) {
    case 'top-left':
      return { top: MARGIN, left: MARGIN };
    case 'top-right':
      return { top: MARGIN, left: atRight };
    case 'bottom-left':
      return { top: atBottom, left: MARGIN };
    case 'bottom-right':
      return {
        top: atBottom,
        left: atRight,
      };
    case 'middle':
      return { top: middleTop, left: middleLeft };
    default:
      return { top: MARGIN, left: MARGIN };
  }
}
