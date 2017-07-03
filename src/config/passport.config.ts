import * as express from 'express';
import * as jwt from 'jsonwebtoken';
const io = require('socket.io')();
const jwtAuth = require('socketio-jwt-auth');
const passport = require('passport');
const LocalStrategy = require('passport-local').Strategy;
const expressJwt = require('express-jwt');
const authenticate = expressJwt({ secret: 'serversecret' });

import { ApplicationDbContext } from '../domain/applicationDbContext';
import { User } from '../models/user';
import { Role } from '../models/user';
import { Request } from 'express';
import { ObjectID } from 'mongodb';


let serialize = async (req: Request, res, next) => {
    let db = ApplicationDbContext.getApplicationDbContext().db;
    let user = await db.collection('Users').findOne(req.user);
    if (!user) {
        user.username = req.params.username;
        user.password = req.params.password;
    }
    req.user = { // = user;
        _id: user._id,
        username: user.username,
        role: user.role
    };
    next();
};
let generateToken = (req, res, next) => {
    req.token = jwt.sign({
        id: req.user._id
    }, 'serversecret');
    next();
}
let respond = (req, res: express.Response) => {
    res.status(200).json({
        user: req.user,
        token: req.token
    });
};

passport.use(new LocalStrategy(
    async (username, password, done) => {
        try {
            let db = ApplicationDbContext.getApplicationDbContext().db;
            console.log(await db.collection('Users').find().toArray())
            let user = await db.collection('Users').findOne({ username });
            if (!user) {
                user = new User();
                user.username = username;
                user.password = password;
                let count = await db.collection('Users').count({});
                if (count === 0) {
                    user.role = Role.Admin
                } else {
                    user.role = Role.Common;
                }
                await db.collection('Users').insert(user);
                return done(null, user);
            }
            return done(null, user);
        } catch (error) {
            return done(error);
        }
    }
));

export { respond, serialize, generateToken }