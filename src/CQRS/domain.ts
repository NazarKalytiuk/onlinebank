import { ItemsCheckedInToInventory } from './events';
import { IEventStore } from './eventStore';
import {
    Event,
    InventoryItemCreated,
    InventoryItemDeactivated,
    InventoryItemRenamed,
    ItemsRemovedFromInventory
} from './events';


export class AggregateRoot {
    private _changes = new Array<Event>();

    id: string
    version: number;

    getUncommitedChanges() {
        return this._changes;
    }
    markChangesAsCommited() {
        this._changes = new Array<Event>()
    }
    loadFromHistory(history: Array<Event>) {
        history.forEach(c => {
            this.applyChange(c, false);
        })
    }
    applyChange(event: Event, isNew: boolean = true) {
        // this.AsDynamic().Apply(@event); 
        // event();
        if (isNew) this._changes.push(event);
    }
}

export class InventoryItem extends AggregateRoot {
    private _activated: boolean;
    private _id: string;
    constructor(id: string, name: string) {
        super();
        this.applyChange(new InventoryItemCreated(id, name));
    }

    private apply(e: InventoryItemCreated | InventoryItemDeactivated): void {
        this._id = e.id;

        if (e instanceof InventoryItemDeactivated) {
            this._activated = false;
        }
    }
    changeName(newName: string) {
        this.applyChange(new InventoryItemRenamed(this._id, newName));
    }
    remove(count: number) {
        this.applyChange(new ItemsRemovedFromInventory(this._id, count));
    }
    checkIn(count: number) {
        this.applyChange(new ItemsCheckedInToInventory(this._id, count));
    }
    deactivate() {
        this.applyChange(new InventoryItemDeactivated(this._id));
    }
}

export class IRepository<T extends AggregateRoot> {
    private readonly _storage: IEventStore;

    constructor(storage : IEventStore) {
        this._storage = storage;
    }

    save(aggregate : AggregateRoot, expectedVersion: number) {
        this._storage.saveEvents(aggregate.id, aggregate.getUncommitedChanges(), expectedVersion);
    }
    getById(id: string) {
        let obj = new AggregateRoot();
        let e = this._storage.getEventsForAggregate(id);
        obj.loadFromHistory(e);
        return obj;
    }
}