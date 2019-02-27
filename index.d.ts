
import {Transform, TransformOptions} from 'stream';

export interface FileTypePipeOptions extends TransformOptions {
  detectSize?: number
  fallback?: string
}

export interface FileTypePipePipeOptions {
  end?: boolean
  strict?: boolean
}

export default FileTypePipe
export declare class FileTypePipe extends Transform {
  constructor(options?: FileTypePipeOptions)
  _transform(chunk: string | Buffer, encoding: string, callback: Function): any
  _flush(callback: Function): any
  pipe<T extends NodeJS.WritableStream>(destination: T, options?: FileTypePipePipeOptions): T
  protected _detectFileType(): void
}

export declare const DEFAULT_DETECT_SIZE: number
export declare function configure(options?: {detectSize?: number}): void
