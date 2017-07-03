import { ObjectID } from 'mongodb';

export class Card {
    _id : ObjectID;
    code : string;
    type: PaymentSystem;
    money: number;
    transactions: Array<Transaction> = new Array();
    // currency only in $
}

export enum PaymentSystem {
    Visa,
    MasterCard
}

export class Transaction {
    _id : ObjectID;
    from: string;
    to: string;
    sum: number;
}