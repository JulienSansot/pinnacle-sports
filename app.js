var request = require('request');
var Q = require('q');
var querystring = require('querystring');
var parseString = require('xml2js').parseString;

var pinnacle_api_url = 'https://api.pinnaclesports.com/v1/';

var operations = [
	{
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
		endpoint: 'fixtures'
	},
	{
		endpoint: 'odds'
	},
	{
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
		endpoint: 'client_balance'
	}
];


function PinnacleSportsClient(username, password){
	this.auth = 'Basic ' + new Buffer(username + ':' + password).toString('base64');
}

operations.forEach(function(operation){

	PinnacleSportsClient.prototype['get_' + operation.endpoint] = function (options) {

		var result = this.get(operation.endpoint.replace(/_/g, "/") + '?' + querystring.stringify(options || {}));

		if(operation.map){
			return result.then(operation.map);
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

PinnacleSportsClient.prototype.get = function(endpoint){
	var deferred = Q.defer();

	var request_options = {
	  url: pinnacle_api_url + endpoint,
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




function processResponse(error, body){	

	var deferred = Q.defer();

	if(error){
		deferred.reject(error);
	}
	else if(body == ''){
		deferred.reject('EMPTY_RESPONSE');
	}
	else {

		var result = null;
		try{
			result = JSON.parse(body);
		}
		catch(e){
			parseString(body, function (err, json_result) {
				if(err){
					deferred.reject('couldn\'t parse result');
				}
				else{

					if(json_result.rsp){
						json_result = json_result.rsp;
					}

					if(json_result.err){
						console.log('aaaa');
						deferred.reject(JSON.stringify(json_result.err));
					}
					else{
						deferred.resolve(json_result);
					}
				}
			});
		}

		if(result == null){
			deferred.reject('couldn\'t parse result');
		}
		else{

			if(result.code && result.message){
				deferred.reject(JSON.stringify(result));
			}
			else{
				deferred.resolve(result);
			}
		}
	}

	return deferred.promise;
}



