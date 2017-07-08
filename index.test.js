import fs from 'fs'
import path from 'path'
import {Writable, Transform} from 'stream'

import test from 'ava'

import BufferList from 'bl'

import FileTypePipe from './index'

const Promise = global.Promise

function createBitbucket() {
  return new Writable({
    write(chunk, encoding, callback) {
      callback()
    }
  })
}
function finished(s) {
  return new Promise((resolve, reject) => {
    s.on('finish', resolve)
    s.on('error', reject)
  })
}

// Make all chunks size one to ensure that the detection happens at a small size
class ByteByByte extends Transform {
  _transform(chunk, encoding, callback) {
    for (let i = 0; i < chunk.length; i++) {
      this.push(Buffer.from([chunk[i]]), encoding)
    }
    callback()
  }
}

test('small file', async (t) => {
  const res = createBitbucket()
  res.headers = {}

  fs.createReadStream(path.join(__dirname, './fixture/fixture.ps'))
  .pipe(new FileTypePipe())
  .pipe(res)

  await finished(res)

  t.is(res.headers['Content-Type'], 'application/postscript')
})

test('big file', async (t) => {
  const res = createBitbucket()
  res.headers = {}

  fs.createReadStream(path.join(__dirname, './fixture/fixture.cr2'))
  .pipe(new FileTypePipe())
  .pipe(res)

  await finished(res)
  t.is(res.headers['Content-Type'], 'image/x-canon-cr2')
})

test('setHeader', async (t) => {
  t.plan(2)

  const res = createBitbucket()
  res.setHeader = (name, value) => {
    t.is(name, 'Content-Type')
    t.is(value, 'application/postscript')
  }

  fs.createReadStream(path.join(__dirname, './fixture/fixture.ps'))
  .pipe(new FileTypePipe())
  .pipe(res)

  await finished(res)
})

test('no headers', async (t) => {
  const res = createBitbucket()

  fs.createReadStream(path.join(__dirname, './fixture/fixture.ps'))
  .pipe(new FileTypePipe())
  .pipe(res)

  await finished(res)

  t.falsy(res.headers)
})

test('headersSent', async (t) => {
  const res = createBitbucket()
  res.headersSent = true

  const ftp = fs.createReadStream(path.join(__dirname, './fixture/fixture.ps'))
  .pipe(new FileTypePipe())

  const p = finished(ftp)

  ftp.pipe(res)

  await t.throws(p, /cannot pipe after .* headers .* sent/)
})

test('alreadyDetected', async (t) => {
  const ftp = fs.createReadStream(path.join(__dirname, './fixture/fixture.ps'))
  .pipe(new FileTypePipe())

  const res = createBitbucket()
  res.headers = {}

  await finished(ftp.pipe(res))

  const p = finished(ftp)
  ftp.pipe(createBitbucket())

  await t.throws(p, /cannot pipe after .* detected/)
})
test('ignore headersSent', async (t) => {
  const ftp = fs.createReadStream(path.join(__dirname, './fixture/fixture.ps'))
  .pipe(new FileTypePipe())

  const res = createBitbucket()
  res.headers = {}
  res.headersSent = true

  await finished(ftp.pipe(res, {strict: false}))

  t.is(Object.keys(res.headers).length, 0)
})

async function testDetectSize(t, options) {
  const ftp = fs.createReadStream(path.join(__dirname, './fixture/fixture.ps'))
  .pipe(new ByteByByte())
  .pipe(new FileTypePipe(options))

  const res = createBitbucket()
  res.headers = {}

  await finished(ftp.pipe(res))

  t.is(Object.keys(res.headers).length, 0)
}

test('detectSize', testDetectSize, {detectSize: 1})

test.serial('configure detectSize', async (t) => {
  FileTypePipe.configure({
    detectSize: 1
  })

  await testDetectSize(t)

  FileTypePipe.configure({
    detectSize: FileTypePipe.DEFAULT_DETECT_SIZE
  })
  FileTypePipe.configure({})
})

test('no detection', async (t) => {
  const res = createBitbucket()
  res.headers = {}

  const bl = new BufferList()
  bl.append('plain text')

  bl
  .pipe(new FileTypePipe())
  .pipe(res)

  await finished(res)

  t.is(Object.keys(res.headers).length, 0)
})

test('fallback', async (t) => {
  const res = createBitbucket()
  res.headers = {}

  const bl = new BufferList()

  bl.append('plain text')

  bl
  .pipe(new FileTypePipe({fallback: 'text/plain'}))
  .pipe(res)

  await finished(res)

  t.is(res.headers['Content-Type'], 'text/plain')
})
