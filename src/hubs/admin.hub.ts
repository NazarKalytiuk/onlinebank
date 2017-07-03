import { Db, ObjectID } from 'mongodb';
import { ApplicationDbContext } from '../domain/applicationDbContext';
import { Transaction } from '../models/card';
import { User } from '../models/user';


export class AdminHub {
    socket: SocketIO.Socket;
    io: SocketIO.Server;
    db: Db;
    constructor(socket: SocketIO.Socket, io) {
        this.socket = socket;
        this.io = io;
        this.db = ApplicationDbContext.getApplicationDbContext().db;
        socket.on('getTransactions', this.getTransactions);
        socket.on('approveTransaction', this.approveTransaction);
    }

    getTransactions = async () => {
        try {
            if (this.socket.request.user.role != 0) {
                return new Error('Permssion denied');
            }
            let transactions: Array<Transaction> = await this.db.collection('Transaction').find().toArray();
            this.socket.emit('getTransactions', transactions);
        } catch (error) {
            console.error(error);
        }
    }

    approveTransaction = async (t: Transaction) => {
        try {
            this.makeTransaction({ _id: t._id, to: t.from, from: t.to, sum: t.sum });
        } catch (error) {
            console.error(error);
        }
    }
    declineTransaction = async (t: Transaction) => {
        try {
            await this.db.collection('Transaction').deleteOne({_id: new ObjectID(t._id)});
            
        } catch (error) {
            console.error(error);
        }
    }
    makeTransaction = async (data: Transaction) => {
        try {
            let users: Array<User> = await this.db.collection('Users').find().toArray();
            let userTo: User = users.filter(c => c.cards.filter(s => s.code == data.to).length > 0)[0];
            let userFrom: User = users.filter(c => c.cards.filter(s => s.code == data.from).length > 0)[0];

            let cardTo = userTo.cards.filter(s => s.code == data.to)[0];
            let cardFrom = userFrom.cards.filter(c => c.code == data.from)[0];

            cardTo.money += data.sum;
            await this.db.collection('Users').update({ _id: userTo._id }, userTo);

            cardFrom.money -= data.sum;
            await this.db.collection('Users').update({ _id: userFrom._id }, userFrom);

            let clients = this.io.clients().connected;
            let socketUsers = new Array<SocketIO.Socket>();
            for (let a in clients) {
                socketUsers.push(clients[a]);
            }
            let socketUserTo = socketUsers.filter(c => {
                return c.request.user._id.toString() == userTo._id.toHexString() &&
                    c.id != this.socket.id;
            });
            
            let socketUserFrom = socketUsers.filter(c => {
                return c.request.user._id.toString() == userFrom._id.toHexString() &&
                    c.id != this.socket.id;
            });
            cardFrom.transactions = cardFrom.transactions.filter(c => c._id != data._id);
            await this.db.collection('Users').update({ _id: userFrom._id }, userFrom);

            cardTo.transactions = cardTo.transactions.filter(c => c._id != data._id);
            await this.db.collection('Users').update({ _id: userTo._id }, userTo);

            await this.db.collection('Transaction').deleteOne({ _id: data._id });

            socketUserTo.forEach(c => {
                c.emit('cardChanged');
            })
            socketUserFrom.forEach(c => {
                c.emit('cardChanged');
            })

            let transactions: Array<Transaction> = await this.db.collection('Transaction').find().toArray();
            this.socket.emit('getTransactions', transactions);

        } catch (error) {
            console.error(error);
        }
    };


}