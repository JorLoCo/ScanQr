import * as SQLite from 'expo-sqlite';

export async function connectDB()
{
    return new Database(
        await SQLite.openDatabaseAsync('ScanQR')
    );
}

class Database
{
    constructor(private db: SQLite.SQLiteDatabase)
    {
        this.init();
    }
    private async init()
    {
        await this.dropDB();
        await this.db.execAsync(
            `CREATE TABLE IF NOT EXISTS codigos (
                id TEXT PRIMARY KEY NOT NULL DEFAULT (lower(hex(randomblob(16)))),
                data TEXT NOT NULL DEFAULT '',
                type TEXT NOT NULL DEFAULT 'qr'
            )`
        );
    }
    async dropDB()
    {
        await this.db.execAsync('DROP TABLE IF EXISTS codigos');
    }

    async  insertarCodigo(data:string, type:string)
    {
        const result = await this.db.runAsync(
            'INSERT INTO codigos (data, type) VALUES (?, ?)', data, type
        );
        return result;
    }

    async consultarCodigos()
    {
        const result = await this.db.getAllAsync<{id:string, data:string, type:string}>(
            'SELECT * FROM codigos'
        );
        return result;
    }
}



