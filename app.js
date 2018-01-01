var express                 = require("express"),
    app                     = express(),
    methodOverride          = require("method-override"),
    expressSanitizer        = require("express-sanitizer"),
    bodyParser              = require("body-parser"),
    passport                = require("passport"),
    User                    = require("./models/user"),
    Transaction             = require("./models/transaction"),
    mongoose                = require("mongoose"),
    LocalStrategy           = require("passport-local"),
    passportLocalMongoose   = require("passport-local-mongoose"),
    name                    = "user";
    
var Amount, new_trans;
    
 
    //Connecting with Mongodb    
    mongoose.connect("mongodb://localhost/user_info");
    // Connecting with mongodb on mlab
    //mongoose.connect("mongodb://Himanshu:abc456@ds133077.mlab.com:33077/user_info");

    
    app.use(bodyParser.urlencoded({extended:true}));
    app.set("view engine", "ejs");
    app.use(require("express-session")({
         secret:"Internship Assignment",
         resave: false,
         saveUninitialized: false
    }));
    app.use(express.static(__dirname +"/public"));
    app.use(expressSanitizer());
    app.use(passport.initialize());
    app.use(passport.session());
    passport.use(new LocalStrategy(User.authenticate()));
    passport.serializeUser(User.serializeUser());
    passport.deserializeUser(User.deserializeUser());
    app.use(methodOverride("_method"));

    // Home Page ROUTE
    app.get("/",function(req,res){
        res.redirect("/login");
    });

    // Login Page ROUTE
    app.get("/login",function(req,res){
        res.render("login");
    });
    
    // Register Page GET Route(For Adding users in Database)
    app.get("/register",function(req,res){
        res.render("register");
    });
    
    // Register Page POST Route(For Adding users in Database)
    app.post("/register",function(req,res){
        User.register(new User({username: req.body.username}), req.body.password, function(err, user){
           if(err){
               console.log(err);
               return res.send("Error");
           } 
           passport.authenticate("local")(req, res, function(){
              res.redirect("/login"); 
           });
        });
    });
    
    // ROUTE for getting particular client Transaction details
    app.get("/client", isLoggedIn, function(req,res){
        Transaction.find({Clientname : name}, function(err, AllTransactions){
            if(err){
                console.log(err);
                res.redirect("/");
            } else {
                res.render("client", {transactions : AllTransactions,name : name});
                // console.log(AllTransactions);
            }
        });
    });
    
    // ROUTE for admin John Smith for getting details of all clients
    app.get("/admin", isLoggedIn, function(req,res){
        Transaction.find({}, function(err, AllTransactions){
            if(err){
                console.log(err);
            } else {
                        User.find({}, function(err, AllUsers){
                            if(err){
                                 console.log(err);
                            } else {
                                        res.render("admin", {transactions : AllTransactions,users : AllUsers});
                                        // console.log(AllTransactions);
                                   }
                        });
                    }
        });
    });
    
    // ROUTE for adding new Transaction in Table 
    app.get("/admin/new", function(req,res){
        res.render("new");
    });
    
    // ROUTE for selecting transaction details according to Amount
    app.post("/admin/sort", function(req,res){
        // logic for interpreting operator
        if(req.body.operator === "Less Than")
            Amount = {
                        Amount : {$lt:req.body.amount}
                     };
        else if(req.body.operator === "Greater Than")
            Amount = {
                        Amount : {$gt:req.body.amount}
                     };
        else
            Amount = {
                        Amount : {$eq:req.body.amount}
                     };
        //console.log(req.body.operator);
        //console.log(req.body.amount);
        Transaction.find(Amount, function(err, AllTransactions){
            if(err){
                console.log(err);
            } else {
                        User.find({}, function(err, AllUsers){
                            if(err){
                                 console.log(err);
                            } else {
                                        res.render("sorted", {transactions : AllTransactions,users : AllUsers});
                                        // console.log(AllTransactions);
                            }
                        });
                  }
        });
    });
    
    // POST Route for login
    app.post("/login", passport.authenticate("local"), function(req, res){
        name = req.user.username;
        if(req.user.username == 'John Smith')
            res.redirect("/admin");
        else
            res.redirect("/client");
    });
    
    // POST for adding new transaction
    app.post("/admin",function(req,res){
        new_trans = {
                        Clientname : req.body.client_name, 
                        Amount: req.body.amount, 
                        TransactionID : req.body.transaction_id, 
                        Transaction_Type : req.body.transaction_type
                    };
        Transaction.create(new_trans, function(err, newBlog){
            if(err){
                console.log(err);
                res.redirect("/admin/new");
            } else {
                res.redirect("/admin");
            }
        });
    });
    
    // Edit transaction ROUTE
    app.get("/admin/:id/edit", function(req, res) {
        // console.log(req.params.id.toString());
        Transaction.findById(req.params.id, function(err, foundTransaction){
            if(err){
                res.redirect("/admin");
            } else {
                console.log(foundTransaction);
                res.render("edit", {transaction: foundTransaction});
            }
        });
        
    });
    
    // Delete ROUTE for deleting transaction from table
    app.get("/admin/:id/delete", function(req, res) {
        Transaction.remove({_id : mongoose.Types.ObjectId(req.params.id.toString())}, function(err){
            if(err){
                res.redirect("/");
            } else {
                res.redirect("/admin");
            }
        });
    });
    
    // Highlighting Disputed Button in admin table
    app.get("/disputed/:id", function(req, res) {
        Transaction.findByIdAndUpdate(req.params.id,{Disputed : true},{new: true},function(err, foundTransaction){
            if(err){
                res.redirect("/");
            } else {
                console.log(foundTransaction);
                res.redirect("/client");
            }
        });
        
    });
    
    //Route for getting particular client detail in admin section
    app.post("/user_transaction", isLoggedIn, function(req, res) {
            //console.log(req.body);
        Transaction.find({Clientname : req.body.user_trans}, function(err, AllTransactions){
                    if(err){
                        console.log(err);
                        res.redirect("/");
                    } else {
                                User.find({}, function(err, AllUsers){
                                    if(err){
                                         console.log(err);
                                    } else {
                                res.render("user_trans", {transactions : AllTransactions,users : AllUsers});
                                // console.log(AllTransactions);
                                    }
                                });
                    }
            });
    });
    
    // UPDATE ROUTE
    app.put("/admin/:id", function(req, res) {
        console.log(req.body);
        req.body.san = req.sanitize(req.body._id);
        console.log(req.body.san);
        var new_trans = {Clientname : req.body.client_name, Amount: req.body.amount, TransactionID : req.body.transaction_id, Transaction_Type : req.body.transaction_type};
        Transaction.findByIdAndUpdate(req.params.id, new_trans,{new: true}, function(err, updatedBlog){
            if(err){
                res.redirect("/admin/req.params.id");
            } else {
                res.redirect("/admin");
            }
        });
        
    });
    
    // middleware for checking authentication of users
    function isLoggedIn(req, res, next){
        if(req.isAuthenticated()){
            return next();
        }
        res.redirect("/login");
    }
    
    // listing to server on Cloud9 platform
    app.listen(process.env.PORT, process.env.IP, function(){
        console.log("App has started !!");
    });
