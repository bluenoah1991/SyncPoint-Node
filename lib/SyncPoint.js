'use strict';

Object.defineProperty(exports, "__esModule", {
    value: true
});

var _slicedToArray = function () { function sliceIterator(arr, i) { var _arr = []; var _n = true; var _d = false; var _e = undefined; try { for (var _i = arr[Symbol.iterator](), _s; !(_n = (_s = _i.next()).done); _n = true) { _arr.push(_s.value); if (i && _arr.length === i) break; } } catch (err) { _d = true; _e = err; } finally { try { if (!_n && _i["return"]) _i["return"](); } finally { if (_d) throw _e; } } return _arr; } return function (arr, i) { if (Array.isArray(arr)) { return arr; } else if (Symbol.iterator in Object(arr)) { return sliceIterator(arr, i); } else { throw new TypeError("Invalid attempt to destructure non-iterable instance"); } }; }();

var _createClass = function () { function defineProperties(target, props) { for (var i = 0; i < props.length; i++) { var descriptor = props[i]; descriptor.enumerable = descriptor.enumerable || false; descriptor.configurable = true; if ("value" in descriptor) descriptor.writable = true; Object.defineProperty(target, descriptor.key, descriptor); } } return function (Constructor, protoProps, staticProps) { if (protoProps) defineProperties(Constructor.prototype, protoProps); if (staticProps) defineProperties(Constructor, staticProps); return Constructor; }; }();

var _lodash = require('lodash');

var _lodash2 = _interopRequireDefault(_lodash);

var _httpPack = require('http-pack');

var _WebLocalStorage = require('./WebLocalStorage');

var _WebLocalStorage2 = _interopRequireDefault(_WebLocalStorage);

function _interopRequireDefault(obj) { return obj && obj.__esModule ? obj : { default: obj }; }

function _classCallCheck(instance, Constructor) { if (!(instance instanceof Constructor)) { throw new TypeError("Cannot call a class as a function"); } }

var SyncPoint = function () {
    function SyncPoint(options) {
        _classCallCheck(this, SyncPoint);

        if (options == undefined) {
            options = {};
        }
        this.needSyncNumberOfSegment = 0;
        this.storage = new _WebLocalStorage2.default();
        // Important! Serial execution
        this.syncId = this.storage.syncId();
        _lodash2.default.assign(options, {
            callback: this._respondHandle.bind(this)
        });
        this.httpPack = new _httpPack.HttpPack(options);
    }

    _createClass(SyncPoint, [{
        key: '_numberOfSegment',
        value: function _numberOfSegment(number) {
            var segmentNumber = number >> 16;
            return segmentNumber << 16;
        }
    }, {
        key: '_numberOfNextSegment',
        value: function _numberOfNextSegment(number) {
            var newSegmentNumber = (number >> 16) + 1;
            return newSegmentNumber << 16;
        }
    }, {
        key: '_respondHandle',
        value: function _respondHandle(payload, response) {
            var data = JSON.parse(payload.toString('utf-8'));
            var newNumberOfSegment = data['newNumberOfSegment'];
            if (newNumberOfSegment != undefined) {
                var number = this.storage.number();
                var numberOfSegment = this._numberOfSegment(number);
                if (newNumberOfSegment > numberOfSegment) {
                    if (!this.startSync() && this.needSyncNumberOfSegment < newNumberOfSegment) {
                        this.needSyncNumberOfSegment = newNumberOfSegment;
                    }
                }
            } else {
                var syncId = data['id'];
                var points = data['points'];
                var _numberOfSegment2 = data['numberOfSegment'];
                if (syncId == undefined || points == undefined || _numberOfSegment2 == undefined) {
                    return;
                }
                if (syncId - this.syncId != 1) {
                    return;
                }
                var needSync = false;
                if (this.resolvingReverseConflicts != undefined) {
                    var anonymousPoints = this.storage.dumpAnonymousPoints();
                    /*
                     * localConflictsPoints: points - anonymousPoints
                     * newPoints: anonymousPoints - points
                     */

                    var _resolvingReverseConf = this.resolvingReverseConflicts(anonymousPoints, points, _numberOfSegment2),
                        _resolvingReverseConf2 = _slicedToArray(_resolvingReverseConf, 2),
                        localConflictsPoints = _resolvingReverseConf2[0],
                        newPoints = _resolvingReverseConf2[1];

                    this.storage.clearAnonymousPoints();
                    if (this.implementHandle != undefined) {
                        _lodash2.default.forEach(localConflictsPoints, function (point) {
                            this.implementHandle(point['data']);
                        }.bind(this));
                    }
                    this.storage.addPoints(points);
                    this.storage.addPoints(newPoints);
                    this.storage.setNumber(_numberOfSegment2);
                    if (newPoints.length > 0) {
                        needSync = true;
                    }
                }
                this.syncId = syncId;
                this.storage.setSyncId(this.syncId);
                if (needSync || this.needSyncNumberOfSegment > _numberOfSegment2) {
                    this.startSync();
                }
            }
        }
    }, {
        key: 'registerResolvingReverseConflicts',
        value: function registerResolvingReverseConflicts(handle) {
            this.resolvingReverseConflicts = handle;
        }
    }, {
        key: 'registerImplementHandle',
        value: function registerImplementHandle(handle) {
            this.implementHandle = handle;
        }
    }, {
        key: 'addPoint',
        value: function addPoint(data) {
            if (this.syncId % 2 == 1) {
                this.storage.addAnonymousPoint({
                    'data': data
                });
            } else {
                var number = this.storage.number();
                number++;
                this.storage.setNumber(number);
                this.storage.addPoint({
                    'syncNumber': number,
                    'data': data
                });
                this.startSync();
            }
        }
    }, {
        key: 'startSync',
        value: function startSync() {
            if (this.syncId % 2 == 1) {
                return false;
            }
            this.storage.setSyncId(++this.syncId);
            var number = this.storage.number();
            var numberOfSegment = this._numberOfSegment(number);
            var numberOfNextSegment = this._numberOfNextSegment(number);
            var newPoints = this.storage.pointsAtRange(numberOfSegment, numberOfNextSegment);
            var data = JSON.stringify({
                'id': this.syncId,
                'clientNumberOfSegment': numberOfSegment,
                'newPoints': newPoints
            });
            this.httpPack.commit(new Buffer(data, 'utf-8'), 2);
            return true;
        }
    }]);

    return SyncPoint;
}();

exports.default = SyncPoint;
//# sourceMappingURL=SyncPoint.js.map