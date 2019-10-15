var createError = require('http-errors');
var express = require('express');
var path = require('path');
var cookieParser = require('cookie-parser');
var logger = require('morgan');

const helmet = require('helmet');
const cors = require('cors');
const azurestorage = require('azure-storage');
if (process.env.NODE_ENV !== 'production') {
  require('dotenv').config();
}
const blobService = azurestorage.createBlobService();
const containerName = "f1-db";

var indexRouter = require('./routes/index');
var seasonRouter = require('./routes/season');

var app = express();

blobService.createContainerIfNotExists(containerName, { publicAccessLevel: 'blob' }, err => {
  if (err) {
    console.log(err);
  } else {
    console.log(`Container with name ${containerName} created successfully`);
  }
});

// view engine setup
app.set('views', path.join(__dirname, 'views'));
app.set('view engine', 'pug');

app.use(logger('tiny'));
app.use(helmet());
app.use(cors());
app.use(express.json());
app.use(express.urlencoded({ extended: false }));
app.use(cookieParser());
app.use(express.static(path.join(__dirname, 'public')));

app.use('/seasons', seasonRouter);
app.use('/', indexRouter);

// catch 404 and forward to error handler
app.use(function(req, res, next) {
  next(createError(404));
});

// error handler
app.use(function(err, req, res, next) {
  // set locals, only providing error in development
  res.locals.message = err.message;
  res.locals.error = req.app.get('env') === 'development' ? err : {};

  // render the error page
  res.status(err.status || 500);
  res.render('error');
});

module.exports = app;
