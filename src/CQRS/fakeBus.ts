import { Event, Message } from './events';
import { Dictionary } from '../lib/dictionary';
import { Command } from './command';

export class FakeBus implements ICommandSender, IEventPublisher {
    private readonly _routes: Dictionary = new Dictionary([]);

    registerHandler<T extends Message>(handler): void { //handler maybe Function
        let handlers: Array<any> = new Array();

        handlers = this._routes[typeof T];

        handlers.push(handler)
    }

    send<T extends Command>(command: T): void {
        let handlers = new Array();

        handlers = this._routes[typeof T];

        handlers[0](command);
    }

    publish<T extends Event>(event: T): void {
        let handlers = new Array();

        handlers = this._routes[typeof T];

        for (var key of handlers) {
            key(event);
        }
    }
}

export interface Handles<T> {
    handle(message: T): void;
}

export interface ICommandSender {
    send<T extends Command>(command: T): void;
}
export interface IEventPublisher {
    publish<T extends Event>(event : T): void;
}