
/**
 * Module dependencies.
 */
var express = require('express');
var mongoose = require('mongoose');
var session = require('session');
var connect = require('connect');
var everyauth = require('everyauth');
var jq = require('jquery');
var jd = require('jsdom');
var util = require('util');
var Promise = everyauth.Promise;
var mongooseAuth = require('./node_modules/mongoose-auth/index.js');
var ObjectId = mongoose.SchemaTypes.ObjectId;

// additional variables
var rollresult=0;

// Database Declerations
var Schema = mongoose.Schema
var UserSchema = new Schema({});

// our schema
var CharacterSheet = new Schema({
    _id       : {type : ObjectId},
    Name      : {type : String, default : '',      required : true},
    Looks     : {type : String, default : 'Ugly',  required : false},
    Cool      : {type : Number, default : '0',     required : true},
    Hot       : {type : Number, default : '0',     required : true},
    Sharp     : {type : Number, default : '0',     required : true},
    Hard      : {type : Number, default : '0',     required : true},
    Weird     : {type : Number, default : '0',     required : true},
    Wounds    : {type : Number, default : '0',     required : true},
    Armor     : {type : Number, default : '0',     required : true},
    ArmorType : {type : String, default : 'None',  required : true},
    HX        : {type : String, default : '',      required : false},
    Gear      : {type : String, default : '',      required : false},
    Holds     : {type : String, default : '',      required : false},
    XP        : {type : Number, default : '0',     required : true},
    Advances  : {type : Number, default : '0',     required : true},
    Owner     : {type : String, default : '',      required: true}
});

var db = mongoose.connect('mongodb://localhost:27017/awdb');
var Sheet = mongoose.model('CharacterSheet', CharacterSheet);
var cs = new Sheet();

// add in schema plugins via mongooseAuth
 UserSchema.plugin(mongooseAuth, {
    everymodule: {
      everyauth: {
          User: function () {
            return User;
          }
      }
    }
  , facebook: {
      everyauth: {
          myHostname: 'http://localhost:3000'
        , appId: '237795932939775'
        , appSecret: 'bf5a2ec8b30fc33f21da63f794d2859a'
        , redirectPath: '/'
      }
    }
});
 
var User = mongoose.model('User', UserSchema);


//Dice Roller - This rolls 2d6 and adds the argument, generally one of the stats.
 var RollDie = function(arg){
  total = 0;
  total = (Math.floor((Math.random()*6)+1) + Math.floor((Math.random()*6)+1)) + Number(arg);
  return total;
  };

// Configuration
var app = module.exports = express.createServer();
app.configure(function() {
  app.set('views', __dirname + '/views');
  app.set('view engine', 'jade');
  app.use(express.bodyParser());
  app.use(express.methodOverride());
  app.use(express.compiler({ src: __dirname + '/public', enable: ['sass'] }));
  app.use(express.cookieParser());
  app.use(express.session({secret: 'fiddler'}));
  app.use(mongooseAuth.middleware());
  //app.use(app.router);
  app.use(express.static(__dirname + '/public'));
});

//Add helper arguments
mongooseAuth.helpExpress(app);

//everyauth.helpExpress(app);

app.configure('development', function() {
  app.use(express.errorHandler({ dumpExceptions: true, showStack: true })); 
});

app.configure('production', function() {
  app.use(express.errorHandler()); 
});

// Routes
app.get('/', function(req, res){
        if(req.user) {
            res.redirect('/myAW/:' + req.user.fb.id);
        } else {
              res.render('index', {
                locals: { title: 'Lazy AW',
                scripts: ['https://ajax.googleapis.com/ajax/libs/jquery/1.6.3/jquery.js'],
                }
              });
        }
});

app.get('/myAW/:id', function(req, res){
     //user verification stuff?
      Sheet.find({owner: req.params.id}, ['_id'], function(err, cs) {
      if (!err){
               for (i in cs)
        {
          console.log(cs[i]._id);
        }
        res.render('index', {
            locals: { title: 'Lazy AW',
              scripts: ['https://ajax.googleapis.com/ajax/libs/jquery/1.6.3/jquery.js'],
              name: cs
             }
               });
             }
      else {throw err;}

});
});

app.post('/', function(req, res){

    //save
    cs._id   = req.body.Name;
    cs.Looks = req.body.Looks;
    cs.Cool  = req.body.Cool;
    cs.Hot   = req.body.Hot;
    cs.Sharp = req.body.Sharp;
    cs.Hard  = req.body.Hard;
    cs.Weird = req.body.Weird;
    cs.Owner = req.user.fb.id;
    cs.save(function (err) {
      if (!err) console.log('Success!');
    });
    
    res.render('index', { locals: { title: cs._id + 'posted', scripts: ['https://ajax.googleapis.com/ajax/libs/jquery/1.6.3/jquery.js']}});
});

app.get('/roll', function(req, res){
    var obj = req.query['value1'];
    var rollresult = RollDie(obj);
    console.log(obj);
    res.json(rollresult);
    res.end();
});

app.get('/sheet/:name', function(req, res) {
     console.log(req.params.name + 'yup');
     Sheet.findById(req.params.name, function (err, doc){
      console.log(req.params.name);
      res.json(doc);
    });
});

app.post('/sheet/:name', function(req, res) {

    // Take the input and update record
    console.log(req.body.Name + req.body.Cool + req.body.Hot + req.body.Looks + 'about to save');
    var keyId = req.params.name;
    console.log('key id =' + keyId);

    Sheet.findById(keyId, function (err, cs) {
      if (!err) {
    cs.Looks  = req.body.Looks;
    cs.Cool   = req.body.Cool;
    cs.Hot    = req.body.Hot;
    cs.Sharp  = req.body.Sharp;
    cs.Hard   = req.body.Hard;
    cs.Weird  = req.body.Weird;
    cs.Owner  = req.user.fb.id;

     } else {
      console.log('there was an error');    
     }
    cs.save(function (err) {
     if (!err) {
     console.log('saved, opening next'); 
    } else {throw err}
     });
   });
  res.end(); 
});

app.get('/characters', function(req, res) {

});

app.del('/', function(req, res){
  
});

app.listen(3000);
console.log("Express server listening on port %d in %s mode", app.address().port, app.settings.env);
