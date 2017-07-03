import { MongoClient, Db, Collection } from 'mongodb'

export class ApplicationDbContext {
    public db: Db;
    constructor() {
    }
    local = 'mongodb://127.0.0.1:27017/bank';
    cluster = "mongodb://devchallenge:fullstack-5@cluster0-shard-00-00-qaqsy.mongodb.net:27017,cluster0-shard-00-01-qaqsy.mongodb.net:27017,cluster0-shard-00-02-qaqsy.mongodb.net:27017/MyDb?ssl=true&replicaSet=Cluster0-shard-0&authSource=admin";
    connect(url: string = this.cluster): Promise<Db> {
        return new Promise<Db>((resolve, reject) => {
            MongoClient.connect(url, (err, db: Db) => {
                if (err) {
                    console.error(err);
                    return;
                }
                console.log(`Connected to ${url}`);
                this.db = db;
                resolve(db);
            });
        })
    }
    getCollection(name: string) {
        if (!this.db.collection(name)) {
            this.db.createCollection(name);
        }
        return this.db.collection(name);
    }
    private static instance: ApplicationDbContext;
    public static getApplicationDbContext(): ApplicationDbContext {
        if(!this.instance) {
            this.instance = new ApplicationDbContext();
        }
        return this.instance;
    }
}