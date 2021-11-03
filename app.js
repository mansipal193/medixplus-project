var express = require("express"),
    mongoose = require("mongoose"),
    passport = require("passport"),
    bodyParser = require("body-parser"),
    LocalStrategy = require("passport-local"),
    passportLocalMongoose =
    require("passport-local-mongoose");
var app = express();
const path = require('path')

const session = require('express-session');
const flash = require('connect-flash');
var Schema = mongoose.Schema;
var methodOverride = require('method-override')
app.use(express.static(path.join(__dirname, 'public')))
app.use(methodOverride('_method'));
app.set('view engine', 'ejs');
app.use(bodyParser.urlencoded({
    extended: true
}));
app.set('view engine', 'ejs');
app.set('views', path.join(__dirname, 'views'))
app.use(require("express-session")({
    secret: "Rusty is a dog",
    resave: false,
    saveUninitialized: false
}));

app.use(passport.initialize());
app.use(passport.session());
app.use(flash());


var mongoDB = 'mongodb://127.0.0.1/path-system';
mongoose.connect(mongoDB, {
    useNewUrlParser: true,
    useUnifiedTopology: true
});

var db = mongoose.connection;


db.on('error', console.error.bind(console, 'MongoDB connection error:'));
var appointmentSchema = new Schema({
    phonenumber: String,
    name: String,
    age: Number,
    content: String,
    a_date: String,
    time: String,
    user_id: String,
    bookingStatus: String
});
var reviewSchema = new Schema({
    review: String,
    name: String
})
var Review = mongoose.model("Review", reviewSchema);
var Appointment = mongoose.model("Appointment", appointmentSchema);
var userschema = new Schema({
    username: String,
    password: String,
    appointment: [appointmentSchema]
});

userschema.plugin(passportLocalMongoose);

var User = mongoose.model('User', userschema);
passport.use(new LocalStrategy(User.authenticate()));
passport.serializeUser(User.serializeUser());
passport.deserializeUser(User.deserializeUser());


