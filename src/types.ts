import sharp, { Create } from 'sharp';
import { WriterOptions } from 'zxing-wasm';

/**
 * Precise location of the barcode.
 */
export interface Location {
  top: number;
  left: number;
}

/**
 * Create a new image support for the generated barcode.
 */
export type CreateBase = Omit<Create, 'noise'>;

/**
 * Generic positioning of the barcode.
 */
export type GenericPositioning =
  | 'top-left'
  | 'top-right'
  | 'bottom-left'
  | 'bottom-right'
  | 'middle';

export interface WriterOptionsBarCodes extends WriterOptions {
  /**
   * The content of the barcode.
   */
  content: string;
  /**
   * Precise top and left location of the created barcode.
   */
  location?: Location;
  /**
   * Generic positioning of the created barcode.
   */
  position?: GenericPositioning;
}

export type WriterOptionsOutput = { success: true } & { created: sharp.OutputInfo[] };

/**
 * @internal
 */
export interface CompositeContent {
  input: Buffer;
  top: number;
  left: number;
}
