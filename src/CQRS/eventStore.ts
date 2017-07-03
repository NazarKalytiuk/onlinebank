import { Dictionary, IDictionary } from '../lib/dictionary'
import { Event } from '../CQRS/events'
import { IEventPublisher } from './fakeBus';

export interface IEventStore {
    saveEvents(aggregateId: string, events: Array<Event>, expectedVersion: number): void;
    getEventsForAggregate(aggregateId: string): Array<Event>;
}

export class EventDescriptor {
    public readonly eventData: Event;
    public readonly id: string;
    public readonly version: number;

    constructor(id: string, eventData: Event, version: number) {
        this.eventData = eventData;
        this.id = id;
        this.version = version;
    }
}

export class EventStore implements IEventStore {
    private readonly _publisher: IEventPublisher;
    private readonly _current = new Dictionary([]);

    constructor(publisher: IEventPublisher) {
        this._publisher = publisher;
    }

    saveEvents(aggregateId: string, events: Array<Event>, expectedVersion: number): void {
        let eventsDescriptors: Array<EventDescriptor> = new Array<EventDescriptor>();

        if(!this._current[aggregateId]) {
            eventsDescriptors = new Array<EventDescriptor>();
            this._current.add(aggregateId, events);
        } else if (eventsDescriptors[eventsDescriptors.length -1].version != expectedVersion && expectedVersion != 1) {
            throw new Error('Concurrency error');
        } else {
            eventsDescriptors = this._current[aggregateId];
        }

        let i = expectedVersion;

        for (var key of events) {
            i++;
            key.version = i;
            eventsDescriptors.push(new EventDescriptor(aggregateId, key, i));
            this._publisher.publish(key)
        }
    }

    getEventsForAggregate(aggregateId: string): Array<Event> {
        let eventsDescriptors: Array<EventDescriptor> = new Array<EventDescriptor>();

        if(!this._current[aggregateId]) {
            throw new Error('Aggregate not found');
        }
        else {
            eventsDescriptors = this._current[aggregateId];
        }

        return eventsDescriptors.map(desc => desc.eventData);
    }


}