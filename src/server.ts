import * as express from 'express';
import * as bodyParser from "body-parser";
import * as path from "path";
import * as passport from 'passport';
import { Request } from 'express';
import { CardHub } from './hubs/card.hub';
import * as io from 'socket.io';
import { ApplicationDbContext } from './domain/applicationDbContext';
import { ObjectID } from 'mongodb';
import { AdminHub } from './hubs/admin.hub';


export class Server {
    public app: express.Application;
    public io: SocketIO.Server;
    private socket: SocketIO.Socket;
    constructor() {
        this.app = express()
        this.io = io();
        this.config();
        this.routes();
    }
    config() {
        this.app.use(function (req, res, next) {
            res.header("Access-Control-Allow-Origin", "*");
            res.header("Authorization", "*");
            res.header("Access-Control-Allow-Headers", "Origin, X-Requested-With, Content-Type, Accept, Authorization");
            next();
        });
        this.app.use(express.static(path.join(__dirname, "public")));
        this.app.use(bodyParser.json())
        this.app.use(bodyParser.urlencoded({ extended: true }));
        this.app.use(passport.initialize());

        const jwtAuth = require('socketio-jwt-auth');
        this.io.use(jwtAuth.authenticate({
            secret: 'serversecret',    // required, used to verify the token's signature 
            algorithm: 'HS256'        // optional, default to be HS256 
        }, async function (payload, done) {
            try {
                let db = ApplicationDbContext.getApplicationDbContext().db;
                let user = await db.collection('Users').findOne({ _id: new ObjectID(payload.id) });
                if (!user) {
                    // return fail with an error message 
                    return done(null, false, 'user not exist');
                }
                // return success with a user info 
                return done(null, user);
            } catch (error) {
                return done(error);
            }
        }));
    }
    routes() {
        // console.log('routes');
        // new CardController(this.socket);
    }
    socketRoutes(socket) {
        this.socket = socket;
        new CardHub(this.socket, this.io);
        new AdminHub(this.socket, this.io);
    }
}