import * as socket from 'socket.io';
import { Db, ObjectID } from 'mongodb';
import { ApplicationDbContext } from '../domain/applicationDbContext';
import { User, Role } from '../models/user';
import { Card, Transaction } from '../models/card';

export class CardHub {
    socket: SocketIO.Socket;
    io: SocketIO.Server;
    db: Db;
    constructor(socket: SocketIO.Socket, io) {
        this.socket = socket;
        this.io = io;
        this.db = ApplicationDbContext.getApplicationDbContext().db;
        socket.on('addCard', this.addCard);
        socket.on('getCards', this.getCards);
        socket.on('getCard', this.getCard);
        socket.on('makeTransaction', this.makeTransaction);
        socket.on('makeRefund', this.makeRefund);

    }
    addCard = async (card: Card) => {
        try {
            let users: Array<User> = await this.db.collection('Users').find().toArray();
            let cards = new Array<Card>();
            users.forEach(c => {
                if (c.cards) {
                    cards = cards.concat(c.cards)
                }
            });
            if (cards.filter(c => c.code == card.code).length > 0) {
                this.socket.emit('info', 'Така карта існує!');
                return;
            }


            let user: User = await this.db.collection('Users').findOne({ _id: new ObjectID(this.socket.request.user._id) });
            if (!user.cards) {
                user.cards = new Array();
            }
            card._id = new ObjectID();
            if (card.code.toString().length != 16) {
                this.socket.emit('info', 'Код картки має бути 16 символів');
                return 
            }
            user.cards.push(card);
            await this.db.collection('Users').updateOne({ _id: new ObjectID(this.socket.request.user._id) }, user);
            this.socket.emit('getCards', user.cards);
        } catch (error) {
            console.error(error);
        }
    }
    getCards = async () => {
        try {
            let user: User = await this.db.collection('Users').findOne({ _id: new ObjectID(this.socket.request.user._id) });
            this.socket.emit('getCards', user.cards);
        } catch (error) {
            console.error(error);
        }
    }
    getCard = async (id) => {
        try {
            let user: User = await this.db.collection('Users').findOne({ _id: new ObjectID(this.socket.request.user._id) });
            this.socket.emit('getCard', user.cards.filter(c => c._id == id)[0]);

        } catch (error) {
            console.error(error);
        }
    }
    makeTransaction = async (data: Transaction) => {
        try {
            let users: Array<User> = await this.db.collection('Users').find().toArray();
            users = users.filter(c => c.cards.filter(s => s.code == data.to).length > 0);
            let userTo: User = users[0];

            let cardTo = userTo.cards.filter(s => s.code == data.to)[0];
            cardTo.money += data.sum;
            if (!cardTo.transactions) {
                cardTo.transactions = new Array();
            };
            let record = data._id;
            data._id = new ObjectID();
            if (!record) {
                cardTo.transactions.push(data);
            }
            await this.db.collection('Users').update({ _id: userTo._id }, userTo);

            let user: User = await this.db.collection('Users').findOne({ _id: new ObjectID(this.socket.request.user._id) });
            let cardFrom = user.cards.filter(c => c.code == data.from)[0];
            cardFrom.money -= data.sum;
            if (!cardFrom.transactions) {
                cardFrom.transactions = new Array();
            }
            if (!record) {
                cardFrom.transactions.push(data);
            }
            await this.db.collection('Users').update({ _id: user._id }, user);

            this.socket.emit('getCard', cardFrom);
            this.socket.broadcast.emit('cardsChanged'); //треба замінить на пошук всіх сокетів для даного юзера

            let clients = this.io.clients().connected;
            let socketUsers = new Array<SocketIO.Socket>();
            for (let a in clients) {
                socketUsers.push(clients[a]);
            }
            let socketUserTo = socketUsers.filter(c => {
                return c.request.user._id.toString() == userTo._id.toHexString() &&
                    c.id != this.socket.id;
            });
            socketUserTo.forEach(c => {
                c.emit('cardChanged');
                c.emit('cardsChanged');
            })

        } catch (error) {
            console.error(error);
        }
    };

    makeRefund = async (t: Transaction) => {
        try {
            let users: Array<User> = await this.db.collection('Users').find().toArray();
            users = users.filter(c => {
                return c.cards.filter(s => s.code == t.to).length > 0;
            });
            let user;
            if (users[0]._id == this.socket.request.user._id) {
                user = users[0];
            }
            if (user) {
                console.log('user');
                let cards = user.cards.filter(s => s.code.toString() == t.to.toString() || s.code.toString() == t.from.toString());
                cards.filter(s => s.transactions && s.transactions.filter(c => c._id != t._id).length > 0);
                cards.forEach(c => {
                    if (c.transactions) {
                        console.log(c.transactions.length);
                        c.transactions = c.transactions.filter(s => {
                            // console.log(s._id != undefined && t._id != undefined && s._id.toHexString() != t._id.toString())
                            return s._id != undefined && t._id != undefined && s._id.toHexString() != t._id.toString()

                        })
                        console.log(c.transactions.length);
                    }
                });

                await this.db.collection('Users').updateOne({ _id: user._id }, user);

                this.makeTransaction({ _id: t._id, from: t.to, to: t.from, sum: t.sum });

                let users: Array<User> = await this.db.collection('Users').find().toArray();
                users.filter(c => c.cards.filter(s => s.code == t.to));
                let userTo: User = users[0];
                let clients = this.io.clients().connected;
                let socketUsers = new Array<SocketIO.Socket>();
                for (let a in clients) {
                    socketUsers.push(clients[a]);
                }
                let socketUserTo = socketUsers.filter(c => {
                    return c.request.user._id.toString() == userTo._id.toHexString()
                });

                socketUserTo.forEach(c => {
                    c.emit('cardChanged');
                })
            } else { // create to admin
                let transaction = await this.db.collection('Transaction').findOne({ _id: t._id });
                let clients = this.io.clients().connected;
                let socketUsers = new Array<SocketIO.Socket>();
                for (let a in clients) {
                    socketUsers.push(clients[a]);
                };
                let socketUserTo = socketUsers.filter(c => {
                    return c.request.user.role == Role.Admin;
                });
                if (!transaction) {
                    await this.db.collection('Transaction').insertOne(t);
                }
                socketUserTo.forEach(c => {
                    c.emit('transactionsChanged');
                })
                this.socket.emit('info', 'Transaction must be approved by admin');
            }
        } catch (error) {
            console.error(error);
        }
    }



}