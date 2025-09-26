import * as Location from "expo-location";
import { useFocusEffect, useRouter } from "expo-router";
import { getDistance } from "geolib";
import React, { useCallback, useEffect, useRef, useState } from "react";
import {
  ActivityIndicator,
  Alert,
  Linking,
  Platform,
  RefreshControl,
  ScrollView,
  StatusBar,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from "react-native";
import MapView, { Marker, PROVIDER_GOOGLE } from "react-native-maps";
import { SafeAreaView } from "react-native-safe-area-context";
import MaterialIcons from "react-native-vector-icons/MaterialIcons";
import tailwind from "twrnc";
import { useTabVisibility } from "../../context/TabVisibilityContext";
import useAuth from "../../hooks/useAuth";
import {
  acceptRide,
  completeRide,
  getAvailableRides,
} from "../../lib/services/rideService";

export default function DriverDashboard() {
  const { user, signOut } = useAuth();
  const [availableTrips, setAvailableTrips] = useState([]);
  const [location, setLocation] = useState(null);
  const [selectedTrip, setSelectedTrip] = useState(null);
  const [isOnTrip, setIsOnTrip] = useState(false);
  const [isLoading, setIsLoading] = useState(true);
  const [errorMsg, setErrorMsg] = useState(null);
  const [refreshing, setRefreshing] = useState(false);
  const [distance, setDistance] = useState(null);

  const mapRef = useRef(null);
  const router = useRouter();
  const { setTabBarVisible } = useTabVisibility();
  const locationSubscription = useRef(null);

  // Initial region for the map
  const [region, setRegion] = useState({
    latitude: 9.081999,
    longitude: 8.675277,
    latitudeDelta: 0.0922,
    longitudeDelta: 0.0421,
  });

  useFocusEffect(
    React.useCallback(() => {
      setTabBarVisible(false);
      return () => {
        if (locationSubscription.current) {
          locationSubscription.current.remove();
        }
      };
    }, [setTabBarVisible])
  );

  // Fetch available rides from the database
  const fetchAvailableRides = useCallback(async () => {
    try {
      setRefreshing(true);
      setIsLoading(true);

      // Get driver's current location
      const { status } = await Location.requestForegroundPermissionsAsync();
      if (status !== "granted") {
        setErrorMsg("Permission to access location was denied");
        setIsLoading(false);
        setRefreshing(false);
        return;
      }

      let currentLocation;
      try {
        currentLocation = await Location.getCurrentPositionAsync({
          accuracy: Location.Accuracy.High,
        });
      } catch (locationError) {
        console.error("Error getting current location:", locationError);
        setErrorMsg("Unable to get current location");
        setIsLoading(false);
        setRefreshing(false);
        return;
      }

      const { latitude, longitude } = currentLocation.coords;

      setRegion({
        latitude,
        longitude,
        latitudeDelta: 0.0922,
        longitudeDelta: 0.0421,
      });

      // Fetch all rides with status 'pending'
      console.log("Fetching available rides...");
      const { data: rides, error } = await getAvailableRides({});

      if (error) {
        console.error("Error fetching rides:", error);
        throw error;
      }

      console.log("Fetched rides:", rides);

      const formattedTrips = (rides || []).map((ride) => {
        const pickupLat = parseFloat(ride.pickup_lat);
        const pickupLng = parseFloat(ride.pickup_lng);
        const destinationLat = parseFloat(ride.destination_lat);
        const destinationLng = parseFloat(ride.destination_lng);

        let distanceText = "N/A";
        if (
          !isNaN(latitude) &&
          !isNaN(longitude) &&
          !isNaN(pickupLat) &&
          !isNaN(pickupLng)
        ) {
          const distanceInMeters = getDistance(
            { latitude, longitude },
            { latitude: pickupLat, longitude: pickupLng }
          );
          distanceText = `${(distanceInMeters / 1000).toFixed(1)} km`;
        }

        return {
          id: ride.id,
          passengerName: ride.user_email?.split("@")[0] || "Passenger",
          pickup: {
            latitude: pickupLat,
            longitude: pickupLng,
          },
          pickupLocation: {
            latitude: pickupLat,
            longitude: pickupLng,
          },
          destinationLocation: {
            latitude: destinationLat,
            longitude: destinationLng,
          },
          fare: ride.price
            ? `\u20a6${parseFloat(ride.price).toFixed(2)}`
            : "N/A",
          distance: distanceText,
          pickupAddress: ride.destination_address || "Pickup location",
          destinationAddress: ride.destination_address || "Destination",
          status: ride.status,
          created_at: ride.created_at || new Date().toISOString(),
          user_id: ride.user_id,
          driver_id: ride.driver_id,
        };
      });

      // Sort by distance (closest first)
      formattedTrips.sort((a, b) => {
        if (a.distance === "N/A") return 1;
        if (b.distance === "N/A") return -1;
        return parseFloat(a.distance) - parseFloat(b.distance);
      });

      setAvailableTrips(formattedTrips);
    } catch (error) {
      console.error("Error fetching available rides: ", error);
      Alert.alert("Error", "Failed to load available rides");
    } finally {
      setIsLoading(false);
      setRefreshing(false);
    }
  }, []);

  // Handle accepting a ride
  const handleAcceptRide = async (rideId) => {
    if (!user) {
      Alert.alert("Error", "You must be logged in to accept a ride");
      return;
    }

    try {
      setIsLoading(true);
      const rideToAccept = availableTrips.find((trip) => trip.id === rideId);
      if (!rideToAccept) {
        throw new Error("This ride is no longer available");
      }

      console.log("Accepting ride:", rideId, "for driver:", user.id);
      const { data: updatedRide, error } = await acceptRide(rideId, user.id);

      console.log("acceptRide response:", { data: updatedRide, error });

      if (error) {
        console.error("Error accepting ride:", error);
        Alert.alert(
          "Error",
          `Failed to accept ride: ${error.message || error}`
        );
        return;
      }

      if (!updatedRide || updatedRide.length === 0) {
        Alert.alert(
          "Error",
          "Ride could not be accepted. It may have already been accepted by another driver or is no longer pending."
        );
        return;
      }

      console.log("Ride accepted successfully:", updatedRide);

      // Update the local state to reflect the accepted ride
      setAvailableTrips((prev) => prev.filter((trip) => trip.id !== rideId));

      // Set the selected trip and mark as on trip
      const acceptedTrip = availableTrips.find((trip) => trip.id === rideId);
      if (acceptedTrip) {
        setSelectedTrip({
          ...acceptedTrip,
          status: "accepted",
          driver_id: user.id,
        });
        setIsOnTrip(true);

        // Update the map to show the destination
        if (acceptedTrip.destinationLocation) {
          mapRef.current?.animateToRegion({
            ...acceptedTrip.destinationLocation,
            latitudeDelta: 0.01,
            longitudeDelta: 0.01,
          });
        }

        Alert.alert("Success", "Ride accepted successfully!");
      }
    } catch (error) {
      console.error("Error accepting ride: ", error);

      let errorMessage = "Failed to accept ride. ";
      if (error.message) {
        errorMessage += error.message;
      } else if (error.error_description) {
        errorMessage += error.error_description;
      } else if (typeof error === "string") {
        errorMessage += error;
      }

      Alert.alert("Error", errorMessage);

      // Refresh the available rides list
      fetchAvailableRides();
    } finally {
      setIsLoading(false);
    }
  };

  // Initial data fetch
  useEffect(() => {
    let isMounted = true;

    const fetchData = async () => {
      try {
        // Fetch initial data
        if (isMounted) {
          await fetchAvailableRides();
        }
      } catch (error) {
        console.error("Error fetching data:", error);
      }
    };

    fetchData();

    // Set up interval to refresh data every 30 seconds
    const intervalId = setInterval(() => {
      if (isMounted) {
        fetchAvailableRides();
      }
    }, 30000);

    // Clean up on unmount
    return () => {
      isMounted = false;
      clearInterval(intervalId);
    };
  }, [fetchAvailableRides]);

  // Handle pull-to-refresh
  const onRefresh = useCallback(() => {
    if (!refreshing) {
      fetchAvailableRides();
    }
  }, [fetchAvailableRides, refreshing]);

  // Set up real-time location tracking
  useEffect(() => {
    (async () => {
      let { status } = await Location.requestForegroundPermissionsAsync();
      if (status !== "granted") {
        setErrorMsg("Permission to access location was denied");
        return;
      }

      // Get initial location
      let currentLocation = await Location.getCurrentPositionAsync({
        accuracy: Location.Accuracy.High,
      });

      setLocation(currentLocation);
      updateMapRegion(currentLocation.coords);

      // Subscribe to location updates
      locationSubscription.current = await Location.watchPositionAsync(
        {
          accuracy: Location.Accuracy.High,
          timeInterval: 5000, // Update every 5 seconds
          distanceInterval: 10, // Or every 10 meters
        },
        (newLocation) => {
          setLocation(newLocation);
          updateMapRegion(newLocation.coords);
        }
      );
    })();

    // Cleanup function
    return () => {
      if (locationSubscription.current) {
        locationSubscription.current.remove();
      }
    };
  }, [isOnTrip]);

  const updateMapRegion = (coords) => {
    setRegion({
      latitude: coords.latitude,
      longitude: coords.longitude,
      latitudeDelta: 0.01,
      longitudeDelta: 0.01,
    });
  };

  const handleAcceptTrip = (trip) => {
    setSelectedTrip(trip);
    setIsOnTrip(true);

    // Calculate distance to passenger
    if (location) {
      const distance = getDistance(
        {
          latitude: location.coords.latitude,
          longitude: location.coords.longitude,
        },
        trip.pickup
      );
      setDistance(distance);

      Alert.alert(
        "Trip Accepted",
        `You're on your way to pick up ${trip.passengerName}. Distance: ${(
          distance / 1000
        ).toFixed(1)} km`
      );
    }
  };

  const handleCompleteTrip = async () => {
    if (!selectedTrip || !user) return;
    try {
      setIsLoading(true);
      const { data, error } = await completeRide(selectedTrip.id, user.id);
      if (error) {
        Alert.alert(
          "Error",
          `Failed to complete ride: ${error.message || error}`
        );
        return;
      }
      Alert.alert(
        "Trip Completed",
        "The trip has been completed successfully!"
      );
      setSelectedTrip(null);
      setIsOnTrip(false);
      fetchAvailableRides();
    } catch (err) {
      Alert.alert("Error", "Failed to complete ride.");
    } finally {
      setIsLoading(false);
    }
  };

  const handleNavigateToPassenger = () => {
    if (selectedTrip && location) {
      const { latitude, longitude } =
        selectedTrip.pickupLocation || selectedTrip.pickup;
      const url = Platform.select({
        ios: `maps://app?daddr=${latitude},${longitude}&dirflg=d`,
        android: `google.navigation:q=${latitude},${longitude}`,
      });
      Linking.openURL(url);
    }
  };

  if (isLoading && !refreshing) {
    return (
      <View
        style={tailwind.style("flex-1 justify-center items-center bg-white")}
      >
        <ActivityIndicator size="large" color="#193a69" />
      </View>
    );
  }

  return (
    <SafeAreaView style={styles.container}>
      {/* Logout Button */}
      <View style={{ alignItems: "flex-end", padding: 16 }}>
        <TouchableOpacity
          style={{
            backgroundColor: "#DC2626",
            paddingVertical: 8,
            paddingHorizontal: 20,
            borderRadius: 8,
          }}
          onPress={async () => {
            await signOut();
            router.replace("/");
          }}
        >
          <Text style={{ color: "white", fontWeight: "bold", fontSize: 16 }}>
            Logout
          </Text>
        </TouchableOpacity>
      </View>
      <StatusBar barStyle="dark-content" />

      {/* Map View */}
      <View style={styles.mapContainer}>
        <MapView
          ref={mapRef}
          provider={PROVIDER_GOOGLE}
          style={styles.map}
          region={region}
          showsUserLocation={true}
          showsMyLocationButton={true}
          followsUserLocation={true}
          loadingEnabled={true}
        >
          {/* Available trips */}
          {!isOnTrip &&
            availableTrips.map((trip) => (
              <Marker
                key={trip.id}
                coordinate={trip.pickupLocation || trip.pickup}
                title="Ride Request"
                description={`To: ${trip.destinationAddress}`}
                onPress={() => setSelectedTrip(trip)}
              >
                <View style={styles.requestMarker}>
                  <MaterialIcons
                    name="directions-car"
                    size={24}
                    color="#193a69"
                  />
                </View>
              </Marker>
            ))}

          {/* Selected trip destination */}
          {selectedTrip && isOnTrip && selectedTrip.destinationLocation && (
            <Marker
              coordinate={selectedTrip.destinationLocation}
              title="Destination"
              pinColor="#34d399"
            />
          )}
        </MapView>
      </View>

      {/* Trip Info Card */}
      {selectedTrip && (
        <View style={styles.tripCard}>
          <View style={styles.tripHeader}>
            <Text style={styles.tripTitle}>
              {isOnTrip ? "Current Trip" : "Trip Request"}
            </Text>
            <Text style={styles.tripPrice}>{selectedTrip.fare || "500"}</Text>
          </View>

          <View style={styles.routeInfo}>
            <View style={styles.routeDot} />
            <View style={styles.routeLine} />
            <View style={[styles.routeDot, { backgroundColor: "#34d399" }]} />
          </View>

          <View style={styles.locationInfo}>
            <View>
              <Text style={styles.locationLabel}>From:</Text>
              <Text style={styles.locationTextBold}>
                {selectedTrip.pickupAddress || "Pickup Location"}
              </Text>
            </View>
            <View style={{ marginTop: 12 }}>
              <Text style={styles.locationLabel}>To:</Text>
              <Text style={styles.locationTextBold}>
                {selectedTrip.destinationAddress || "Destination"}
              </Text>
            </View>
          </View>

          <View style={styles.tripActions}>
            {!isOnTrip ? (
              <>
                <TouchableOpacity
                  style={[styles.actionButton, { backgroundColor: "#f1f5f9" }]}
                  onPress={() => setSelectedTrip(null)}
                >
                  <Text style={[styles.actionButtonText, { color: "#64748b" }]}>
                    Decline
                  </Text>
                </TouchableOpacity>
                <TouchableOpacity
                  style={[styles.actionButton, { backgroundColor: "#193a69" }]}
                  onPress={() => handleAcceptRide(selectedTrip.id)}
                >
                  <Text style={[styles.actionButtonText, { color: "white" }]}>
                    Accept
                  </Text>
                </TouchableOpacity>
              </>
            ) : (
              <>
                <TouchableOpacity
                  style={[
                    styles.actionButton,
                    {
                      backgroundColor: "#f1f5f9",
                      flexDirection: "row",
                      gap: 8,
                    },
                  ]}
                  onPress={handleNavigateToPassenger}
                >
                  <MaterialIcons name="navigation" size={20} color="#193a69" />
                  <Text style={[styles.actionButtonText, { color: "#193a69" }]}>
                    Navigate
                  </Text>
                </TouchableOpacity>
                <TouchableOpacity
                  style={[styles.actionButton, { backgroundColor: "#193a69" }]}
                  onPress={handleCompleteTrip}
                >
                  <Text style={[styles.actionButtonText, { color: "white" }]}>
                    Complete Trip
                  </Text>
                </TouchableOpacity>
              </>
            )}
          </View>
        </View>
      )}

      {/* Available Trips List */}
      {!selectedTrip && availableTrips.length > 0 && (
        <View style={styles.tripsListContainer}>
          <View style={styles.sectionHeader}>
            <Text style={styles.sectionTitle}>Available Trips</Text>
            <Text style={styles.ridesCount}>
              {availableTrips.length}{" "}
              {availableTrips.length === 1 ? "ride" : "rides"} available
            </Text>
          </View>
          <ScrollView
            horizontal
            showsHorizontalScrollIndicator={false}
            contentContainerStyle={{ paddingHorizontal: 16, paddingBottom: 20 }}
            refreshControl={
              <RefreshControl
                refreshing={refreshing}
                onRefresh={onRefresh}
                colors={["#123566"]}
                tintColor="#123566"
              />
            }
          >
            {availableTrips.map((trip) => (
              <TouchableOpacity
                key={trip.id}
                style={[
                  styles.tripItem,
                  selectedTrip?.id === trip.id && styles.selectedTripItem,
                ]}
                onPress={() => setSelectedTrip(trip)}
                activeOpacity={0.8}
              >
                <View style={styles.tripItemHeader}>
                  <View style={styles.tripItemAvatar}>
                    <MaterialIcons name="person" size={20} color="#193a69" />
                  </View>
                  <Text style={styles.tripItemName} numberOfLines={1}>
                    {trip.passengerName || "Passenger"}
                  </Text>
                </View>
                <View style={styles.tripItemRoute}>
                  <View style={styles.tripItemDot} />
                  <View style={styles.tripItemLine} />
                  <View
                    style={[styles.tripItemDot, { backgroundColor: "#34d399" }]}
                  />
                </View>
                <View style={styles.tripItemInfo}>
                  <Text style={styles.tripItemDistance}>
                    {trip.distance || "Calculating..."} • {trip.fare || "N/A"}
                  </Text>
                  <View style={styles.locationInfo}>
                    <View style={styles.locationDot} />
                    <Text
                      style={[styles.locationText, { flex: 1 }]}
                      numberOfLines={1}
                    >
                      {trip.pickupAddress || "Pickup Location"}
                    </Text>
                  </View>
                  <View style={styles.locationInfo}>
                    <View
                      style={[
                        styles.locationDot,
                        { backgroundColor: "#10B981" },
                      ]}
                    />
                    <Text
                      style={[styles.locationText, { flex: 1 }]}
                      numberOfLines={1}
                    >
                      {trip.destinationAddress || "Destination"}
                    </Text>
                  </View>
                </View>
                <TouchableOpacity
                  style={styles.acceptButton}
                  onPress={() => handleAcceptRide(trip.id)}
                >
                  <Text style={styles.acceptButtonText}>Accept</Text>
                </TouchableOpacity>
              </TouchableOpacity>
            ))}
          </ScrollView>
        </View>
      )}

      {/* No rides available state */}
      {!selectedTrip && availableTrips.length === 0 && !isLoading && (
        <View style={styles.emptyState}>
          <MaterialIcons name="directions-car" size={64} color="#d1d5db" />
          <Text style={styles.emptyStateTitle}>No Rides Available</Text>
          <Text style={styles.emptyStateText}>
            We'll notify you when a ride becomes available in your area.
          </Text>
          <TouchableOpacity
            style={styles.refreshButton}
            onPress={fetchAvailableRides}
            disabled={refreshing}
          >
            <MaterialIcons
              name="refresh"
              size={20}
              color="#123566"
              style={refreshing ? { transform: [{ rotate: "360deg" }] } : {}}
            />
            <Text style={styles.refreshButtonText}>
              {refreshing ? "Refreshing..." : "Refresh"}
            </Text>
          </TouchableOpacity>
        </View>
      )}
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: "#f9f9f9",
  },
  sectionHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: 12,
    paddingRight: 16,
  },
  ridesCount: {
    color: "#6B7280",
    fontSize: 14,
  },
  locationInfo: {
    flexDirection: "column",
    alignItems: "center",
    marginBottom: 8,
  },
  locationDot: {
    width: 8,
    height: 8,
    borderRadius: 4,
    backgroundColor: "#3B82F6",
    marginRight: 8,
  },
  locationText: {
    flex: 1,
    color: "#4B5563",
    fontSize: 14,
  },
  buttonRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginTop: 12,
  },
  rideTime: {
    fontSize: 12,
    color: "#6B7280",
    marginTop: 2,
  },
  mapContainer: {
    height: 350,
    borderRadius: 16,
    overflow: "hidden",
    marginHorizontal: 16,
    marginBottom: 8,
  },
  map: {
    ...StyleSheet.absoluteFillObject,
  },
  // Trip Card
  tripCard: {
    backgroundColor: "white",
    borderRadius: 16,
    margin: 16,
    padding: 20,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 8,
    elevation: 3,
    borderWidth: 1,
    borderColor: "#e5e7eb",
  },
  selectedTripItem: {
    borderColor: "#3B82F6",
    borderWidth: 1,
    backgroundColor: "#F0F9FF",
  },
  tripHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: 16,
  },
  tripTitle: {
    fontSize: 18,
    fontWeight: "600",
    color: "#1e293b",
  },
  tripPrice: {
    fontSize: 20,
    fontWeight: "700",
    color: "#193a69",
  },
  routeInfo: {
    alignItems: "center",
    marginVertical: 8,
  },
  routeDot: {
    width: 12,
    height: 12,
    borderRadius: 6,
    backgroundColor: "#193a69",
  },
  routeLine: {
    width: 2,
    height: 24,
    backgroundColor: "#cbd5e1",
    marginVertical: 2,
  },
  locationLabel: {
    fontSize: 12,
    color: "#64748b",
    marginBottom: 2,
  },
  locationTextBold: {
    fontSize: 14,
    color: "#1e293b",
    fontWeight: "500",
  },
  tripActions: {
    flexDirection: "row",
    justifyContent: "space-between",
    marginTop: 16,
    gap: 12,
  },
  actionButton: {
    flex: 1,
    paddingVertical: 12,
    borderRadius: 8,
    alignItems: "center",
    justifyContent: "center",
  },
  actionButtonText: {
    fontSize: 16,
    fontWeight: "600",
  },
  // Trips List
  tripsListContainer: {
    backgroundColor: "white",
    borderTopLeftRadius: 20,
    borderTopRightRadius: 20,
    paddingTop: 20,
    paddingBottom: 8,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: -4 },
    shadowOpacity: 0.05,
    shadowRadius: 8,
    elevation: 5,
  },
  sectionTitle: {
    fontSize: 16,
    fontWeight: "600",
    color: "#1e293b",
    marginBottom: 12,
    paddingHorizontal: 16,
  },
  tripItem: {
    backgroundColor: "#f8fafc",
    borderRadius: 12,
    padding: 16,
    width: 280,
    marginRight: 12,
  },
  tripItemHeader: {
    flexDirection: "row",
    alignItems: "center",
    marginBottom: 12,
  },
  tripItemAvatar: {
    width: 32,
    height: 32,
    borderRadius: 16,
    backgroundColor: "#e2e8f0",
    alignItems: "center",
    justifyContent: "center",
    marginRight: 8,
  },
  tripItemName: {
    fontSize: 14,
    fontWeight: "600",
    color: "#1e293b",
  },
  tripItemRoute: {
    alignItems: "center",
    marginVertical: 4,
  },
  tripItemDot: {
    width: 8,
    height: 8,
    borderRadius: 4,
    backgroundColor: "#193a69",
  },
  tripItemLine: {
    width: 1,
    height: 16,
    backgroundColor: "#cbd5e1",
    marginVertical: 2,
  },
  tripItemInfo: {
    marginTop: 8,
  },
  tripItemDistance: {
    fontSize: 12,
    color: "#6b7280",
  },
  tripItemAddress: {
    fontSize: 12,
    color: "#4b5563",
    marginTop: 2,
  },
  // Request Marker
  requestMarker: {
    backgroundColor: "white",
    padding: 6,
    borderRadius: 20,
    borderWidth: 2,
    borderColor: "#193a69",
  },
  // Empty state
  emptyState: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
    padding: 24,
  },
  emptyStateTitle: {
    fontSize: 20,
    fontWeight: "600",
    color: "#374151",
    marginTop: 16,
    marginBottom: 8,
  },
  emptyStateText: {
    fontSize: 16,
    color: "#6B7280",
    textAlign: "center",
    marginBottom: 24,
  },
  refreshButton: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: "#EFF6FF",
    paddingVertical: 10,
    paddingHorizontal: 16,
    borderRadius: 8,
  },
  refreshButtonText: {
    color: "#1D4ED8",
    fontWeight: "600",
    marginLeft: 8,
  },
  acceptButton: {
    backgroundColor: "#123566",
    padding: 10,
    borderRadius: 8,
    alignItems: "center",
    marginTop: 12,
  },
  acceptButtonText: {
    color: "white",
    fontWeight: "600",
  },
});
