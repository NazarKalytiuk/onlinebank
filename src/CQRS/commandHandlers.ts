import { IRepository, InventoryItem } from './domain';
import {
    RenameInventoryItem,
    CheckInItemsToInventory,
    CreateInventoryItem,
    DeactivateInventoryItem,
    RemoveItemsFromInventory
} from './command';
export class InventoryCommandHandlers {
    private readonly _repository: IRepository<InventoryItem>;

    constructor(repository: IRepository<InventoryItem>) {
        this._repository = repository;
    }

    handle(message: CreateInventoryItem | DeactivateInventoryItem | RemoveItemsFromInventory | CheckInItemsToInventory | RenameInventoryItem): void {

        if (message instanceof CreateInventoryItem) {
            let item = new InventoryItem(message.inventoryItemId, message.name);
            this._repository.save(item, -1);
        }
        if (message instanceof DeactivateInventoryItem) {
            let item = this._repository.getById(message.inventoryItemId);
            item.deactivate();
            this._repository.save(item, message.originalVersion);
        }
        if (message instanceof RemoveItemsFromInventory) {
            let item = this._repository.getById(message.inventoryItemId);
            item.remove(message.count);
            this._repository.save(item, message.originalVersion);
        }
        if (message instanceof CheckInItemsToInventory) {
            let item = this._repository.getById(message.inventoryItemId);
            item.checkIn(message.count)
            this._repository.save(item, message.originalVersion);
        }
        if (message instanceof RenameInventoryItem) {
            let item = this._repository.getById(message.inventoryItemId);
            item.changeName(message.newName);
            this._repository.save(item, message.originalVersion);
        }
    }
}