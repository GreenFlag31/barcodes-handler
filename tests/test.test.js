const assert = require('node:assert');
const { describe, it } = require('node:test');
const path = require('path');
const promises = require('node:fs/promises');
const { log } = require('node:console');
const { defaultCreateBase, readBarCodes, writeBarCodes } = require('../dist/index');

describe('write/read codes', () => {
  it('should correctly write 1 QR codes', { skip: true }, async () => {
    const QRCode1 = {
      format: 'QRCode',
      content: 'This is the content of my QR code',
      position: 'middle',
    };

    const outputImage = 'output/output.png';
    const existingImage = defaultCreateBase;
    await writeBarCodes([QRCode1], outputImage, existingImage);
    const read = await readBarCodes(outputImage);
    assert.equal(read.length, 1);
  });

  it('should correctly write multiple QR codes', { skip: true }, async () => {
    const QRCode1 = {
      format: 'QRCode',
      content: 'This is the content of my QR code',
      position: 'middle',
    };
    const QRCode2 = {
      format: 'QRCode',
      content: 'second code',
      position: 'bottom-left',
    };

    const outputImage = 'output/output.png';
    const existingImage = defaultCreateBase;
    await writeBarCodes([QRCode1, QRCode2], outputImage, existingImage);
    const read = await readBarCodes(outputImage);
    assert.equal(read.length, 2);
  });

  it('should correctly write given text content', { skip: true }, async () => {
    const content = 'This is the content of my QR code';
    const QRCode1 = {
      format: 'QRCode',
      content,
      position: 'middle',
    };

    const outputImage = 'output/output.png';
    const existingImage = defaultCreateBase;
    await writeBarCodes([QRCode1], outputImage, existingImage);
    const read = await readBarCodes(outputImage);
    assert.equal(read[0].text, content);
  });

  it('should correctly read webp image', { skip: true }, async () => {
    const content = 'This is the content of my QR code';
    const QRCode1 = {
      format: 'QRCode',
      content,
      position: 'middle',
    };

    const outputImage = 'output/output.webp';
    const existingImage = defaultCreateBase;
    await writeBarCodes([QRCode1], outputImage, existingImage);
    const read = await readBarCodes(outputImage);
    assert.equal(read[0].text, content);
    assert.equal(read.length, 1);
  });

  it('should correctly read png image', { skip: true }, async () => {
    const content = 'This is the content of my QR code';
    const QRCode1 = {
      format: 'QRCode',
      content,
      position: 'middle',
    };

    const outputImage = 'output/output.png';
    const existingImage = defaultCreateBase;
    await writeBarCodes([QRCode1], outputImage, existingImage);
    const read = await readBarCodes(outputImage);
    assert.equal(read[0].text, content);
    assert.equal(read.length, 1);
  });

  it('should correctly read jpeg image', { skip: true }, async () => {
    const content = 'This is the content of my QR code';
    const QRCode1 = {
      format: 'QRCode',
      content,
      position: 'middle',
    };

    const outputImage = 'output/output.jpeg';
    const existingImage = defaultCreateBase;
    await writeBarCodes([QRCode1], outputImage, existingImage);
    const read = await readBarCodes(outputImage);
    assert.equal(read[0].text, content);
    assert.equal(read.length, 1);
  });
});

describe('different write possibilities', () => {
  it('should correctly write a new code in an existing image', { skip: true }, async () => {
    const content = 'new content inside an existing image';
    const QRCode1 = {
      format: 'QRCode',
      content,
      position: 'top-left',
    };

    const existingImage = 'output/output.jpeg';
    const outputImage = 'output/output-new.jpeg';
    await writeBarCodes([QRCode1], outputImage, existingImage);
    const read = await readBarCodes(outputImage);
    assert.equal(read[0].text, content);
    assert.equal(read.length, 2);
  });

  it('should correctly write a new code in an new image', { skip: true }, async () => {
    const content = 'This is the content of my QR code';
    const QRCode1 = {
      format: 'QRCode',
      content,
      position: 'middle',
    };

    const outputImage = 'output/output.jpeg';
    const existingImage = defaultCreateBase;
    await writeBarCodes([QRCode1], outputImage, existingImage);
    const read = await readBarCodes(outputImage);
    assert.equal(read[0].text, content);
    assert.equal(read.length, 1);
  });

  it(
    'should correctly write only codes in separate images without existing and base image',
    { skip: true },
    async () => {
      await promises.rm('output', { recursive: true, force: true });

      const content = 'This is the content of my QR code';
      const QRCode1 = {
        format: 'QRCode',
        content,
        position: 'middle',
      };
      const QRCode2 = {
        format: 'QRCode',
        content,
        position: 'top-left',
      };

      const fullPathFirstImage = path.join(__dirname, '../output/image-001.jpeg');
      const fullPathSecondImage = path.join(__dirname, '../output/image-002.jpeg');
      const outputImage = 'output/image.jpeg';
      await writeBarCodes([QRCode1, QRCode2], outputImage);
      const stat1 = await promises.stat(fullPathFirstImage);
      const stat2 = await promises.stat(fullPathSecondImage);

      assert.equal(stat1.isFile(), true);
      assert.equal(stat2.isFile(), true);
    }
  );
});
