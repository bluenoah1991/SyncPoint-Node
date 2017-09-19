'use strict';

Object.defineProperty(exports, "__esModule", {
    value: true
});

var _createClass = function () { function defineProperties(target, props) { for (var i = 0; i < props.length; i++) { var descriptor = props[i]; descriptor.enumerable = descriptor.enumerable || false; descriptor.configurable = true; if ("value" in descriptor) descriptor.writable = true; Object.defineProperty(target, descriptor.key, descriptor); } } return function (Constructor, protoProps, staticProps) { if (protoProps) defineProperties(Constructor.prototype, protoProps); if (staticProps) defineProperties(Constructor, staticProps); return Constructor; }; }();

var _lodash = require('lodash');

var _lodash2 = _interopRequireDefault(_lodash);

var _httpPack = require('http-pack');

function _interopRequireDefault(obj) { return obj && obj.__esModule ? obj : { default: obj }; }

function _classCallCheck(instance, Constructor) { if (!(instance instanceof Constructor)) { throw new TypeError("Cannot call a class as a function"); } }

var HttpClient = function () {
    function HttpClient(options) {
        _classCallCheck(this, HttpClient);

        if (options == undefined) {
            options = {};
        }
        this.callback = function () {};
        this.scope = options['scope'] || 'user1';
        this.url = options['url'] || 'http://example.com';
        this.outgoing_address = options['outgoing_address'] || '/outgoing';
        this.incoming_address = options['incoming_address'] || '/incoming';
        this.httpPack = new _httpPack.HttpPack(options);
        this._pushStream = this._pushStream.bind(this);
    }

    _createClass(HttpClient, [{
        key: '_checkStatus',
        value: function _checkStatus(response) {
            if (response.status >= 200 && response.status < 300) {
                return response;
            } else {
                var error = new Error(response.statusText);
                error.response = response;
                throw error;
            }
        }
    }, {
        key: '_newRequest',
        value: function _newRequest(url, scope, body) {
            return fetch(url, {
                method: 'POST',
                body: body,
                headers: {
                    'Content-Type': 'application/octet-stream',
                    'SyncPoint-Scope': scope
                },
                credentials: 'same-origin'
            }).then(this._checkStatus).then(function (response) {
                return response.arrayBuffer().then(function (buffer) {
                    // https://github.com/nodejs/node/issues/106
                    return new Buffer(new Uint8Array(buffer));
                });
            }).catch(function (error) {
                return null;
            });
        }
    }, {
        key: '_newLongRequest',
        value: function _newLongRequest(url, scope, callback) {
            fetch(url, {
                method: 'POST',
                headers: {
                    'SyncPoint-Scope': scope
                },
                credentials: 'same-origin'
            }).then(function (response) {
                var reader = response.body.getReader();
                return readChunk();

                function readChunk() {
                    return reader.read().then(newChunk);
                }

                function newChunk(result) {
                    callback(false, result.value);
                    if (result.done) {
                        return true;
                    } else {
                        return readChunk();
                    }
                }
            }).then(function (result) {
                callback(true, null);
            }).catch(function (err) {
                callback(true, null);
            });
        }
    }, {
        key: '_pushStream',
        value: function _pushStream() {
            this.httpPack.generateBody().then(function (requestBody) {
                if (requestBody == undefined || requestBody.length == 0) {
                    this.handle = setTimeout(this._pushStream, 100);
                    return null;
                } else {
                    this._newRequest('' + this.url + this.incoming_address, this.scope, requestBody).then(function () {
                        this.handle = setTimeout(this._pushStream, 100);
                    }.bind(this));
                }
            }.bind(this));
        }
    }, {
        key: 'registerCallback',
        value: function registerCallback(callback) {
            this.callback = callback;
        }
    }, {
        key: 'startLongPolling',
        value: function startLongPolling() {
            this._newLongRequest('' + this.url + this.outgoing_address, this.scope, function (done, chunk) {
                if (done) {
                    setTimeout(this.startLongPolling.bind(this), 1000);
                    return;
                }
                this.httpPack.parseBody(chunk, this.callback.bind(this));
            }.bind(this));
        }
    }, {
        key: 'startPushStream',
        value: function startPushStream() {
            this.handle = setTimeout(this._pushStream, 1000);
        }
    }, {
        key: 'commit',
        value: function commit(payload, qos) {
            return this.httpPack.commit(payload, qos);
        }
    }]);

    return HttpClient;
}();

exports.default = HttpClient;
//# sourceMappingURL=HttpClient.js.map