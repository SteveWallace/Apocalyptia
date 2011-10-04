
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
    Owner     : {type : ObjectId}
});

var db = mongoose.connect('mongodb://localhost:27017/awdb');
var Sheet = mongoose.model('CharacterSheet', CharacterSheet);


UserSchema.plugin(mongooseAuth, {
   everymodule: {
       everyauth: {
         User: function () {
           return User;
       }
     }
   }
  , password: {
            everyauth: {
                getLoginPath: '/login'
              , postLoginPath: '/login'
              , loginView: 'login.jade'
              , getRegisterPath: '/register'
              , postRegisterPath: '/register'
              , registerView: 'register.jade'
              , loginSuccessRedirect: '/'
              , registerSuccessRedirect: '/'
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
  app.use(express.static(__dirname + '/public'));
});

//Add helper arguments

app.helpers({
   title:'Apocalyptia - An Apocalypse World Character Keeper'
 , scripts: ['https://ajax.googleapis.com/ajax/libs/jquery/1.6.3/jquery.js', 'http://static.ak.fbcdn.net/connect/en_US/core.js', 'js/jquery-ui-1.8.16.custom.min.js']
});

mongooseAuth.helpExpress(app);

app.configure('development', function() {
  app.use(express.errorHandler({ dumpExceptions: true, showStack: true })); 
});

app.configure('production', function() {
  app.use(express.errorHandler()); 
});

// Routes
app.get('/', function(req, res){
        
      if(req.user) {
          res.redirect('/myAW/:' + req.user.id);
      } else {
            res.render('index');
      }

});

app.get('/myAW/:id', function(req, res){
    if (!req.user) {
        console.log('you have to be logged in to get characters');
    } else {
      
      Sheet.find({Owner: req.user._id}, ['Name', '_id'], function(err, cs) {
      
      if (!err){
          
          for (i in cs)
          {
           console.log(cs[i]._id);
          }

          res.render('index', { locals: { cs: cs }
        });
      } else {throw err;}

      });
    }
});

app.post('/', function(req, res){   
    res.render('index', { locals: { title: cs._id + 'posted'}});
});


app.get('/sheet/:id', function(req, res) {
     
     Sheet.findById(req.params.id, function (err, doc){
        res.json(doc);
     });
});

app.post('/sheet/:csId', function(req, res) {
// Take the input and update record
    var keyId = req.params.csId;
    var owner = req.user._id;
    
    
    if (!req.user._id) {
      console.log('you must login to save characters');
      res.end();
    }
    console.log('after userId if keyId is ' + keyId);
    if (keyId === 'new') {
                  console.log('in id 0 save pre cs def');
                  var cs = new Sheet();
                  cs.Name   = req.body.Name;
                  cs.Looks  = req.body.Looks;
                  cs.Cool   = req.body.Cool;
                  cs.Hot    = req.body.Hot;
                  cs.Sharp  = req.body.Sharp;
                  cs.Hard   = req.body.Hard;                  
                  cs.Weird  = req.body.Weird;
                  cs.Owner  = owner;  

              cs.save(function (err) {
                 console.log('save step');
               if (!err) {
                 console.log('saved, opening next');
                 res.end(); 
               } else {throw err}
              });  
    } else {

    Sheet.findById(keyId, function (err, cs) {
        if (err) {
             console.log(err);
             res.end();
          } else {
              if (cs) {
                  console.log('trying to update');
                  cs.Name   = req.body.Name;
                  cs.Looks  = req.body.Looks;
                  cs.Cool   = req.body.Cool;
                  cs.Hot    = req.body.Hot;
                  cs.Sharp  = req.body.Sharp;
                  cs.Hard   = req.body.Hard;
                  cs.Weird  = req.body.Weird;
                  //cs.Owner  = owner;
              } else {
                  console.log('trying to save');
                  var cs = new Sheet();
                  cs.Name   = req.body.Name;
                  cs.Looks  = req.body.Looks;
                  cs.Cool   = req.body.Cool;
                  cs.Hot    = req.body.Hot;
                  cs.Sharp  = req.body.Sharp;
                  cs.Hard   = req.body.Hard;
                  cs.Weird  = req.body.Weird;
                  cs.Owner  = owner;  
               }
              cs.save(function (err) {
                console.log('save step');
               if (!err) {
                console.log('saved, opening next');
                res.end(); 
               } else {throw err}
              });
           }  
    });
  }
});

app.listen(3000);
console.log("Express server listening on port %d in %s mode", app.address().port, app.settings.env);
