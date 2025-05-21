import { useState, useEffect } from 'react';
import { Text, View, StyleSheet, Button, Alert, FlatList, TouchableOpacity } from 'react-native';
import * as Location from 'expo-location';
import * as Clipboard from 'expo-clipboard';
import { CameraView, CameraType, useCameraPermissions, BarcodeScanningResult } from 'expo-camera';
import { api, ScannedCode } from '../src/api.service';

export default function ScannerScreen() {
    const [location, setLocation] = useState<Location.LocationObject | null>(null);
    const [errorMsg, setErrorMsg] = useState<string | null>(null);
    const [facing, setFacing] = useState<CameraType>('back');
    const [permission, requestPermission] = useCameraPermissions();
    const [scannedCodes, setScannedCodes] = useState<ScannedCode[]>([]);

    const onBarcodeScanned = async (result: BarcodeScanningResult) => {
        try {
            // Mostrar alerta con el contenido escaneado
            if (window) {
                window.alert(`Código escaneado: ${result.data}`);
            } else {
                Alert.alert('Código escaneado', result.data);
            }

            // Guardar en el servidor
            const newCode = await api.createCode(result.data, result.type);
            
            // Actualizar lista local
            setScannedCodes(prevCodes => [newCode, ...prevCodes]);
        } catch (error) {
            console.error('Error al guardar el código:', error);
            Alert.alert('Error', 'No se pudo guardar el código escaneado');
        }
    };

    const fetchCodes = async () => {
        try {
            const codes = await api.getAllCodes();
            setScannedCodes(codes);
        } catch (error) {
            console.error('Error al cargar códigos:', error);
            setErrorMsg('Error al cargar códigos escaneados');
        }
    };

    const getCurrentLocation = async () => {
        try {
            let { status } = await Location.requestForegroundPermissionsAsync();
            if (status !== 'granted') {
                setErrorMsg('Permiso a la ubicación denegado');
                return;
            }

            let currentLocation = await Location.getCurrentPositionAsync();
            setLocation(currentLocation);
        } catch (error) {
            console.error('Error al obtener ubicación:', error);
            setErrorMsg('Error al obtener ubicación');
        }
    };

    useEffect(() => {
        getCurrentLocation();
        fetchCodes();
    }, []);

    const handleCopy = async (text: string) => {
        try {
            await Clipboard.setStringAsync(text);
            Alert.alert('Copiado', 'El texto se ha copiado al portapapeles');
        } catch (error) {
            console.error('Error al copiar:', error);
            Alert.alert('Error', 'No se pudo copiar el texto');
        }
    };

    const handleDelete = async (id: string) => {
        try {
            await api.deleteCode(id);
            setScannedCodes(prev => prev.filter(code => code.id !== id));
            Alert.alert('Eliminado', 'Código eliminado correctamente');
        } catch (error) {
            console.error('Error al eliminar:', error);
            Alert.alert('Error', 'No se pudo eliminar el código');
        }
    };

    if (!permission) {
        return <View style={styles.container} />;
    }

    if (!permission.granted) {
        return (
            <View style={styles.permissionContainer}>
                <Text style={styles.permissionText}>Se necesita permiso para acceder a la cámara</Text>
                <Button title="Solicitar permiso" onPress={requestPermission} />
            </View>
        );
    }

    const ScannedItem = ({ item }: { item: ScannedCode }) => (
        <View style={styles.item}>
            <Text style={styles.itemType}>Tipo: {item.type.toUpperCase()}</Text>
            <Text style={styles.itemData}>{item.data}</Text>
            <View style={styles.itemButtons}>
                <TouchableOpacity 
                    style={[styles.button, styles.copyButton]}
                    onPress={() => handleCopy(item.data)}
                >
                    <Text style={styles.buttonText}>Copiar</Text>
                </TouchableOpacity>
                <TouchableOpacity 
                    style={[styles.button, styles.deleteButton]}
                    onPress={() => handleDelete(item.id)}
                >
                    <Text style={styles.buttonText}>Eliminar</Text>
                </TouchableOpacity>
            </View>
        </View>
    );

    return (
        <View style={styles.container}>
            <CameraView
                style={styles.camera}
                facing={facing}
                barcodeScannerSettings={{
                    barcodeTypes: ["qr", "code128", "datamatrix", "aztec", "ean13"]
                }}
                onBarcodeScanned={onBarcodeScanned}
            />
            
            <View style={styles.statusBar}>
                <Text style={styles.statusText}>
                    {errorMsg || (location ? 
                        `Lat: ${location.coords.latitude.toFixed(4)}, Lon: ${location.coords.longitude.toFixed(4)}` : 
                        'Obteniendo ubicación...')}
                </Text>
            </View>

            <FlatList
                data={scannedCodes}
                renderItem={ScannedItem}
                keyExtractor={(item) => item.id}
                style={styles.list}
                contentContainerStyle={styles.listContent}
                ListHeaderComponent={
                    <Text style={styles.listHeader}>Códigos escaneados: {scannedCodes.length}</Text>
                }
            />
        </View>
    );
}

const styles = StyleSheet.create({
    container: {
        flex: 1,
        backgroundColor: '#f5f5f5',
    },
    permissionContainer: {
        flex: 1,
        justifyContent: 'center',
        alignItems: 'center',
        padding: 20,
    },
    permissionText: {
        fontSize: 18,
        marginBottom: 20,
        textAlign: 'center',
    },
    camera: {
        flex: 1,
    },
    statusBar: {
        padding: 10,
        backgroundColor: '#333',
    },
    statusText: {
        color: 'white',
        fontSize: 14,
    },
    list: {
        flex: 1,
    },
    listContent: {
        paddingBottom: 20,
    },
    listHeader: {
        fontSize: 16,
        fontWeight: 'bold',
        padding: 15,
        backgroundColor: '#eee',
    },
    item: {
        backgroundColor: 'white',
        marginHorizontal: 10,
        marginTop: 10,
        borderRadius: 8,
        padding: 15,
        elevation: 2,
    },
    itemType: {
        fontSize: 12,
        color: '#666',
        marginBottom: 5,
    },
    itemData: {
        fontSize: 16,
        marginBottom: 10,
    },
    itemButtons: {
        flexDirection: 'row',
        justifyContent: 'flex-end',
    },
    button: {
        paddingVertical: 6,
        paddingHorizontal: 12,
        borderRadius: 4,
        marginLeft: 10,
    },
    copyButton: {
        backgroundColor: '#2196F3',
    },
    deleteButton: {
        backgroundColor: '#f44336',
    },
    buttonText: {
        color: 'white',
        fontSize: 14,
    },
});