import { useState, useEffect } from 'react';
import { Text, View, StyleSheet, Button, Alert, FlatList, TouchableOpacity } from 'react-native';
import * as Location from 'expo-location';
import * as Clipboard from 'expo-clipboard';
import { CameraView, CameraType, useCameraPermissions, BarcodeScanningResult } from 'expo-camera';
import { api, ScannedCode } from '../../ScanQrServer/services/api.service';

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

        try {
            const newCode = await api.createCode(result.data, result.type);
            setScannedCodes(prev => [newCode, ...prev]);
        } catch (error) {
            console.error('Error al guardar el código:', error);
            Alert.alert('Error', 'No se pudo guardar el código escaneado');
        }
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

        async function loadCodes() {
            try {
                const codes = await api.getAllCodes();
                setScannedCodes(codes);
            } catch (error) {
                console.error('Error al cargar códigos:', error);
                setErrorMsg('Error al cargar códigos escaneados');
            }
        }

        getCurrentLocation();
        loadCodes();
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
            Clipboard.setStringAsync(item.data);
        };

        const onDeletePressed = async function () {
            try {
                await api.deleteCode(item.id);
                setScannedCodes(prev => prev.filter(code => code.id !== item.id));
            } catch (error) {
                console.error('Error al eliminar:', error);
                Alert.alert('Error', 'No se pudo eliminar el código');
            }
        };

        return (
            <View style={styles.item}>
                <Text>{item.data}</Text>
                <Text>Tipo: {item.type}</Text>
                <View style={styles.buttonsContainer}>
                    <TouchableOpacity onPress={onCopyPressed}>
                        <Text style={styles.copyText}>Copiar</Text>
                    </TouchableOpacity>
                    <TouchableOpacity onPress={onDeletePressed}>
                        <Text style={styles.deleteText}>Eliminar</Text>
                    </TouchableOpacity>
                </View>
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
                keyExtractor={(item) => item.id}
                renderItem={ScannedItem}
                style={styles.list}
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
        height: '50%',
    },
    item: {
        padding: 15,
        borderBottomWidth: 1,
        borderColor: '#ccc',
    },
    buttonsContainer: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        marginTop: 10,
    },
    copyText: {
        color: '#15A67A',
    },
    deleteText: {
        color: '#E74C3C',
    },
    list: {
        flex: 1,
    }
});