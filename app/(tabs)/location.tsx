import React, { useState, useEffect } from 'react';
import { View, Text, Button, StyleSheet, PermissionsAndroid, Platform } from 'react-native';
import * as Location from 'expo-location';
import * as TaskManager from 'expo-task-manager';
import * as Device from 'expo-device';

const LOCATION_TASK_NAME = "BACKGROUND_LOCATION_TASK";

TaskManager.defineTask(LOCATION_TASK_NAME, async ({ data, error }) => {
  if (error) {
    console.error("Error in background location task:", error);
    return;
  }

  console.log("hello");

  if (data) {
    const { locations } = data as any;
    if(Device.modelName === undefined || Device.deviceName === undefined) {
      locations[0]["deviceId"] = "Unknown Device";
    }
    else
    {
    locations[0]["deviceId"] = Device.modelName + " " + Device.deviceName;
    }
    
    console.error("Received new locations:", locations);
    // You can send locations to your server or process them as needed
        // send post request to server with locations
        try {
          const fetchWithTimeout = (url, options, timeout = 5000) => {
            return Promise.race([
              fetch(url, options),
              new Promise((_, reject) =>
                setTimeout(() => reject(new Error('Timeout')), timeout)
              )
            ]);
          };

          const response = await fetchWithTimeout('http://52.23.149.90:3005/ttntest', {
            method: 'POST',
            headers: {
              'Accept': 'application/json',
              'Content-Type': 'application/json',
            },
            body: JSON.stringify(locations),
          });

          const response2 = await fetchWithTimeout('https://webhook.site/92aeec6c-d3ee-4df8-bbd5-0224854e9e76', {
            method: 'POST',
            headers: {
              'Accept': 'application/json',
              'Content-Type': 'application/json',
            },
            body: JSON.stringify(locations),
          });

    
          if (!response.ok) {
          console.error('Failed to send location data to server:', response.statusText);
          } else {
          console.error('Location data sent to server:', locations);
          }
        } catch (error) {
          console.error('Error sending location data to server:', error);
        }
  }
});

const DisplayLocation = () => {
  const [location, setLocation] = useState<{ latitude: number; longitude: number } | null>(null);
  const [applogs, setApplogs] = useState<string | null>(null);

  const requestPermissions = async () => {
    // Request foreground location permissions
    const { status: foregroundStatus } = await Location.requestForegroundPermissionsAsync();
    if (foregroundStatus !== "granted") {
      console.error("Foreground location permission not granted");
      return false;
    }
  
    // Request background location permissions (foreground is required first)
    const { status: backgroundStatus } = await Location.requestBackgroundPermissionsAsync();
    if (backgroundStatus !== "granted") {
      console.error("Background location permission not granted");
      return false;
    }
  
    setApplogs("Permissions granted");
    console.log("Permissions granted");
    return true;
  };

  const getCurrentLocation = async () => {
    // Request permissions
    const { status } = await Location.requestForegroundPermissionsAsync();
    if (status !== 'granted') {
        console.log('Permission to access location was denied');
        return;
    }

    const location = await Location.getCurrentPositionAsync({
      accuracy: Location.Accuracy.BestForNavigation,
    });
    console.log(location);
    setLocation({
      latitude: location.coords.latitude,
      longitude: location.coords.longitude,
    });
    startBackgroundLocationTracking();
  };

  const startBackgroundLocationTracking = async () => {
    await requestPermissions();
    if (! await TaskManager.isTaskRegisteredAsync(LOCATION_TASK_NAME)) {
      try {
        // Start background location updates
        await Location.startLocationUpdatesAsync(LOCATION_TASK_NAME, {
          accuracy: Location.Accuracy.BestForNavigation,
          distanceInterval: 10, // Fetch location every 10 meters
          timeInterval: 10000, // Fetch location every 10 seconds
          // showsBackgroundLocationIndicator: true, // Show indicator on iOS
          foregroundService: {
            notificationTitle: "Tracking Your Location",
            notificationBody: "Your location is being used in the background",
            notificationColor: "#FFFFFF", // iOS & Android notification color
          },
        });
        setApplogs("Background location task started!");
        console.log("Background location task started!");
      } catch (e) {
        setApplogs("Error starting location updates: " + e);
        console.error("Error starting location updates:", e);
      }
    } else {
      setApplogs("Location task is already running.");
      console.log("Location task is already running.");
    }
  };


  useEffect(() => {
    (async () => {
        // getCurrentLocation();
        // startBackgroundLocationTracking();
    })();
  }, []);

  return (
    <View style={styles.container}>
      <Text style={styles.title}>Geolocation Example</Text>
      {location ? (
        <Text style={styles.location}>
          Latitude: {location.latitude}, Longitude: {location.longitude}
        </Text>
      ) : (
        <Text style={styles.info}>Fetching location...</Text>
      )}

      {applogs ? (
        <Text style={styles.location}>
          {applogs}
        </Text>
      ) : (
        <Text style={styles.info}>Fetching location...</Text>
      )}
      <Button title="Refresh Location" onPress={getCurrentLocation} />
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 16,
  },
  title: {
    fontSize: 20,
    fontWeight: 'bold',
    marginBottom: 16,
  },
  location: {
    fontSize: 16,
    color: 'green',
    marginBottom: 16,
  },
  info: {
    fontSize: 16,
    marginBottom: 16,
  },
});

export default DisplayLocation;

