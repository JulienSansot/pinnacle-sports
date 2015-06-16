var request = require('request');
var Q = require('q');
var querystring = require('querystring');

var pinnacle_api_url = 'https://api.pinnaclesports.com/v1/';

function PinnacleSportsClient(username, password){
	this.auth = 'Basic ' + new Buffer(username + ':' + password).toString('base64');
}

exports.createClient = function(username, password){

	if(!username || !password){
		throw new Error('no username and/or password provided in createClient()');
		return;
	}

	return new PinnacleSportsClient(username, password);
};

PinnacleSportsClient.prototype.getFixtures = function (options) {
	return this.get('fixtures?' + querystring.stringify(options || {}))
}

PinnacleSportsClient.prototype.get = function(endpoint, callback){
	var deferred = Q.defer();

	var request_options = {
	  url: pinnacle_api_url + endpoint,
	  headers: {
	    'Authorization': this.auth
	  }
	};

	request(request_options, function (error, response, body) {
		var processedResponse = processResponse(error, body);

		if(processedResponse.error){
			deferred.reject(new Error(processedResponse.error));
		}
		else{
			deferred.resolve(processedResponse.result);
		}
	});

	return deferred.promise;
}


function processResponse(error, body){	
	if(error){
		return {error: error};
	}

	if(body == ''){
		return {error: 'EMPTY_RESPONSE'};
	}

	var result = null;
	try{
		result = JSON.parse(body);
	}
	catch(e){
	}

	if(result == null){
		return {error: { error: 'could\'t parse result', result: body}};
	}

	return {result: result};
}



