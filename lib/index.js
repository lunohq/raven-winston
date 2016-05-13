'use strict';

Object.defineProperty(exports, "__esModule", {
  value: true
});

var _createClass = function () { function defineProperties(target, props) { for (var i = 0; i < props.length; i++) { var descriptor = props[i]; descriptor.enumerable = descriptor.enumerable || false; descriptor.configurable = true; if ("value" in descriptor) descriptor.writable = true; Object.defineProperty(target, descriptor.key, descriptor); } } return function (Constructor, protoProps, staticProps) { if (protoProps) defineProperties(Constructor.prototype, protoProps); if (staticProps) defineProperties(Constructor, staticProps); return Constructor; }; }();

var _winston = require('winston');

var _winston2 = _interopRequireDefault(_winston);

var _raven = require('raven');

var _raven2 = _interopRequireDefault(_raven);

function _interopRequireDefault(obj) { return obj && obj.__esModule ? obj : { default: obj }; }

function _classCallCheck(instance, Constructor) { if (!(instance instanceof Constructor)) { throw new TypeError("Cannot call a class as a function"); } }

function _possibleConstructorReturn(self, call) { if (!self) { throw new ReferenceError("this hasn't been initialised - super() hasn't been called"); } return call && (typeof call === "object" || typeof call === "function") ? call : self; }

function _inherits(subClass, superClass) { if (typeof superClass !== "function" && superClass !== null) { throw new TypeError("Super expression must either be null or a function, not " + typeof superClass); } subClass.prototype = Object.create(superClass && superClass.prototype, { constructor: { value: subClass, enumerable: false, writable: true, configurable: true } }); if (superClass) Object.setPrototypeOf ? Object.setPrototypeOf(subClass, superClass) : subClass.__proto__ = superClass; }

var Raven = function (_winston$Transport) {
  _inherits(Raven, _winston$Transport);

  function Raven() {
    var options = arguments.length <= 0 || arguments[0] === undefined ? {} : arguments[0];

    _classCallCheck(this, Raven);

    var _this = _possibleConstructorReturn(this, Object.getPrototypeOf(Raven).call(this));

    _this.name = options.name || 'raven-winston';
    _this.level = options.level || 'error';
    _this.logger = options.logger || 'root';
    _this.levelsMap = options.levelsMap || {
      silly: 'debug',
      verbose: 'debug',
      info: 'info',
      debug: 'debug',
      warn: 'warning',
      error: 'error'
    };

    if (options.raven) {
      _this.ravenClient = options.raven;
    } else if (options.dsn) {
      _this.ravenClient = new _raven2.default.Client(options.dsn);
    } else {
      throw new Error('Must pass a raven instance ("raven") or dsn ("dsn") to options');
    }

    if (options.patchGlobal) {
      _this.ravenClient.patchGlobal();
    }

    _this.ravenClient.on('error', function (err) {
      if (err.statusCode) {
        console.error('Error sending message to sentry [' + err.statusCode + ']');
      } else {
        console.error('Cannot talk to sentry!', err);
      }
    });
    return _this;
  }

  _createClass(Raven, [{
    key: 'log',
    value: function log(level, msg) {
      var meta = arguments.length <= 2 || arguments[2] === undefined ? {} : arguments[2];
      var callback = arguments[3];

      level = this.levelsMap[level] || this.level;
      var extra = Object.assign({}, meta);
      var tags = extra.tags;
      delete extra.tags;

      var data = {
        extra: extra,
        level: level,
        tags: tags,
        logger: this.logger
      };

      try {
        if (level === 'error') {
          this.ravenClient.captureError(msg, data, function () {
            return callback(null, true);
          });
        } else {
          this.ravenClient.captureMessage(msg, data, function () {
            return callback(null, true);
          });
        }
      } catch (err) {
        console.error(err);
      }
    }
  }]);

  return Raven;
}(_winston2.default.Transport);

exports.default = Raven;