import { ResponseBodyHandler } from '_debugger';
import { EventEmitter } from 'events';
import * as express from 'express';
import * as http from 'http'
import { ApplicationDbContext } from './domain/applicationDbContext';
import { Request } from 'express';
import { User, Role } from './models/user';
import { Server } from './server';
import { ObjectID } from 'mongodb';
import { generateToken, respond, serialize } from './config/passport.config'
import * as socket from 'socket.io';

const jwtAuth = require('socketio-jwt-auth');
const passport = require('passport');
const LocalStrategy = require('passport-local').Strategy;

(async () => {
  let db = await ApplicationDbContext.getApplicationDbContext().connect();

  db.dropDatabase();

  let app = new Server();
  let server = http.createServer(app.app);

  app.app.post('/auth', passport.authenticate('local', { session: false }), serialize, generateToken, respond);

  const expressJwt = require('express-jwt');
  const authenticate = expressJwt({ secret: 'serversecret' });

  app.app.get('/me', authenticate, async function (req, res) {
    try {
      let user = await db.collection('Users').findOne({ _id: new ObjectID(req.user.id) });
      res.status(200).json(user);
    } catch (error) {
      console.error(error);
    }
  });
  app.io.on('connection', function (socket) {
    console.log('Authentication passed!');
    socket.client.request.user = socket.request.user;
    socket.emit('success', {
      message: 'success logged in!',
      user: socket.request.user
    });
    app.socketRoutes(socket);
  });


  app.io.listen(9000);
  server.listen(3000, function () {
    console.log('listening on *:3000');
  });
})();

