import { useEffect, useState } from "react";
import { Text, View } from "react-native";
import * as Location from "expo-location";

export default () => {
    const [location, setLocation] = useState<Location.LocationObject | null>(null);
    const [errorMsg, setErrorMsg] = useState<string | null>(null);
    useEffect(() => {
        async function getCurrentLocation(){
            let {status} = await Location.requestForegroundPermissionsAsync();
            if (status !== 'granted') {
                setErrorMsg('Permiso a la ubicacion denegado.');
                return;
            }

            let location = await Location.getCurrentPositionAsync({});
            setLocation(location);
        }
        getCurrentLocation();
    }, []);

    let text = "Cargando..."
    if (errorMsg) {
        text = errorMsg;
    } else if (location) {
        text = JSON.stringify(location);
    }

    return (
        <View>
            <Text>{text}</Text>
        </View>
    );
};