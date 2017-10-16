
import {Transform, TransformOptions} from 'stream';

export interface FileTypePipeOptions extends TransformOptions {
  detectSize?: number
  fallback?: string
}

export default FileTypePipe
export declare class FileTypePipe extends Transform {
  constructor(options?: FileTypePipeOptions)
  _transform(chunk: string | Buffer, encoding: string, callback: Function): any
  _flush(callback: Function): any
  pipe<T extends NodeJS.WritableStream>(destination: T, options?: {end?: boolean;}): T
  protected _detectFileType()
}

export declare const DEFAULT_DETECT_SIZE
export declare function configure(options?: {detectSize?: number})
