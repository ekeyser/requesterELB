var express = require('express');
var path = require('path');
var favicon = require('serve-favicon');
var logger = require('morgan');
var cookieParser = require('cookie-parser');
var bodyParser = require('body-parser');

var routes = require('./routes/index');
var requestrate = require('./routes/requestrate');
var numhosts = require('./routes/numhosts');

var app = express();

// view engine setup
app.set('views', path.join(__dirname, 'views'));
app.set('view engine', 'jade');

// uncomment after placing your favicon in /public
//app.use(favicon(path.join(__dirname, 'public', 'favicon.ico')));
app.use(logger('dev'));
app.use(bodyParser.json());
app.use(bodyParser.urlencoded({extended: false}));
app.use(cookieParser());
app.use(express.static(path.join(__dirname, 'public')));

app.use('/', routes);
app.use('/requestrate', requestrate);
app.use('/numhosts', numhosts);

// catch 404 and forward to error handler
app.use(function (req, res, next) {
    var err = new Error('Not Found');
    err.status = 404;
    next(err);
});

// error handlers

// development error handler
// will print stacktrace
if (app.get('env') === 'development') {
    app.use(function (err, req, res, next) {
        res.status(err.status || 500);
        res.render('error', {
            message: err.message,
            error: err
        });
    });
}

// production error handler
// no stacktraces leaked to user
app.use(function (err, req, res, next) {
    res.status(err.status || 500);
    res.render('error', {
        message: err.message,
        error: {}
    });
});


module.exports = app;


var Memcached = require('memcached');
var Server = "127.0.0.1:11211";
var options = {};
var memcached = new Memcached(Server, options);

memcached.set("h", 1, 0, function () {
    // console.log("done set number hosts");
});

memcached.set("r", 2, 0, function () {
    // console.log("done set rate (per sec)");
});


var memCacheCheckInterval = 2000;

/*
  cylce every x ms to check memcache to calculate
  request rate which is based on global requests that
  should be made incorporating how many checking hosts
  that exist to spread those checks out with
 */
setInterval(function () {
    // console.log("checking num hosts");
    var numHosts;
    memcached.get("h", function (err, data) {
        numHosts = data;
        // console.log("numHosts is " + numHosts);
        calcRR();
    });

    // console.log("checking req rate");
    var globalReqRate;
    memcached.get("r", function (err, data) {
        // console.log(err);
        // console.log(data);
        globalReqRate = data;
        // console.log("globalReqRate is " + globalReqRate);
        calcRR();
    });
    
    
    /*
     * what's the interval? (1/rate) * host-count
     */
    var localReqRate;
    function calcRR() {
        // console.log("calculating RR");
        if (globalReqRate != null) {
            // console.log("globalReqRate not null");
            if (numHosts != null) {
                // console.log("numHosts not null");
                localReqRate = numHosts / globalReqRate * 1000;
                // console.log(localReqRate);
            }
        }
        
        if (localReqRate != null) {
            makeRequests(localReqRate);
        }
    };
    
    
}, memCacheCheckInterval);

var reqIntervalHandle;


function makeRequests(currInterval) {
    if (reqIntervalHandle != null) {
        clearInterval(reqIntervalHandle);
    }
    reqIntervalHandle = setInterval(function () {
        var request = require('request');
        request('http://localhost:9000/', function (error, response, body) {
            console.log("request made");
            // console.log(error);
            // console.log(response);
            // console.log(body);
        });
    }, currInterval);
};


