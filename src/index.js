import winston from 'winston'
import raven from 'raven'

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
      console.error('Cannot talk to sentry!', err)
    })
  }

  log(level, msg, meta={}, callback) {
    level = this.levelsMap[level] || this.level
    const extra = Object.assign({}, meta)
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