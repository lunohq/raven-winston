import winston from 'winston'
import raven from 'raven'

const debug = require('debug')('raven-winston')

class Raven extends winston.Transport {
  constructor(options = {}) {
    super()
    this.name = options.name || 'raven-winston'
    this.level = options.level || 'error'
    this.logger = options.logger || 'root'
    this.levelsMap = options.levelsMap || {
      silly: 'debug',
      verbose: 'debug',
      info: 'info',
      debug: 'debug',
      warn: 'warning',
      error: 'error',
    }

    if (options.raven) {
      this.ravenClient = options.raven
    } else if (options.dsn) {
      this.ravenClient = new raven.Client(options.dsn)
    } else {
      throw new Error('Must pass a raven instance ("raven") or dsn ("dsn") to options')
    }

    if (options.patchGlobal) {
      this.ravenClient.patchGlobal()
    }

    this.ravenClient.on('error', (err) => {
      if (err.statusCode) {
        console.error(`Error sending message to sentry [${err.statusCode}]`)
      } else {
        console.error('Cannot talk to sentry!', err)
      }
    })
  }

  log(level, msg, meta={}, callback) {
    debug('Log request', { level, msg, meta })
    level = this.levelsMap[level] || this.level
    const extra = Object.assign({}, meta)
    if (meta instanceof Error) {
      debug('Formatting error', { meta })
      extra.err = { stack: meta.stack, message: meta.message }
    }
    const tags = extra.tags
    delete extra.tags

    const data = {
      extra,
      level,
      tags,
      logger: this.logger,
    }

    try {
      if (level === 'error') {
        debug('Capturing data', { data })
        this.ravenClient.captureError(msg, data, () => callback(null, true))
      } else {
        this.ravenClient.captureMessage(msg, data, () => callback(null, true))
      }
    } catch (err) {
      console.error(err)
    }
  }

}

export default Raven
