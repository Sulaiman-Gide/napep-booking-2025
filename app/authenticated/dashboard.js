import AsyncStorage from "@react-native-async-storage/async-storage";
import * as Location from "expo-location";
import { useFocusEffect } from "expo-router";
import { getDistance } from "geolib";
import React, { useEffect, useState } from "react";
import {
  Alert,
  Dimensions,
  ScrollView,
  StatusBar,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { useTabVisibility } from "../../context/TabVisibilityContext";

export default function DriverDashboard() {
  const [driverName, setDriverName] = useState("");
  const [availableTrips, setAvailableTrips] = useState([]);
  const [location, setLocation] = useState(null);
  const [selectedTrip, setSelectedTrip] = useState(null);
  const { setTabBarVisible } = useTabVisibility();

  useFocusEffect(
    React.useCallback(() => {
      setTabBarVisible(false);
    }, [setTabBarVisible])
  );

  useEffect(() => {
    const fetchDriverData = async () => {
      try {
        const name = await AsyncStorage.getItem("loggedInDriverName");
        if (name) {
          setDriverName(name);
        }

        const trips = await AsyncStorage.getItem("rideRequests");
        setAvailableTrips(trips ? JSON.parse(trips) : []);
      } catch (error) {
        console.error("Error fetching driver data: ", error);
      }
    };

    fetchDriverData();

    (async () => {
      let { status } = await Location.requestForegroundPermissionsAsync();
      if (status !== "granted") {
        console.log("Permission to access location was denied");
        return;
      }
      let location = await Location.getCurrentPositionAsync({});
      setLocation(location);
    })();
  }, []);

  const acceptTrip = (trip) => {
    setSelectedTrip(trip);

    // Remove the accepted trip from available trips
    const updatedTrips = availableTrips.filter((t) => t !== trip);
    setAvailableTrips(updatedTrips);

    Alert.alert(
      "Trip Accepted",
      `Pickup at: ${trip.pickup.latitude}, ${trip.pickup.longitude}`
    );
  };

  const startNavigation = () => {
    if (!location || !selectedTrip) return;

    const distance = getDistance(
      {
        latitude: location.coords.latitude,
        longitude: location.coords.longitude,
      },
      {
        latitude: selectedTrip.pickup.latitude,
        longitude: selectedTrip.pickup.longitude,
      }
    );

    Alert.alert(
      "Navigation Started",
      `Distance to passenger: ${distance / 1000} km`
    );
  };

  return (
    <SafeAreaView style={styles.container}>
      <StatusBar barStyle="dark-content" />
      <ScrollView
        showsVerticalScrollIndicator={false}
        contentContainerStyle={styles.scrollContainer}
      >
        <Text style={styles.welcomeText}>Welcome {driverName},</Text>
        <Text style={styles.tripsHeader}>Available Trips</Text>

        {availableTrips.length > 0 ? (
          availableTrips.map((trip, index) => (
            <TouchableOpacity
              key={index}
              onPress={() => acceptTrip(trip)}
              style={styles.tripButton}
            >
              <Text style={styles.tripText}>
                Pickup: {trip.pickup.latitude}, {trip.pickup.longitude}
              </Text>
              <Text style={styles.tripText}>
                Destination: {trip.destination.latitude},{" "}
                {trip.destination.longitude}
              </Text>
              <Text style={styles.tripCost}>
                Cost: ₦{trip.cost ? trip.cost.toFixed(2) : "N/A"}
              </Text>
            </TouchableOpacity>
          ))
        ) : (
          <Text style={styles.noTripText}>No available trips</Text>
        )}

        {selectedTrip && (
          <>
            <View style={styles.mapContainer}>
              <MapView
                style={styles.map}
                initialRegion={
                  location
                    ? {
                        latitude: location.coords.latitude,
                        longitude: location.coords.longitude,
                        latitudeDelta: 0.0922,
                        longitudeDelta: 0.0421,
                      }
                    : {
                        latitude: 37.78825,
                        longitude: -122.4324,
                        latitudeDelta: 0.0922,
                        longitudeDelta: 0.0421,
                      }
                }
                showsUserLocation={true}
                followsUserLocation={true}
              >
                <Marker
                  coordinate={selectedTrip.pickup}
                  title="Pickup Location"
                />
                <Marker
                  coordinate={selectedTrip.destination}
                  title="Destination"
                />
              </MapView>
            </View>

            <TouchableOpacity
              onPress={startNavigation}
              style={styles.navigateButton}
            >
              <Text style={styles.navigateButtonText}>Start Navigation</Text>
            </TouchableOpacity>
          </>
        )}
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: "#f9f9f9",
  },
  scrollContainer: {
    flexGrow: 1,
    paddingHorizontal: 16,
    paddingTop: 20,
  },
  welcomeText: {
    fontFamily: "NunitoSans-Bold",
    fontSize: 24,
    color: "#072F4A",
    marginBottom: 10,
  },
  tripsHeader: {
    fontFamily: "NunitoSans-SemiBold",
    fontSize: 20,
    color: "#1e4985",
    marginBottom: 10,
  },
  tripButton: {
    backgroundColor: "#1e4985",
    padding: 15,
    borderRadius: 12,
    marginVertical: 8,
    elevation: 3,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.3,
    shadowRadius: 4,
  },
  tripText: {
    color: "#ffffff",
    fontSize: 16,
  },
  tripCost: {
    color: "#ffd700",
    fontWeight: "bold",
    fontSize: 18,
  },
  noTripText: {
    color: "#000",
    fontSize: 18,
    textAlign: "center",
    marginTop: 20,
  },
  mapContainer: {
    height: Dimensions.get("window").height * 0.5,
    marginVertical: 20,
    borderRadius: 12,
    overflow: "hidden",
  },
  map: {
    ...StyleSheet.absoluteFillObject,
  },
  navigateButton: {
    backgroundColor: "#1e4985",
    paddingVertical: 15,
    borderRadius: 12,
    alignItems: "center",
    marginBottom: 20,
    elevation: 3,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.3,
    shadowRadius: 4,
  },
  navigateButtonText: {
    color: "#ffffff",
    fontSize: 18,
    fontWeight: "600",
  },
});
