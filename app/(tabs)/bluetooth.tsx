import React, { useState, useEffect } from 'react';
import { View, Text, FlatList, PermissionsAndroid, Platform, StyleSheet } from 'react-native';
import { BleManager } from 'react-native-ble-plx';

const BluetoothScanner = () => {
    const [devices, setDevices] = useState([]);
    const bleManager = new BleManager();

    useEffect(() => {
        // Request Permissions (Android)
        const requestPermissions = async () => {
            if (Platform.OS === 'android' && Platform.Version >= 31) {
                try {
                    const granted = await PermissionsAndroid.requestMultiple([
                        PermissionsAndroid.PERMISSIONS.BLUETOOTH_SCAN,
                        PermissionsAndroid.PERMISSIONS.BLUETOOTH_CONNECT,
                        PermissionsAndroid.PERMISSIONS.ACCESS_FINE_LOCATION,
                    ]);
                    if (granted[PermissionsAndroid.PERMISSIONS.BLUETOOTH_SCAN] !== 'granted' ||
                        granted[PermissionsAndroid.PERMISSIONS.BLUETOOTH_CONNECT] !== 'granted' ||
                        granted[PermissionsAndroid.PERMISSIONS.ACCESS_FINE_LOCATION] !== 'granted') {
                        console.warn('Bluetooth permissions not granted');
                        return;
                    }
                } catch (err) {
                    console.warn(err);
                }
            } else if (Platform.OS === 'android') {
                try {
                    const granted = await PermissionsAndroid.request(
                        PermissionsAndroid.PERMISSIONS.ACCESS_FINE_LOCATION,
                        {
                            title: 'Access fine location required for discovery',
                            message:
                                'In order to perform Bluetooth device discovery, the app needs to access your location.',
                            buttonPositive: 'OK',
                        }
                    );
                    if (granted === PermissionsAndroid.RESULTS.GRANTED) {
                        console.log('Android Location Permission Granted');
                    } else {
                        console.log('Android Location Permission Denied');
                        return;
                    }
                } catch (err) {
                    console.warn(err);
                }
            }

            startScan();
        };

        const startScan = () => {
            bleManager.startDeviceScan(
                null, // null means scan for all devices, you can provide an array of UUIDs
                { allowDuplicates: true }, // iOS requires this to be true to receive RSSI updates
                (error, device) => {
                    if (error) {
                        console.log("Scan Error:", error);
                        return;
                    }

                    console.log("Device Found:", device);

                    if (device && device.rssi) {
                        setDevices(devices => {
                            const alreadyExists = devices.find(d => d.id === device.id);
                            if (alreadyExists) {
                                // Update existing device's RSSI
                                return devices.map(d => (d.id === device.id ? { ...d, rssi: device.rssi } : d));
                            } else {
                                return [...devices, { id: device.id, name: device.name || 'N/A', rssi: device.rssi }];
                            }
                        });
                    }
                }
            );
        };

        requestPermissions();

        return () => {
            bleManager.stopDeviceScan();
        };
    }, []);

    const renderItem = ({ item }) => (
        <View style={styles.deviceContainer}>
            <Text style={styles.deviceName}>{item.name}</Text>
            <Text style={styles.deviceInfo}>ID: {item.id}</Text>
            <Text style={styles.deviceInfo}>RSSI: {item.rssi}</Text>
        </View>
    );

    return (
        <View style={styles.container}>
            <Text style={styles.header}>Nearby Bluetooth Devices</Text>
            <FlatList
                data={devices}
                renderItem={renderItem}
                keyExtractor={item => item.id}
            />
        </View>
    );
};

const styles = StyleSheet.create({
    container: {
        flex: 1,
        padding: 20,
    },
    header: {
        fontSize: 24,
        fontWeight: 'bold',
        marginBottom: 20,
        marginTop: 20,
        color: '#FFFFFF'
    },
    deviceContainer: {
        padding: 10,
        marginBottom: 5,
        borderRadius: 5,
        borderWidth: 1,
        borderColor: '#DDDDDD',
        backgroundColor: '#FFFFFF'
    },
    deviceName: {
        fontSize: 18,
        fontWeight: 'bold',
    },
    deviceInfo: {
        color: '#00000',
        fontSize: 14,
    },
});

export default BluetoothScanner;
