var request = require('request');
var Q = require('q');
var querystring = require('querystring');
var parseString = require('xml2js').parseString;
var uuid = require('node-uuid');

var pinnacle_api_url = 'https://api.pinnaclesports.com/v1/';


// List of all the operations supported by the API
// name is the name of the function on the object PinnacleSportsClient
// endpoint is the endpoint on the pinnacle api
// map is an optionnal function which will be run on the result of the request
// if type equal 'post', it's a POST request, otherwise it's a GET
var operations = [
  {
    name: 'get_sports',
    endpoint: 'sports',
    map: function(result){
      return result.sports[0].sport.map(function(o){
        return {
          id: o['$'].id,
          name: o._,
          feedContents: o['$'].feedContents
        };
      });
    }
  },
  {
    name: 'get_leagues',
    endpoint: 'leagues',
    map: function(result){
      return result.leagues[0].league.map(function(o){
        return {
          id: o['$'].id,
          name: o._,
          feedContents: o['$'].feedContents,
          homeTeamType: o['$'].homeTeamType,
          allowRoundRobins: o['$'].allowRoundRobins,
        };
      });
    }
  },
  {
    name: 'get_feed',
    endpoint: 'feed',
    map: function(result){
      return result.fd[0];
    }
  },
  {
    name: 'get_fixtures',
    endpoint: 'fixtures'
  },
  {
    name: 'get_odds',
    endpoint: 'odds'
  },
  {
    name: 'get_parlay_odds',
    endpoint: 'odds/parlay'
  },
  {
    name: 'get_currencies',
    endpoint: 'currencies',
    map: function(result){
      return result.currencies[0].currency.map(function(o){
        return {
          name: o._,
          code: o['$'].code,
          rate: o['$'].rate
        };
      });
    }
  },
  {
    name: 'get_client_balance',
    endpoint: 'client/balance'
  },
  {
    name: 'place_bet',
    endpoint: 'bets/place',
    type: 'post'
  },
  {
    name: 'place_parlay_bet',
    endpoint: 'bets/parlay',
    type: 'post'
  },
  {
    name: 'get_line',
    endpoint: 'line'
  },
  {
    name: 'get_parlay_line',
    endpoint: 'line/parlay',
    type: 'post'
  },
  {
    name: 'get_bets',
    endpoint: 'bets'
  },
  {
    name: 'get_inrunning',
    endpoint: 'inrunning'
  },
  {
    name: 'get_translations',
    endpoint: 'translations'
  }
];



function PinnacleSportsClient(username, password){
  this.auth = 'Basic ' + new Buffer(username + ':' + password).toString('base64');
}


//applying all the operations function to the PinnacleSportsClient object
operations.forEach(function(operation){

  PinnacleSportsClient.prototype[operation.name] = function (options, callback) {

    var url = pinnacle_api_url + operation.endpoint;

    var result = operation.type === 'post' ?
      this.post(url, options) :
      this.get(url, options) ;


    if(operation.map){
      result = result.then(operation.map);
    }

    if(callback && typeof(callback) === 'function'){
      result.then(function(result){
        callback(null, result);
      })
      .catch(function(err){
        callback(err);
      })
    }

    return result;
  }

});


exports.createClient = function(username, password){

  if(!username || !password){
    throw new Error('no username and/or password provided in createClient()');
    return;
  }

  return new PinnacleSportsClient(username, password);
};

exports.create_client = exports.createClient;

//sending a post request to the API
PinnacleSportsClient.prototype.post = function(url, options){
  var deferred = Q.defer();  

  // the API requires that the post requests have this property filled with a unique GUID
  // so if is not set, we set it here 
  if(options && options.uniqueRequestId == undefined){
    options.uniqueRequestId = uuid.v4();
  }

  var request_options = {
    url: url,
    headers: {
      'Authorization': this.auth,
      'Content-Type': 'application/json'
    },
    body: JSON.stringify(options || {})
  };

  request.post(request_options, function (error, response, body) {
    processResponse(error, body)
    .then(function(result){
      deferred.resolve(result);
    })
    .catch(function(error){
      deferred.reject(new Error(error));
    });
  });

  return deferred.promise;
};


// sending a get request to the API
PinnacleSportsClient.prototype.get = function(url, options){
  var deferred = Q.defer();

  var request_options = {
    url: url + '?' + querystring.stringify(options || {}),
    headers: {
      'Authorization': this.auth
    }
  };

  request(request_options, function (error, response, body) {
    processResponse(error, body)
    .then(function(result){
      deferred.resolve(result);
    })
    .catch(function(error){
      deferred.reject(new Error(error));
    });
  });

  return deferred.promise;
}


//process the response returned by the API
function processResponse(error, body){

  var deferred = Q.defer();

  if(error){
    //the request failed
    deferred.reject(error);
  }
  else if(body == ''){
    //the API returned an empty response.
    //it happens on some requests when it's too often.
    //for example it happens often on get_fixtures
    deferred.reject('EMPTY_RESPONSE');
  }
  else {

    var result = null;
    try{
      //trying to parse the result to JSON
      result = JSON.parse(body);
    }
    catch(e){
      //failed to parse JSON so let's try XML
      parseString(body, function (err, json_result) {
        if(err){
          //the result is neither valid JSON nor XML
          deferred.reject('couldn\'t parse result: \n' + body);
        }
        else{

          //'rsp' is a root element, we can get rid of it
          if(json_result.rsp){
            json_result = json_result.rsp;
          }

          if(json_result.err){
            //the API returned an error
            deferred.reject(JSON.stringify(json_result.err));
          }
          else{
            //all good
            deferred.resolve(json_result);
          }
        }
      });
    }

    if(result == null){
      //the result is neither valid JSON nor XML
      deferred.reject('couldn\'t parse result: \n' + body);
    }
    else{

      if(result.code && result.message){
        //the API returned an error
        deferred.reject(JSON.stringify(result));
      }
      else if(result.errorCode){
        //the API returned an error
        deferred.reject(JSON.stringify(result));
      }
      else{
        //all good
        deferred.resolve(result);
      }
    }
  }

  return deferred.promise;
}



