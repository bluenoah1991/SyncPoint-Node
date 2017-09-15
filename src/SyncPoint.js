import _ from 'lodash';

import {HttpPack} from 'http-pack';

import WebLocalStorage from './WebLocalStorage';

export default class SyncPoint{
    constructor(options){
        if(options == undefined){
            options = {};
        }
        this.needSyncNumberOfSegment = 0;
        this.storage = new WebLocalStorage();
        // Important! Serial execution
        this.syncId = this.storage.syncId();
        _.assign(options, {
            callback: this._respondHandle.bind(this)
        });
        this.httpPack = new HttpPack(options);
    }

    _numberOfSegment(number){
        let segmentNumber = number >> 16;
        return segmentNumber << 16;
    }

    _numberOfNextSegment(number){
         let newSegmentNumber = (number >> 16) + 1;
         return newSegmentNumber << 16;
    }   

    _respondHandle(payload, response){
        let data = JSON.parse(payload.toString('utf-8'));
        let newNumberOfSegment = data['newNumberOfSegment'];
        if(newNumberOfSegment != undefined){
            let number = this.storage.number();
            let numberOfSegment = this._numberOfSegment(number);
            if(newNumberOfSegment > numberOfSegment){
                if(!this.startSync() && this.needSyncNumberOfSegment < newNumberOfSegment){
                    this.needSyncNumberOfSegment = newNumberOfSegment;
                }
            }
        } else {
            let syncId = data['id'];
            let points = data['points'];
            let numberOfSegment = data['numberOfSegment'];
            if(syncId == undefined || points == undefined || numberOfSegment == undefined){
                return;
            }
            if(syncId - this.syncId != 1){
                return;
            }
            let needSync = false;
            if(this.resolvingReverseConflicts != undefined){
                let anonymousPoints = this.storage.dumpAnonymousPoints();
                /*
                 * localConflictsPoints: points - anonymousPoints
                 * newPoints: anonymousPoints - points
                 */
                let [localConflictsPoints, newPoints] = 
                    this.resolvingReverseConflicts(anonymousPoints, points, numberOfSegment);
                this.storage.clearAnonymousPoints();
                if(this.implementHandle != undefined){
                    _.forEach(localConflictsPoints, function(point){
                        this.implementHandle(point['data']);
                    }.bind(this));
                }
                this.storage.addPoints(points);
                this.storage.addPoints(newPoints);
                this.storage.setNumber(numberOfSegment);
                if(newPoints.length > 0){
                    needSync = true;
                }
            }
            this.syncId = syncId;
            this.storage.setSyncId(this.syncId);
            if(needSync || this.needSyncNumberOfSegment > numberOfSegment){
                this.startSync();
            }
        }
    }

    registerResolvingReverseConflicts(handle){
        this.resolvingReverseConflicts = handle;
    }

    registerImplementHandle(handle){
        this.implementHandle = handle;
    }

    addPoint(data){
        if(this.syncId % 2 == 1){
            this.storage.addAnonymousPoint({
                'data': data
            });
        } else {
            let number = this.storage.number();
            number++;
            this.storage.setNumber(number);
            this.storage.addPoint({
                'syncNumber': number,
                'data': data
            });
            this.startSync();
        }
    }

    startSync(){
        if(this.syncId % 2 == 1){
            return false;
        }
        this.storage.setSyncId(++this.syncId);
        let number = this.storage.number();
        let numberOfSegment = this._numberOfSegment(number);
        let numberOfNextSegment = this._numberOfNextSegment(number);
        let newPoints = this.storage.pointsAtRange(numberOfSegment, numberOfNextSegment);
        let data = JSON.stringify({
            'id': this.syncId,
            'clientNumberOfSegment': numberOfSegment,
            'newPoints': newPoints
        });
        this.httpPack.commit(new Buffer(data, 'utf-8'), 2);
        return true;
    }
}