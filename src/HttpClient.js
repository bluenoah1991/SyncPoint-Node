import _ from 'lodash';

import {HttpPack} from 'http-pack';

export default class HttpClient{
    constructor(options){
        if(options == undefined){
            options = {};
        }
        this.callback = function(){};
        this.scope = options['scope'] || 'user1';
        this.url = options['url'] || 'http://example.com';
        this.outgoing_address = options['outgoing_address'] || '/outgoing';
        this.incoming_address = options['incoming_address'] || '/incoming';
        this.httpPack = new HttpPack(options);
        this._pushStream = this._pushStream.bind(this);
    }

    _checkStatus(response) {
        if (response.status >= 200 && response.status < 300) {
            return response;
        } else {
            let error = new Error(response.statusText);
            error.response = response;
            throw error;
        }
    }
    
    _newRequest(url, scope, body){
        return fetch(url, {
            method: 'POST',
            body: body,
            headers: {
                'Content-Type': 'application/octet-stream',
                'SyncPoint-Scope': scope
            },
            credentials: 'same-origin'
        }).then(this._checkStatus).then(function(response){
            return response.arrayBuffer().then(function(buffer){
                // https://github.com/nodejs/node/issues/106
                return new Buffer(new Uint8Array(buffer));
            });
        }).catch(function(error){
            return null;
        });
    }
    
    _newLongRequest(url, scope, callback){
        fetch(url, {
            method: 'POST',
            headers: {
                'SyncPoint-Scope': scope
            },
            credentials: 'same-origin'
        }).then(function(response){
            let reader = response.body.getReader();
            return readChunk();
    
            function readChunk(){
                return reader.read().then(newChunk);
            }
    
            function newChunk(result){
                callback(false, result.value);
                if(result.done){
                    return true;
                } else {
                    return readChunk();
                }
            }
        }).then(function(result){
            callback(true, null);
        }).catch(function(err){
            callback(true, null);
        });
    }
    
    _pushStream(){
        this.httpPack.generateBody().then(function(requestBody){
            if(requestBody == undefined || requestBody.length == 0){
                this.handle = setTimeout(this._pushStream, 100);
                return null;
            } else {
                this._newRequest(`${this.url}${this.incoming_address}`, this.scope, requestBody).then(function(){
                    this.handle = setTimeout(this._pushStream, 100);
                }.bind(this));
            }
        }.bind(this));
    }

    registerCallback(callback){
        this.callback = callback;
    }

    startLongPolling(){
        this._newLongRequest(`${this.url}${this.outgoing_address}`, this.scope, function(done, chunk){
            if(done){
                setTimeout(this.startLongPolling.bind(this), 1000);
                return;
            }
            this.httpPack.parseBody(chunk, this.callback.bind(this));
        }.bind(this));
    }

    startPushStream(){
        this.handle = setTimeout(this._pushStream, 1000);
    }

    commit(payload, qos){
        return this.httpPack.commit(payload, qos);
    }
}