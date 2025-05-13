import AsyncStorage from '@react-native-async-storage/async-storage';

export interface Codigo {
    data: string;
    type: string;
    timestamp: number;
}

export async function connectDB() {
    return new Database();
}

class Database {
    private key = 'codigos';

    async insertarCodigo(data: string, type: string) {
        const nuevo: Codigo = {
            data,
            type,
            timestamp: Date.now(),
        };

        const existentes = await this.consultarCodigos();
        existentes.unshift(nuevo); // Agrega al inicio
        await AsyncStorage.setItem(this.key, JSON.stringify(existentes));
    }

    async consultarCodigos(): Promise<Codigo[]> {
        const json = await AsyncStorage.getItem(this.key);
        return json ? JSON.parse(json) : [];
    }

    async eliminarTodos() {
        await AsyncStorage.removeItem(this.key);
    }
}
