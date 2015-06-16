var request = require('request');
var Q = require('q');
var querystring = require('querystring');
var parseString = require('xml2js').parseString;

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

PinnacleSportsClient.prototype.getSports = function (options) {

	var parseXml = function(xml, callback){
		parseString(xml, function (err, result) {
			var sports = result.rsp.sports[0].sport.map(function(sport){
				return {
					id: sport['$'].id,
					name: sport._,
					feedContents: sport['$'].feedContents
				};
			});
	    callback(sports);
		});
	}

	return this.get('sports?' + querystring.stringify(options || {}), parseXml)
}

PinnacleSportsClient.prototype.get = function(endpoint, xmlParser){
	var deferred = Q.defer();

	var request_options = {
	  url: pinnacle_api_url + endpoint,
	  headers: {
	    'Authorization': this.auth
	  }
	};

	request(request_options, function (error, response, body) {
		var processedResponse = processResponse(error, body, !!xmlParser);

		if(processedResponse.error){
			deferred.reject(new Error(processedResponse.error));
		}
		else{
			if(xmlParser){
				xmlParser(processedResponse.result, function(result){
					deferred.resolve(result);
				})
			}
			else{
				deferred.resolve(processedResponse.result);
			}
		}
	});

	return deferred.promise;
}


function processResponse(error, body, xml){	
	if(error){
		return {error: error};
	}

	if(body == ''){
		return {error: 'EMPTY_RESPONSE'};
	}

	if(xml){
		return {result: body};
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



