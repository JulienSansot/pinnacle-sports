Pinnacle Sports API for Node.js
================================================

A node module to use the Pinnacle Sports API <https://www.pinnaclesports.com>

API's documentation : <http://www.pinnaclesports.com/en/api/manual>


## Usage ##

Creating a client
```JavaScript
var pinnacle_sports = require('pinnacle-sports');

//you have to pass the login and password that you use to connect on the website.
//Pinnacle doesn't provide any api-key
var client = pinnacle_sports.createClient('username', 'password');
```

All the operations from the API are implemented :
* get_sports
* get_leagues
* get_feed
* get_fixtures
* get_odds
* get_currencies
* get_client_balance
* place_bet
* place_parlay_bet
* get_line
* get_parlay_line
* get_bets
* get_inrunning
* get_translations


You use an operation like this :
```JavaScript

//this example will request all soccer fixtures

var options = {
  sportid: 29
};

client.get_fixtures(options, function(error, result){
  console.log(error);
  console.log(result);
});

// you can also use it as a promise if you prefer
client.get_fixtures(options)
.then(function(result){
  console.log(result);
})
.catch(function(error){
  console.log(error);
});
```


for the list of possible options for each operation please see the documentation on the Pinnacle Sports website : <http://www.pinnaclesports.com/en/api/manual>
