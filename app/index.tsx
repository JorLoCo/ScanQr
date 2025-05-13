import { useState, useEffect } from 'react';
import { Text, View, StyleSheet, Button, Alert, FlatList, TouchableOpacity } from 'react-native';

import * as Location from 'expo-location';
import * as Clipboard from 'expo-clipboard';
import { CameraView, CameraType, useCameraPermissions, BarcodeScanningResult } from 'expo-camera';

import { connectDB, Codigo } from '../src/database';

interface ScannedCode extends Codigo {
    location: Location.LocationObject | null;
}

export default function ScannerScreen() {
    const [location, setLocation] = useState<Location.LocationObject | null>(null);
    const [errorMsg, setErrorMsg] = useState<string | null>(null);
    const [facing, setFacing] = useState<CameraType>('back');
    const [permission, requestPermission] = useCameraPermissions();
    const [scannedCodes, setScannedCodes] = useState<ScannedCode[]>([]);

    const onBarcodeScanned = async (result: BarcodeScanningResult) => {
        const db = await connectDB();
        await db.insertarCodigo(result.data, result.type);

        const codigos = await db.consultarCodigos();
        const formateados: ScannedCode[] = codigos.map(c => ({
            ...c,
            location: location
        }));
        setScannedCodes(formateados);

        if (window) {
            window.alert(result.data);
        } else {
            Alert.alert(result.data);
        }
    };

    useEffect(() => {
        async function getCurrentLocation() {
            const { status } = await Location.requestForegroundPermissionsAsync();
            if (status !== 'granted') {
                setErrorMsg('Permiso a la ubicación denegado');
                return;
            }

            const currentLocation = await Location.getCurrentPositionAsync();
            setLocation(currentLocation);
        }

        async function cargarCodigosGuardados() {
            const db = await connectDB();
            const codigos = await db.consultarCodigos();
            const formateados: ScannedCode[] = codigos.map(c => ({
                ...c,
                location: null
            }));
            setScannedCodes(formateados);
        }

        getCurrentLocation();
        cargarCodigosGuardados();
    }, []);

    const borrarTodo = async () => {
        const db = await connectDB();
        await db.eliminarTodos();
        setScannedCodes([]);
        Alert.alert("Todos los códigos han sido eliminados");
    };

    if (!permission) return <View />;
    if (!permission.granted) {
        return (
            <View>
                <Text>Sin acceso a la cámara</Text>
                <Button title="Solicitar permiso" onPress={requestPermission} />
            </View>
        );
    }

    let text = 'Cargando...';
    if (errorMsg) text = errorMsg;
    else if (location) text = JSON.stringify(location);

    const ScannedItem = ({ item }: { item: ScannedCode }) => (
        <View style={styles.item}>
            <Text>{item.data}</Text>
            <TouchableOpacity onPress={() => Clipboard.setStringAsync(item.data)}>
                <Text style={styles.copyText}>Copiar</Text>
            </TouchableOpacity>
            <Text>{new Date(item.timestamp).toLocaleString()}</Text>
            {item.location && (
                <Text>Lat: {item.location.coords.latitude}, Long: {item.location.coords.longitude}</Text>
            )}
        </View>
    );

    return (
        <View style={styles.container}>
            <Text style={styles.gpsText}>GPS: {text}</Text>
            <CameraView
                style={styles.cameraView}
                facing={facing}
                barcodeScannerSettings={{
                    barcodeTypes: ['qr', 'code128', 'datamatrix', 'aztec', 'ean13'],
                }}
                onBarcodeScanned={onBarcodeScanned}
            />
            <Button title="Borrar todos los códigos" onPress={borrarTodo} />
            <FlatList
                data={scannedCodes}
                keyExtractor={(item) => item.timestamp.toString()}
                renderItem={ScannedItem}
            />
        </View>
    );
}

const styles = StyleSheet.create({
    container: {
        flex: 1,
        paddingTop: 20,
    },
    gpsText: {
        margin: 10,
        fontWeight: 'bold',
    },
    cameraView: {
        width: '100%',
        minHeight: '80%',
    },
    item: {
        padding: 10,
        borderBottomWidth: 1,
        borderColor: '#ccc',
    },
    copyText: {
        color: 'blue',
        marginTop: 5,
    },
});
