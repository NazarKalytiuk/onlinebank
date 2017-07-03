export interface Message {

}

export class Event implements Message {
    public version : number;
}

export class InventoryItemDeactivated extends Event {
    public readonly id : string;
    constructor(id: string) {
        super();
        this.id = id;
    }
}

export class InventoryItemCreated extends Event {
    public readonly id : string;
    public readonly name : string;

    constructor(id: string, name: string) {
        super();
        this.id = id;
        this.name = name;
    }
}
export class InventoryItemRenamed extends Event {
    public readonly id : string;
    public readonly newName : string;

    constructor(id: string, newName: string) {
        super();
        this.id = id;
        this.newName = newName;
    }
}

export class ItemsCheckedInToInventory extends Event {
    public readonly id : string;
    public readonly count : number;

    constructor(id: string, count: number) {
        super();
        this.id = id;
        this.count = count;
    }
}

export class ItemsRemovedFromInventory extends Event {
    public readonly id : string;
    public readonly count : number;

    constructor(id: string, count: number) {
        super();
        this.id = id;
        this.count = count;
    }
}