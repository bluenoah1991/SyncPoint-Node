import _ from 'lodash';

export default class WebLocalStorage{

    number(){
        let number = localStorage.getItem('number');
        if(number == undefined){
            number = 0;
            localStorage.setItem('number', number);
        }
        return number;
    }

    setNumber(number){
        localStorage.setItem('number', number);
    }

    syncId(){
        let id = localStorage.getItem('sync_id');
        if(id == undefined){
            return 0;
        } else {
            return parseInt(id);
        }
    }

    setSyncId(id){
        localStorage.setItem('sync_id', id);
    }

    addAnonymousPoint(point){
        let points = localStorage.getItem('anonymous_points');
        if(points == undefined){
            points = [];
        } else {
            points = JSON.parse(points);
        }
        points.push(point);
        points = JSON.stringify(points);
        localStorage.setItem('anonymous_points', points);
    }

    dumpAnonymousPoints(){
        let points = localStorage.getItem('anonymous_points');
        if(points == undefined){
            points = [];
        } else {
            points = JSON.parse(points);
        }
        return points;
    }

    clearAnonymousPoints(){
        localStorage.setItem('anonymous_points', '[]');
    }

    addPoint(point){
        let points = localStorage.getItem('points');
        if(points == undefined){
            points = [];
        } else {
            points = JSON.parse(points);
        }
        points.push(point['syncNumber']);
        points.push(point['data']);
        points = JSON.stringify(points);
        localStorage.setItem('points', points);
    }

    addPoints(newPoints){
        let points = localStorage.getItem('points');
        if(points == undefined){
            points = [];
        } else {
            points = JSON.parse(points);
        }
        _.forEach(newPoints, function(point){
            points.push(point['syncNumber']);
            points.push(point['data']);
        });
        points = JSON.stringify(points);
        localStorage.setItem('points', points);
    }

    pointsAtRange(minValue, maxValue){
        let points = localStorage.getItem('points');
        if(points == undefined){
            points = [];
        } else {
            points = JSON.parse(points);
        }
        points = _.chunk(points, 2);
        points = _.filter(points, function(tuple){
            let number = tuple[0];
            if(minValue <= number && number < maxValue){
                return true;
            }
            return false;
        });
        points = _.map(points, function(tuple){
            return {
                'syncNumber': tuple[0],
                'data': tuple[1]
            };
        });
        return points;
    }
}