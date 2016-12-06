/**
 * @summary Serveur de l'application taxi-partage
 *
 * @author Equipe Whos.
 */

var express = require('express')
var app = express()
var bodyParser = require('body-parser');
var firebase = require("firebase");
var stripe = require('stripe')('sk_test_hYgouciPaos8kI2pVyJ8HLK1');
var request = require('request');

var config = {
    apiKey: "AIzaSyDr7ZKvBjHHjCs-dpq80QkSc5rnLq0JQi4",
    authDomain: "taxi-partage-1212f.firebaseapp.com",
    databaseURL: "https://taxi-partage-1212f.firebaseio.com",
    storageBucket: "taxi-partage-1212f.appspot.com"
};
firebase.initializeApp(config);

app.use(bodyParser.json()); // support json encoded bodies
app.use(bodyParser.urlencoded({
    extended: true
})); // support encoded bodies

app.set('port', (process.env.PORT || 5000))
app.use(express.static(__dirname + '/public'))


//Added for the corse
app.use(function(req, res, next) {
    res.header("Access-Control-Allow-Origin", "*");
    res.header("Access-Control-Allow-Headers", "Origin, X-Requested-With, Content-Type, Accept");
    next();
});

app.post('/new_user/', function(request, response) {
    // Get the credit card details submitted by the form
    var clientId = request.body.clientId;
    var clientEmail = request.body.clientEmail;
    var clientCardNumber = request.body.clientCardNumber;
    var clientExpYear = request.body.clientExpYear;
    var clientExpMonth = request.body.clientExpMonth;

    stripe.customers.create({
        source: {
            object: "card",
            number: clientCardNumber,
            exp_year: clientExpYear,
            exp_month: clientExpMonth
        },
        description: clientEmail
    }).then(function(customer) {
        var charge = stripe.charges.create({
            amount: 500, // Amount in cents
            currency: "cad",
            customer: customer.id,
            description: "Exemple charge"
        }, function(err, charge) {
            if (err && err.type === 'StripeCardError') {
                response.send({
                    status: 500,
                    body: null
                });

            } else { // Pas d'erreur
                var postData = {
                    clientId: clientId,
                    clientStripeId: customer.id,
                    carteCredit: "XXXXXXXXXX" + clientCardNumber.substring(12, 16)
                };
                var updates = {};
                updates['/paiementInfo/' + clientId] = postData;
                firebase.database().ref().update(updates);
                response.send({
                    status: 200,
                    body: {
                        clientId: clientId
                    }
                });
            }
        });

    });
})


app.get('/', function(request, response) {
    response.send('Welcome to Coop Pool Stripe Server :-)!')
})

app.post('/charge/', function(request, response) {
    var customerId = request.body.customerId;
    var amount = request.body.amount;

    stripe.charges.create({
        amount: amount, // Amount in cents
        currency: "cad",
        customer: customerId // Previously stored, then retrieved
    });
    response.send('Customer charged')
})



app.post('/getCourse', function(req, res) {
    var courseId = req.body.courseId;
    var url = 'http://prjPoly:2fgw8oeg2345tgwy@taxicoopouest.ddns.fraxion.com:8081/Webservice_Repartition_Test//Service_TC_REST.svc/v1/course/' + courseId
    request.get(url).on('response', function(response) {
        response.on("data", function(chunk) {
            var responseString = "" + chunk
            res.send({
                statusCode: 200,
                body: responseString
            })
        });
    })
})

app.post('/createCourse', function(req, res) {
    var body = req.body.courseJson;
    var url = 'http://prjPoly:2fgw8oeg2345tgwy@taxicoopouest.ddns.fraxion.com:8081/Webservice_Repartition_Test//Service_TC_REST.svc/v1/course'
    request({
        url: url,
        method: 'POST',
        json: body
    }, function(error, response, body) {
        if (body) {
            res.send({
                statusCode: 200,
                body: body
            })
        }
        if (error) {
            res.send({
                statusCode: error
            })
        } else if (response.body.error) {
            res.send({
                error: error,
                bodyError: response.body.error
            })
        }
    })
})

app.post('/getVehiculeProximite', function(req, res) {
    var latitude = req.body.latitude;
    var longitude = req.body.longitude;
    var radius = req.body.radius;
    var limit = req.body.limit;
    var url = 'http://prjPoly:2fgw8oeg2345tgwy@taxicoopouest.ddns.fraxion.com:8081/Webservice_Repartition_Test/Service_TC_REST.svc/v1/vehicule/proximite/?latitude=' + latitude + '&longitude=' + longitude + '&radius=' + radius + '&limit=' + limit

    request.get(url).on('response', function(response) {
        response.on("data", function(chunk) {
            var responseString = "" + chunk
            res.send({
                statusCode: 200,
                body: JSON.parse(responseString)
            })
        });
    })

})

app.post('/api/users', function(req, res) {
    var user_id = req.body.id;
    var token = req.body.token;
    var geo = req.body.geo;
});

app.listen(app.get('port'), function() {
    console.log("Serveur is running at port:" + app.get('port'))
})
