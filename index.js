const express = require('express');
const app = express();
const bodyParser = require('body-parser');
app.use(bodyParser.json());
app.use((req, res, next) => {
  res.header('Access-Control-Allow-Origin', '*');
  res.header('Access-Control-Allow-Headers', 'Origin, Authorization, X-Requested-With, Content-Type, Accept');
  res.header('Access-Control-Allow-Credentials', true);
  res.header('Access-Control-Allow-Methods', 'GET, POST, PUT, DELETE, OPTIONS');
  next();
});
const AmazonCognitoIdentity = require('amazon-cognito-identity-js');
const CognitoUserPool = AmazonCognitoIdentity.CognitoUserPool;
const AWS = require('aws-sdk');
const request = require('request');
const jwkToPem = require('jwk-to-pem');
const jwt = require('jsonwebtoken');
global.fetch = require('node-fetch');
// const crypto = require('crypto');
// const ClientId = crypto.createHmac('SHA256', "aofk3j29agjpfho25iqh4l0uo2htluefdiitjmh47d9fr5cmgmi")
//   .update("769995928724" + "56r6tk8uk1l0kk02ltraacs5fd")
//   .digest('base64')
//   console.log(ClientId)
const ClientId = "7o3nn451rckd2k22511963b8bg"
const poolData = {    
UserPoolId : "eu-west-2_uz2FJUWdq",    
ClientId : ClientId
}; 
const pool_region = 'eu-west-2';
const userPool = new AmazonCognitoIdentity.CognitoUserPool(poolData);

app.post('/register', function (req, res) {
    console.log(req.body);
	let email = req.body.email
	let password = req.body.password
	var attributeList = [];
    attributeList.push(new AmazonCognitoIdentity.CognitoUserAttribute({Name:"email",Value:email}));

    userPool.signUp(email, password, attributeList, null, function(err, result){
        if (err) {
           // console.log(err);
            res.send({"status":"FALSE","message":err.message});
            return;
        }
        cognitoUser = result.user;
       
        console.log('user name is ' + cognitoUser.getUsername());
            res.send({"status":"TRUE","message":cognitoUser.getUsername()});
    });
  
});

app.post('/confirm-signup', function (req, res) {
    //console.log(req.body);
    let username = req.body.email
    let ConfirmationCode = req.body.ConfirmationCode
        var userData = {
            Username: username,
            Pool: userPool 
        };
        var cognitoUser = new AmazonCognitoIdentity.CognitoUser(userData);
        cognitoUser.confirmRegistration(ConfirmationCode,true, (err, result) => {
            if (err) {
            res.send({"status":"FALSE","err":err.message});
            } else {
            res.send({"status":"TRUE","message":result});
            }
        });
  
});

app.post('/resend-confirmation-mail', function (req, res) {
    console.log(req.body);
    let username = req.body.email
        var userData = {
            Username: username,
            Pool: userPool
        };
        var cognitoUser = new AmazonCognitoIdentity.CognitoUser(userData);
        cognitoUser.resendConfirmationCode( (err, result) => {
            if (err) {
            res.send({"status":"FALSE","err":err.message});
            } else {
            res.send({"status":"TRUE","message":result});
            }
        });
  
});
app.post('/login', function (req, res) {
	//console.log(req.body)
	let email = req.body.email
	let password = req.body.password
	var authenticationDetails = new AmazonCognitoIdentity.AuthenticationDetails({
        Username : email,
        Password : password,
    });
 //   console.log(authenticationDetails)
    var userData = {
        Username : email,
        Pool : userPool
    };
    var cognitoUser = new AmazonCognitoIdentity.CognitoUser(userData);
    cognitoUser.authenticateUser(authenticationDetails, {
        onSuccess: function (result) {
            // console.log('access token + ' + result.getAccessToken().getJwtToken());
            // console.log('id token + ' + result.getIdToken().getJwtToken());
            // console.log('refresh token + ' + result.getRefreshToken().getToken());
            res.send({
            	"status":"TRUE",
            	"token":result.getAccessToken().getJwtToken(),
            	"idToken":result.getIdToken().getJwtToken(),
                "refreshToken":result.getRefreshToken().getToken(),
            });
        },
        onFailure: function(err) {
            //console.log(err);
            res.send({"status":"FALSE","err":err.message});
        },

    });
  
});
app.post('/get-details', function (req, res) {
    let username = req.body.email
    let password = req.body.password
    var authenticationDetails = new AmazonCognitoIdentity.AuthenticationDetails({
            Username: username,
            Password: password,
        });
        var userData = {
            Username: username,
            Pool: userPool
        };
        var cognitoUser = new AmazonCognitoIdentity.CognitoUser(userData);
        cognitoUser.authenticateUser(authenticationDetails, {
            onSuccess: function (result) {
        
        cognitoUser.getUserAttributes( (err, result) => {
            if (err) {
            res.send({"status":"FALSE","err":err.message});
            } else {
            res.send({"status":"TRUE","message":result});
            }
        });
             },
            onFailure: function (err) {
                res.send({"status":"FALSE","err":err.message});
                //console.log(err);
            },
        });

  
});
app.post('/change-email', function (req, res) {

    // let birthdate = req.body.birthdate
    // let gender = req.body.gender
    let username = req.body.email
    let newEmail = req.body.newEmail
    let password = req.body.password
    var attributeList = [];
    var authenticationDetails = new AmazonCognitoIdentity.AuthenticationDetails({
            Username: username,
            Password: password,
        });
    attributeList.push(new AmazonCognitoIdentity.CognitoUserAttribute({Name: "email",Value: newEmail}));
        var userData = {
            Username: username,
            Pool: userPool
        };
        var cognitoUser = new AmazonCognitoIdentity.CognitoUser(userData);
        cognitoUser.authenticateUser(authenticationDetails, {
            onSuccess: function (result) {
        
        cognitoUser.updateAttributes(attributeList, (err, result) => {
            if (err) {
            res.send({"status":"FALSE","err":err.message});
            } else {
            res.send({"status":"TRUE","message":result});
            }
        });
             },
            onFailure: function (err) {
                res.send({"status":"FALSE","err":err.message});
                //console.log(err);
            },
        });

  
});

