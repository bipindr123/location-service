import React, { useState, useEffect } from 'react';
import { View, Text, Button, StyleSheet, PermissionsAndroid, Platform } from 'react-native';
import * as Location from 'expo-location';
import * as TaskManager from 'expo-task-manager';

const LOCATION_TASK_NAME = "BACKGROUND_LOCATION_TASK";

TaskManager.defineTask(LOCATION_TASK_NAME, async ({ data, error }) => {
  if (error) {
    console.error("Error in background location task:", error);
    return;
  }

  if (data) {
    const { locations } = data as any;
    console.log("Received new locations:", locations);
    // You can send locations to your server or process them as needed
  }
});

const DisplayLocation = () => {
  const [location, setLocation] = useState<{ latitude: number; longitude: number } | null>(null);

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

        console.log("Background location task started!");
      } catch (e) {
        console.error("Error starting location updates:", e);
      }
    } else {
      console.log("Location task is already running.");
    }
  };


  useEffect(() => {
    (async () => {
        getCurrentLocation();
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

