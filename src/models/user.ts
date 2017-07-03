import { ObjectID } from '@types/mongodb';
import { Card } from './card';

export class User {
    _id : ObjectID;
    cards: Array<Card>;
    name: string;
    role: Role;
}

export enum Role {
    Admin,
    Common
}