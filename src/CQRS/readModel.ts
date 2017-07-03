import { Handles } from './fakeBus';
import { InventoryItemCreated, InventoryItemRenamed, InventoryItemDeactivated } from './events';
import { Dictionary } from '../lib/dictionary';
export interface IReadModelFacade {
    getInventoryItems(): Array<InventoryItemListDTO>;
    getInventoryItemDetails(id: string): InventoryItemDetailsDTO;
}

export class InventoryItemDetailsDTO {
    id: string;
    name: string;
    currentCount: number;
    version: number;

    constructor(id: string, name: string, currentCount: number, version: number) {
        this.id = id;
        this.name = name;
        this.currentCount = currentCount;
        this.version = version;
    }
}

export class InventoryItemListDTO {
    id: string;
    name: string;

    constructor(id: string, name: string) {
        this.id = id;
        this.name = name;
    }
}

export class InventoryListView implements Handles<InventoryItemCreated>, Handles<InventoryItemRenamed>, Handles<InventoryItemDeactivated> {
    handle(message: InventoryItemCreated | InventoryItemRenamed | InventoryItemDeactivated): void {
        if (message instanceof InventoryItemCreated) {
            BullShitDatabase.details.add(message.id, new InventoryItemDetailsDTO(message.id, message.name, 0,0));
        }
        if (message instanceof InventoryItemRenamed) {
            let d = this.getDetailsItem(message.id);
            d.name = message.newName;
            d.version = message.version;
        }
    }

    private getDetailsItem(id: string): InventoryItemDetailsDTO {
        let d = BullShitDatabase.details[id];
        return d;
    }

}

export class BullShitDatabase {
    static details = new Dictionary([]);
    static list = new Array<InventoryItemListDTO>();
}