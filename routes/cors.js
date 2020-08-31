
const express = require('express');
const cors = require('cors');
const app = express();

// whitelist contain all the origins this server is willing to accept
const whitelist = ['http://localhost:3000', 'https://localhost:3443', 'http://RISHABH-PC:3001'];

// here we will configure cors options
var corsOptionsDelegate = (req, callback) => {
    var corsOptions;
    console.log(req.header('Origin'));
    // this will check if the request contains the origin and match it with our whitelist
    if (whitelist.indexOf(req.header('Origin')) !== -1) {   // here if it is not present in the array returns -1 otherwise value >= 0
        corsOptions = { origin: true };
        // here if origin is true then, cors module will reply back saying access control
        // allow origin and include that origin into the header with the access control allow origin key
        //  by this way client side will be informed that its okay to use the particular origin
    }
    else {
        corsOptions = { origin: false };
        // here access control allow origin will not be returned as origin is set to false
    }
    callback(null, corsOptions);
};
//  if we setup cors like this then it will return access control allow origin with the wildcard *
// this is recommended on the get request only
exports.cors = cors();

// and if we want to apply these options on certain routes, then we will use this
exports.corsWithOptions = cors(corsOptionsDelegate);