app.get('/', (req, res) => {
    Review.find({}, function(err, data) {
        if (err) {
            console.log(err);
            res.render('login');
        } else {
            console.log(data);
            res.render('homepage', {
                data: data
            });
        }
    });
});
app.get('/adminHome', isLoggedIn, function(req, res) {
    User.find({}, function(err, data) {
        if (err) {
            console.log(err);
            res.redirect('/');
        } else {
            console.log(data);
            res.render('adminHome', {
                data: data,
                message: req.flash('success')
            });
        }
    })
});
app.get('/userHome', isLoggedIn, function(req, res) {
    var uderID = req.user.id;
    User.findById(req.user.id, function(err, foundUser) {
        if (err) {
            console.log(err);
            res.render('homepage');
        } else if (foundUser.username.trim() == "admin") {
            res.redirect('/adminHome');

        } else {

            res.render('userHome', {
                userName: foundUser.username,
                appointment: foundUser.appointment
            });

        }
    });

})
app.post('/appointmentUp/:id/:id2', function(req, res) {
    console.log("working fine");
    const userID = req.params.id2;
    const recievedId = req.params.id;
    console.log(req.body.bookingstatus);
    const valuOfBook = req.body.bookingstatus;
    User.findById(userID, function(err, foundUser) {
        if (err) {
            console.log(err);
            res.render('homepage');
        } else {


            if (foundUser.appointment.length == 1) {
                console.log("inside length1");
                foundUser.appointment[0].bookingStatus = valuOfBook;
                foundUser.save(function(err, sss) {
                    if (err) {
                        console.log(err);
                        res.redirect("/");
                    } else {
                        req.flash('success', 'SUCCESSFULLY SAVED THE CHANGES');
                        res.redirect('/adminHome')
                    }
                });
            } else {

                for (let i = 0; i < foundUser.appointment.length; i++) {
                    console.log(foundUser.appointment[i].id);
                    console.log(recievedId);
                    console.log("************");
                    if (foundUser.appointment[i].id.trim() === recievedId.trim() && i != foundUser.appointment.length - 1) {

                        foundUser.appointment[i].bookingStatus = valuOfBook;
                    }
                    if (i == foundUser.appointment.length - 1) {
                        if (foundUser.appointment[i].id.trim() === recievedId.trim()) {
                            console.log("change intitated");

                            foundUser.appointment[i].bookingStatus = valuOfBook;
                            console.log("change done")
                        }
                        foundUser.save(function(err, sss) {
                            if (err) {
                                console.log(err);
                                res.redirect("/");
                            } else {
                                req.flash('success', 'SUCCESSFULLY SAVED THE CHANGES');
                                console.log("inside save");
                                res.redirect('/adminHome')
                            }
                        });
                    }
                }
            }
        }
    });

})
app.delete('/appointment/:id/:id2', function(req, res) {

    const userID = req.params.id2;
    const recievedId = req.params.id;
    // console.log(req.body.bookingstatus);

    User.findById(userID, function(err, foundUser) {
        if (err) {
            console.log(err);
            res.render('homepage');
        } else {


            if (foundUser.appointment.length == 1) {
                console.log("inside length1");
                foundUser.appointment = [];
                foundUser.save(function(err, sss) {
                    if (err) {
                        console.log(err);
                        res.redirect("/");
                    } else {

                        res.redirect('/adminHome')
                    }
                });
            } else {

                for (let i = 0; i < foundUser.appointment.length; i++) {
                    console.log(foundUser.appointment[i].id);
                    console.log(recievedId);
                    console.log("************");
                    if (foundUser.appointment[i].id.trim() === recievedId.trim() && i != foundUser.appointment.length - 1) {
                        console.log("delete done");
                        foundUser.appointment.splice(i, 1);
                    }
                    if (i == foundUser.appointment.length - 1) {
                        if (foundUser.appointment[i].id.trim() === recievedId.trim()) {
                            console.log("pop intitated");

                            foundUser.appointment.pop();
                            console.log("popdone")
                        }
                        foundUser.save(function(err, sss) {
                            if (err) {
                                console.log(err);
                                res.redirect("/");
                            } else {

                                console.log("inside save");
                                res.redirect('/adminHome')
                            }
                        });
                    }
                }
            }
        }
    });
})
app.delete('/appointment/:id', function(req, res) {
    // console.log("id of delete-->");
    // console.log(req.params.id);
    const recievedId = req.params.id;
    User.findById(req.user.id, function(err, foundUser) {
        if (err) {
            console.log(err);
            res.render('homepage');
        } else {


            if (foundUser.appointment.length == 1) {
                console.log("inside length1");
                foundUser.appointment = [];
                foundUser.save(function(err, sss) {
                    if (err) {
                        console.log(err);
                        res.redirect("/");
                    } else {
                        console.log(sss);
                        res.redirect('/userHome')
                    }
                });
            } else {
                for (let i = 0; i < foundUser.appointment.length; i++) {
                    console.log(foundUser.appointment[i].id);
                    console.log(recievedId);
                    console.log("************");
                    if (foundUser.appointment[i].id.trim() === recievedId.trim() && i != foundUser.appointment.length - 1) {
                        console.log("delete done");
                        foundUser.appointment.splice(i, 1);
                    }
                    if (i == foundUser.appointment.length - 1) {
                        if (foundUser.appointment[i].id.trim() === recievedId.trim()) {
                            console.log("pop intitated");

                            foundUser.appointment.pop();
                            console.log("popdone")
                        }
                        foundUser.save(function(err, sss) {
                            if (err) {
                                console.log(err);
                                res.redirect("/");
                            } else {

                                console.log("inside save");
                                res.redirect('/userHome')
                            }
                        });
                    }
                }
            }
        }
    });

});
app.get('/login', (req, res) => {

    res.render('login', {
        message: req.flash('err')
    });
})
app.get('/loginflash', function(req, res) {
    req.flash('err', 'Inavlid username or password');
    res.redirect('/login');
})
app.post("/login", passport.authenticate("local", {
    successRedirect: "/userHome",
    failureRedirect: "/loginflash"
}), function(req, res) {

});
app.get('/register', (req, res) => {

    res.render('register', {
        message: req.flash('err')
    });
})
app.post("/register", function(req, res) {
    console.log(req.body.username);
    console.log(req.body.password);
    User.register(new User({
        username: req.body.username
    }), req.body.password, function(err, user) {
        if (err) {
            console.log(typeof(err));
            req.flash('err', "A user with given username already exists");
            console.log(err);
            res.redirect('/register');
        }
        passport.authenticate("local")(req, res, function() {
            console.log(req.user.id);
            res.redirect("/userHome");
        });
    });
});
app.get('/preg', function(req, res) {
    res.render('preg');
});
app.get('/diab', function(req, res) {
    res.render('diab');
});
app.get('/aller', function(req, res) {
    res.render('allergy');
});
app.get('/swasth', function(req, res) {
    res.render('swasth')
});
app.get("/logout", function(req, res) {
    req.logout();
    res.redirect("/");
});
app.post('/review', function(req, res) {
    console.log("review route working");
    console.log(req.body.review);
    console.log(req.body.name);
    var reviewInstance = new Review({
        review: req.body.review,
        name: req.body.name
    })
    reviewInstance.save(function(err, rrr) {
        if (err) {
            console.log(err);
            res.redirect('/');
        } else {
            console.log(rrr);
            res.redirect('/');
        }
    });

});
app.post('/appointment/new', function(req, res) {

    User.findById(req.user.id, function(err, foundUser) {
        if (err) {
            console.log(err);
        } else {
            console.log("date fprmat is-->")
            console.log(req.body.date);


            console.log(foundUser);
            var ctc = new Appointment({
                phonenumber: req.body.phnumber,
                name: req.body.name,
                age: req.body.age,
                content: req.body.content,
                a_date: req.body.date,
                time: req.body.time,
                user_id: req.user.id,
                bookingStatus: "Booked"
            });
            ctc.save(function(err, ss) {
                if (err) {
                    console.log(err);
                } else {
                    foundUser.appointment.push(ss);
                    foundUser.save(function(err, sss) {
                        if (err) {
                            console.log(err);
                            res.redirect("/");
                        } else {
                            res.redirect('/userHome');
                        }
                    });


                }
            });

        }
    });
    console.log("hi");

});

app.get('/test', function(req, res) {
    res.render('cbc');
});
app.get('/heart', function(req, res) {
    res.render('heart');
});
app.get('/thyroid', function(req, res) {
    res.render('thyroid');
});
app.get('/vitamin', function(req, res) {
    res.render('vitamin');
});
app.get('/cbc', function(req, res) {
    res.render('cbc');
});
app.get('/lungs', function(req, res) {
    res.render('lungs');
});

function isLoggedIn(req, res, next) {
    if (req.isAuthenticated()) {
        return next();
    }
    res.redirect("/login");
}



app.listen(3000, () => {
    console.log("server started......");
});