Pinnacle Sports API for Node.js
================================================

This is a node module to use the Pinnacle Sports API <https://www.pinnaclesports.com>

API's documentation : <http://www.pinnaclesports.com/en/api/manual>


## Usage ##

Creating a client
```JavaScript
var pinnacle_sports = require('pinnacle-sports');

//you have to pass the login and password that you use to connect on the website.
//Pinnacle doesn't provide any api-key
var client = pinnacle_sports.createClient('username', 'password');
```

Request list of sports
```JavaScript

//this example will request all sports

//for the list of possible options,
//see the documentation : http://www.pinnaclesports.com/en/api/manual#Gsports

var options = {};

client.getSports(options)
.then(function(result){
    console.log(result);
})
.catch(function(error){
    console.log(error);
});
```

Request fixtures
```JavaScript

//this example will request all soccer fixtures

//for the list of possible options,
//see the documentation : http://www.pinnaclesports.com/en/api/manual#GetFixtures

var options = {
  sportId: 29
};

client.getFixtures(options)
.then(function(result){
    console.log(result);
})
.catch(function(error){
    console.log(error);
});

```