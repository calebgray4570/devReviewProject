require('dotenv').config()
const express = require('express'),
      bodyParser = require('body-parser'),
      cors = require('cors'),
      session = require('express-session')
      passport = require('passport'),
      Auth0Strategy = require('passport-auth0'),
      massive = require('massive')


const app = express()
app.use(bodyParser.json())

massive(process.env.DB_CONNECTION).then( db => {
    app.set( 'db', db )
})

app.use(session({
    secret: process.env.SESSION_SECRET,
    saveUninitialized: true,
    resave: false
}))

app.use(express.static(__dirname + '/../build'))


app.use(passport.initialize())
app.use(passport.session())

passport.use( new Auth0Strategy({
    domain: process.env.AUTH_DOMAIN,
    clientID: process.env.AUTH_CLIENT_ID,
    clientSecret: process.env.AUTH_CLIENT_SECRET,
    callbackURL: process.env.AUTH_CALLBACK
}, function( accessToken, refreshToken, extraParams, profile, done){

    const db = app.get('db')
    let userData = profile._json
    let auth_id = userData.user_id.split( '|' )[1] 
    /*
        1: user_name? user.name
        2: email? user.email
        3: img? user.picture
        4: auth-ID user.user_id.split('|')[1]
    */

    db.find_user([ auth_id ]).then( user => {
        if ( user[0] ) {
            done( null, user[0].id) // number on session
        } else {
            db.create_user([ userData.name, userData.email, userData.picture, auth_id ])
            .then( user => { 
                return done(null, user[0].id)
            })
        }
    })

}))

app.get('/auth', passport.authenticate('auth0'))
app.get('/auth/callback', passport.authenticate('auth0', {
    successRedirect: process.env.AUTH_PRIVATE_REDIRECT,
    failureRedirect: process.env.AUTH_LANDING_REDIRECT,
}))

passport.serializeUser(function( ID, done){
    done(null, ID) // usually save user id from DB to seesion
})

passport.deserializeUser( function( ID, done ){
    // req.user === id
    const db = app.get('db')
    db.find_user_by_session([ ID ]).then ( user => {
        done(null, user[0] )
    })
})

app.get('/auth/me', function( req, res, next){
    if( !req.user ) {
        res.status(401).send('LOG IN REQUIRED')
    } else {
        res.status(200).send(req.user)
    }
})

app.get('/auth/logout', function(req, res, next) {
    req.logout()
    res.redirect( process.env.AUTH_PRIVATE_REDIRECT )
})

app.listen(process.env.SERVER_PORT, () => {console.log('listening on port 3005')})

// function checkAdmin( req, res, next ){
//     if( req.user.type === 'admin'){
//         next()
//     } else {
//         req.redirect( /* whatever endpoint has your 401 page */ )
//     }
// }