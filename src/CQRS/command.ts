import { Message } from './events';
import { IRepository } from './domain';
export class Command implements Message {
    doAction(){};
}

export class DeactivateInventoryItem extends Command {
    readonly inventoryItemId: string;
    readonly originalVersion: number;

    constructor(inventoryItemId: string, originalVersion: number) {
        super();
        this.inventoryItemId = inventoryItemId;
        this.originalVersion = originalVersion;
    }
    doAction() {

    }
}

export class CreateInventoryItem extends Command {
    readonly name : string;
    readonly inventoryItemId: string;

    constructor(inventoryItemId: string, name: string) {
        super();
        this.inventoryItemId = inventoryItemId;
        this.name = name;
    }
}

export class RenameInventoryItem extends Command {
    readonly inventoryItemId: string;
    readonly newName: string;
    readonly originalVersion: number;

    constructor(inventoryItemId: string, newName: string, originalVersion: number) {
        super();
        this.inventoryItemId = inventoryItemId;
        this.originalVersion = originalVersion;
        this.newName = newName;
    }
}

export class CheckInItemsToInventory extends Command {
    readonly inventoryItemId: string;
    readonly count: number;
    readonly originalVersion: number;

    constructor(inventoryItemId: string, count: number, originalVersion: number) {
        super();
        this.inventoryItemId = inventoryItemId;
        this.originalVersion = originalVersion;
        this.count = count;
    }
}

export class RemoveItemsFromInventory extends Command {
    readonly inventoryItemId: string;
    readonly count: number;
    readonly originalVersion: number;

    constructor(inventoryItemId: string, count: number, originalVersion: number) {
        super();
        this.inventoryItemId = inventoryItemId;
        this.originalVersion = originalVersion;
        this.count = count;
    }
}