'use strict';

Object.defineProperty(exports, "__esModule", {
    value: true
});

var _createClass = function () { function defineProperties(target, props) { for (var i = 0; i < props.length; i++) { var descriptor = props[i]; descriptor.enumerable = descriptor.enumerable || false; descriptor.configurable = true; if ("value" in descriptor) descriptor.writable = true; Object.defineProperty(target, descriptor.key, descriptor); } } return function (Constructor, protoProps, staticProps) { if (protoProps) defineProperties(Constructor.prototype, protoProps); if (staticProps) defineProperties(Constructor, staticProps); return Constructor; }; }();

var _lodash = require('lodash');

var _lodash2 = _interopRequireDefault(_lodash);

function _interopRequireDefault(obj) { return obj && obj.__esModule ? obj : { default: obj }; }

function _classCallCheck(instance, Constructor) { if (!(instance instanceof Constructor)) { throw new TypeError("Cannot call a class as a function"); } }

var WebLocalStorage = function () {
    function WebLocalStorage() {
        _classCallCheck(this, WebLocalStorage);
    }

    _createClass(WebLocalStorage, [{
        key: 'number',
        value: function number() {
            var number = localStorage.getItem('number');
            if (number == undefined) {
                number = 0;
                localStorage.setItem('number', number);
            }
            return number;
        }
    }, {
        key: 'setNumber',
        value: function setNumber(number) {
            localStorage.setItem('number', number);
        }
    }, {
        key: 'syncId',
        value: function syncId() {
            var id = localStorage.getItem('sync_id');
            if (id == undefined) {
                return 0;
            } else {
                return parseInt(id);
            }
        }
    }, {
        key: 'setSyncId',
        value: function setSyncId(id) {
            localStorage.setItem('sync_id', id);
        }
    }, {
        key: 'addAnonymousPoint',
        value: function addAnonymousPoint(point) {
            var points = localStorage.getItem('anonymous_points');
            if (points == undefined) {
                points = [];
            } else {
                points = JSON.parse(points);
            }
            points.push(point);
            points = JSON.stringify(points);
            localStorage.setItem('anonymous_points', points);
        }
    }, {
        key: 'dumpAnonymousPoints',
        value: function dumpAnonymousPoints() {
            var points = localStorage.getItem('anonymous_points');
            if (points == undefined) {
                points = [];
            } else {
                points = JSON.parse(points);
            }
            return points;
        }
    }, {
        key: 'clearAnonymousPoints',
        value: function clearAnonymousPoints() {
            localStorage.setItem('anonymous_points', '[]');
        }
    }, {
        key: 'addPoint',
        value: function addPoint(point) {
            var points = localStorage.getItem('points');
            if (points == undefined) {
                points = [];
            } else {
                points = JSON.parse(points);
            }
            points.push(point['syncNumber']);
            points.push(point['data']);
            points = JSON.stringify(points);
            localStorage.setItem('points', points);
        }
    }, {
        key: 'addPoints',
        value: function addPoints(newPoints) {
            var points = localStorage.getItem('points');
            if (points == undefined) {
                points = [];
            } else {
                points = JSON.parse(points);
            }
            _lodash2.default.forEach(newPoints, function (point) {
                points.push(point['syncNumber']);
                points.push(point['data']);
            });
            points = JSON.stringify(points);
            localStorage.setItem('points', points);
        }
    }, {
        key: 'pointsAtRange',
        value: function pointsAtRange(minValue, maxValue) {
            var points = localStorage.getItem('points');
            if (points == undefined) {
                points = [];
            } else {
                points = JSON.parse(points);
            }
            points = _lodash2.default.chunk(points, 2);
            points = _lodash2.default.filter(points, function (tuple) {
                var number = tuple[0];
                if (minValue <= number && number < maxValue) {
                    return true;
                }
                return false;
            });
            points = _lodash2.default.map(points, function (tuple) {
                return {
                    'syncNumber': tuple[0],
                    'data': tuple[1]
                };
            });
            return points;
        }
    }]);

    return WebLocalStorage;
}();

exports.default = WebLocalStorage;
//# sourceMappingURL=WebLocalStorage.js.map