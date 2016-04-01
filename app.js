var express = require('express');
var path = require('path');
var favicon = require('serve-favicon');
var logger = require('morgan');
var cookieParser = require('cookie-parser');
var bodyParser = require('body-parser');

var routes = require('./routes/index');
var requestrate = require('./routes/requestrate');
var numhosts = require('./routes/numhosts');
var Memcached = require('memcached');
var request = require('request');
var NanoTimer = require('nanotimer');

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
    app.use(function (err, req, res) {
        res.status(err.status || 500);
        res.render('error', {
            message: err.message,
            error: err
        });
    });
}

// production error handler
// no stacktraces leaked to user
app.use(function (err, req, res) {
    res.status(err.status || 500);
    res.render('error', {
        message: err.message,
        error: {}
    });
});


module.exports = app;


/*
 initialize beginning values
 */
var Server = "127.0.0.1:11211";
var options = {};
var memcached = new Memcached(Server, options);

memcached.set("h", 1, 0, function () {
    // console.log("done set number hosts");
});

memcached.set("r", 1, 0, function () {
    // console.log("done set rate (per sec)");
});


/*
 cylce every x ms to check memcache to calculate
 request rate which is based on global requests that
 should be made incorporating how many checking hosts
 that exist to spread those checks out with
 */
/*
 * what's the interval? (1/rate) * host-count
 */
var memCacheCheckInterval = "2s";
var numHosts;
var globalReqRate;
var localReqRate;


var checkCache = function (timer) {
    memcached.get("h", function (err, data) {
        numHosts = data;
        memcached.get("r", function (err, data) {
            globalReqRate = data;

            /*
             now calculate resulting local req rate
             */
            if (globalReqRate != null && numHosts != null) {
                localReqRate = numHosts / globalReqRate * 1000 + "m";
            } else {
                console.log("cannot calculate localReqRate");
            }

            timer.clearInterval();
            makeRequests(timer);
        });
    });
};


var requester = function () {
    console.log(Date.now() + " making request");
    request('http://localhost:9000/', function (error, response, body) {
    });
};


var makeRequests = function (timer) {
    if (localReqRate != null) {
        timer.setInterval(requester, '', localReqRate);
    }
};


var begin = function (timerR, timerC) {
    timerC.setInterval(function () {
        timerR.clearInterval();
        checkCache(timerR);
    }, '', memCacheCheckInterval);
};


var timerCacheCheck = new NanoTimer();
var timerRequester = new NanoTimer();

begin(timerRequester, timerCacheCheck);
