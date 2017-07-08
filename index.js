
const Transform = require('stream').Transform
const BufferList = require('bl')
const fileType = require('file-type')

let defaultDetectSize = 4100

module.exports = class FileTypePipe extends Transform {
  constructor(options) {
    super(options)

    if (options == null) options = {}
    this._bl = new BufferList()
    this._dests = []
    this._detectSize = options.detectSize == null ? defaultDetectSize : options.detectSize
    this._fallbackContentType = options.fallback
  }
  _transform(chunk, encoding, callback) {
    const bl = this._bl
    if (bl == null) return (callback(null, chunk, encoding), undefined)

    bl.append(chunk)
    if (bl.length >= this._detectSize) {
      this._detectFileType()
    }
    callback()
  }
  _flush(callback) {
    const bl = this._bl
    if (bl == null) return (callback(), undefined)

    this._detectFileType()

    callback()
  }
  pipe(dest, options) {
    if (this._bl == null) {
      this.emit('error', new Error('You cannot pipe after the file type has been detected.'))
    } else if ((!options || options.strict !== false) && dest.headersSent) {
      this.emit('error', new Error('You cannot pipe after the headers have been sent. Set {strict: false} in the pipe options to ignore.'))
    } else {
      this._dests.push(dest)
    }
    return super.pipe(dest, options)
  }
  _detectFileType() {
    const bl = this._bl

    const buf = bl.slice()
    const type = fileType(buf)
    if (type || this._fallbackContentType) {
      const mime = type == null ? this._fallbackContentType : type.mime
      const dests = this._dests
      for (let i = 0; i < dests.length; i++) {
        const dest = dests[i]
        if (!dest.headersSent) {
          if (dest.setHeader) {
            dest.setHeader('Content-Type', mime)
          } else if (dest.headers) {
            dest.headers['Content-Type'] = mime
          }
        }
      }
    }

    this._dests = null
    this._bl = null

    this.emit('file-type', type)
    this.push(buf)
  }
}

Object.defineProperty(module.exports, 'DEFAULT_DETECT_SIZE', {
  value: defaultDetectSize,
  writable: false,
  configurable: false,
  enumerable: true
})

module.exports.configure = configure
function configure(options) {
  if (options.detectSize !== undefined) defaultDetectSize = options.detectSize
}