app.post('/change-password', function (req, res) {
	//console.log(req.body)
	let username = req.body.email
	let password = req.body.password
	let newpassword = req.body.newpassword
	var authenticationDetails = new AmazonCognitoIdentity.AuthenticationDetails({
            Username: username,
            Password: password,
        });

        var userData = {
            Username: username,
            Pool: userPool
        };
        var cognitoUser = new AmazonCognitoIdentity.CognitoUser(userData);

        cognitoUser.authenticateUser(authenticationDetails, {
            onSuccess: function (result) {
                cognitoUser.changePassword(password, newpassword, (err, result) => {
                    if (err) {
                      res.send({"status":"FALSE","err":err.message});
                        //console.log(err);
                    } else {
                        // console.log("Successfully changed password of the user.");
                        // console.log(result);
                     res.send({"status":"TRUE","message":result});
                    }
                });
            },
            onFailure: function (err) {
                res.send({"status":"FALSE","err":err.message});
                //console.log(err);
            },
        });
  
});
app.post('/forgot-password', function (req, res) {
    console.log(req.body)
    let username = req.body.email
        var userData = {
            Username: username,
            Pool: userPool
        };
        var cognitoUser = new AmazonCognitoIdentity.CognitoUser(userData);

        cognitoUser.forgotPassword({
            onSuccess: function (result) {
                     res.send({"status":"TRUE","message":result});
            },
            onFailure: function (err) {
                res.send({"status":"FALSE","err":err.message});
                //console.log(err);
            },
        });
  
});
app.post('/confirm-password', function (req, res) {
    console.log(req.body)
    let username = req.body.email
    let password = req.body.password
    let confirmationCode = req.body.confirmationCode
        var userData = {
            Username: username,
            Pool: userPool
        };
        var cognitoUser = new AmazonCognitoIdentity.CognitoUser(userData);

        cognitoUser.confirmPassword(confirmationCode, password,{
            onSuccess: function (result) {
                     res.send({"status":"TRUE","message":result});
            },
            onFailure: function (err) {
                res.send({"status":"FALSE","err":err.message});
                //console.log(err);
            },
        });
  
});
app.post('/confirm-email', function (req, res) {
    console.log(req.body)
    let username = req.body.email
    let password = req.body.password
    let confirmationCode = req.body.confirmationCode
    var attributeList = [];
    attributeList.push(new AmazonCognitoIdentity.CognitoUserAttribute({Name: "email",Value: username}));
   var authenticationDetails = new AmazonCognitoIdentity.AuthenticationDetails({
            Username: username,
            Password: password,
        });

        var userData = {
            Username: username,
            Pool: userPool
        };
        var cognitoUser = new AmazonCognitoIdentity.CognitoUser(userData);
        cognitoUser.authenticateUser(authenticationDetails, {
            onSuccess: function (result) {
                cognitoUser.verifyAttribute("email",confirmationCode,{
                onSuccess: function (result2) {
                        res.send({"status":"TRUE","message":result2});
                },
                onFailure: function (err2) {
                        res.send({"status":"FALSE","err":err2.message});
                //console.log(err);
                },
                });
             },
            onFailure: function (err) {
                res.send({"status":"FALSE","err":err.message});
                //console.log(err);
            },
        });
        
  
});
app.listen(3001, function () {
  console.log('Example app listening on port 3001!');
});