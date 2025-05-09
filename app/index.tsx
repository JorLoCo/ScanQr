import { useState, useEffect } from 'react';
import { Text, View, StyleSheet, Button, Alert, FlatList, TouchableOpacity } from 'react-native';

import * as Location from 'expo-location';
import * as Clipboard from 'expo-clipboard';
import { CameraView, CameraType, useCameraPermissions, BarcodeScanningResult } from 'expo-camera';

import { connectDB } from '../src/database';

interface ScannedCode {
    code: BarcodeScanningResult,
    location: Location.LocationObject
}

export default function ScannerScreen() {
    const [location, setLocation] = useState<Location.LocationObject | null>(null);
    const [errorMsg, setErrorMsg] = useState<string | null>(null);
    const [facing, setFacing] = useState<CameraType>('back');
    const [permission, requestPermission] = useCameraPermissions();
    const [scannedCodes, setScannedCodes] = useState<ScannedCode[]>([]);

    const onBarcodeScanned = async function (result: BarcodeScanningResult) {
        if (window) {
            window.alert(result.data);
        } else {
            Alert.alert(result.data);
        }

        setScannedCodes(prev => [{ code: result, location: location! }, ...prev]);

        const db = await connectDB();
        await db.insertarCodigo(result.data, result.type);
        console.log(await db.consultarCodigos());
    };

    useEffect(() => {
        async function getCurrentLocation() {
            let { status } = await Location.requestForegroundPermissionsAsync();
            if (status !== 'granted') {
                setErrorMsg('Permiso a la ubicación denegado');
                return;
            }

            let currentLocation = await Location.getCurrentPositionAsync();
            setLocation(currentLocation);
        }
        getCurrentLocation();
    }, []);

    if (!permission) {
        return <View />;
    }

    if (!permission.granted) {
        return (
            <View>
                <Text>Sin acceso a la cámara</Text>
                <Button title="Solicitar permiso" onPress={requestPermission} />
            </View>
        );
    }

    let text = 'Cargando...';
    if (errorMsg) {
        text = errorMsg;
    } else if (location) {
        text = JSON.stringify(location);
    }

    const ScannedItem = function ({ item }: { item: ScannedCode }) {
        const onCopyPressed = function () {
            Clipboard.setStringAsync(item.code.data);
        };

        return (
            <View style={styles.item}>
                <Text>{item.code.data}</Text>
                <TouchableOpacity onPress={onCopyPressed}>
                    <Text style={styles.copyText}>Copiar</Text>
                </TouchableOpacity>
                {item.location && (
                    <>
                        <Text>{item.location.timestamp}</Text>
                        <Text>Lat: {item.location.coords.latitude}, Long: {item.location.coords.longitude}</Text>
                    </>
                )}
            </View>
        );
    };

    return (
        <View style={styles.container}>
            <Text style={styles.gpsText}>GPS: {text}</Text>
            <CameraView
                style={styles.cameraView}
                facing={facing}
                barcodeScannerSettings={{
                    barcodeTypes: ["qr", "code128", "datamatrix", "aztec", "ean13"]
                }}
                onBarcodeScanned={onBarcodeScanned}
            />
            <FlatList
                data={scannedCodes}
                keyExtractor={(item) => item.location?.timestamp.toString()}
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
    }
});
