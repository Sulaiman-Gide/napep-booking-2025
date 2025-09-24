import AsyncStorage from "@react-native-async-storage/async-storage";
import { useFocusEffect } from "@react-navigation/native";
import { LinearGradient } from "expo-linear-gradient";
import * as Location from "expo-location";
import React, { useEffect, useRef, useState } from "react";
import {
  ActivityIndicator,
  Alert,
  Dimensions,
  ScrollView,
  StatusBar,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from "react-native";
import MapView, { Marker } from "react-native-maps";
import { SafeAreaView } from "react-native-safe-area-context";
import MaterialIcons from "react-native-vector-icons/MaterialIcons";
import tailwind from "twrnc";
import PlusIcon from "../../assets/images/plus-icon.svg";
import UserAvatar from "../../assets/images/userAvatar.svg";
import { useTabVisibility } from "../../context/TabVisibilityContext";
import { createRideRequest } from "../../lib/services/rideService";
import { supabase } from "../../lib/supabase";

export default function Home({ navigation }) {
  const [userName, setUserName] = useState("");
  const [isBooking, setIsBooking] = useState(false);
  const [userBalance, setUserBalance] = useState(0);
  const [totalSpent, setTotalSpent] = useState(0);
  const { setTabBarVisible } = useTabVisibility();
  const [location, setLocation] = useState(null);
  const [destination, setDestination] = useState(null);
  const [destinationAddress, setDestinationAddress] = useState("");
  const [errorMsg, setErrorMsg] = useState(null);
  const [mapReady, setMapReady] = useState(false);
  const [region, setRegion] = useState({
    latitude: 9.081999,
    longitude: 8.675277,
    latitudeDelta: 0.0922,
    longitudeDelta: 0.0421,
  });
  const mapRef = useRef(null);

  useFocusEffect(
    React.useCallback(() => {
      setTabBarVisible(true);
      // Request location permissions when component mounts
      (async () => {
        let { status } = await Location.requestForegroundPermissionsAsync();
        if (status !== "granted") {
          setErrorMsg("Permission to access location was denied");
          return;
        }

        // Get current location
        const currentLocation = await Location.getCurrentPositionAsync({});
        setLocation(currentLocation);

        // Update map region
        setRegion({
          latitude: currentLocation.coords.latitude,
          longitude: currentLocation.coords.longitude,
          latitudeDelta: 0.0922,
          longitudeDelta: 0.0421,
        });
      })();
    }, [setTabBarVisible])
  );

  useFocusEffect(
    React.useCallback(() => {
      const fetchUserData = async () => {
        try {
          const name = await AsyncStorage.getItem("loggedInUserName");
          const balance = await AsyncStorage.getItem("loggedInUserBalance");
          const totalSpent = await AsyncStorage.getItem("totalSpent");

          if (name) {
            setUserName(name);
          } else {
            setUserName("Guest");
          }

          setUserBalance(parseFloat(balance) || 0);
          setTotalSpent(parseFloat(totalSpent) || 0);
        } catch (error) {
          console.error("Error fetching user data: ", error);
        }
      };

      fetchUserData();
    }, [])
  );

  // Get user location
  useEffect(() => {
    let isMounted = true;

    const getLocation = async () => {
      try {
        let { status } = await Location.requestForegroundPermissionsAsync();
        if (status !== "granted") {
          if (isMounted) {
            setErrorMsg(
              "Location permission not granted. Using default location."
            );
          }
          return;
        }

        // First try to get the last known position (faster)
        try {
          const lastPosition = await Location.getLastKnownPositionAsync({});
          if (lastPosition && isMounted) {
            setLocation(lastPosition);
            setRegion({
              latitude: lastPosition.coords.latitude,
              longitude: lastPosition.coords.longitude,
              latitudeDelta: 0.005,
              longitudeDelta: 0.005,
            });
          }
        } catch (error) {
          console.warn("Error getting last known position:", error);
        }

        // Then get the current position (more accurate but slower)
        try {
          const location = await Location.getCurrentPositionAsync({
            accuracy: Location.Accuracy.Balanced,
            timeout: 10000,
          });

          if (isMounted) {
            setLocation(location);
            setRegion({
              latitude: location.coords.latitude,
              longitude: location.coords.longitude,
              latitudeDelta: 0.005,
              longitudeDelta: 0.005,
            });
          }
        } catch (error) {
          console.warn("Error getting current position:", error);
          if (isMounted && !location) {
            setErrorMsg("Couldn't get your location. Using default location.");
          }
        }
      } catch (error) {
        console.error("Location error:", error);
        if (isMounted) {
          setErrorMsg("Error getting your location. Using default location.");
        }
      }
    };

    getLocation();

    return () => {
      isMounted = false;
    };
  }, []);

  // Handle map press to set destination
  const handleMapPress = (event) => {
    const { coordinate } = event.nativeEvent;
    setDestination({
      latitude: coordinate.latitude,
      longitude: coordinate.longitude,
    });
  };

  // Function to book a ride
  const bookRide = async () => {
    if (!destination) {
      Alert.alert("Set a destination first");
      return;
    }

    if (!location) {
      Alert.alert("Location not found. Please enable location services.");
      return;
    }
    setIsBooking(true);
    try {
      const {
        data: { user },
      } = await supabase.auth.getUser();
      if (!user) {
        Alert.alert("Error", "You must be logged in to book a ride");
        setIsBooking(false);
        return;
      }

      const distanceInMeters = getDistance(location.coords, destination);
      const cost = Math.round(distanceInMeters * 2);
      const address = await getReverseGeocode(destination);
      setDestinationAddress(address);

      const rideData = {
        user_id: user.id,
        user_email: user.email,
        pickup_lat: location.coords.latitude,
        pickup_lng: location.coords.longitude,
        destination_lat: destination.latitude,
        destination_lng: destination.longitude,
        destination_address: address || "Unknown address",
        distance_km: distanceInMeters / 1000,
        price: cost,
        status: "pending",
      };

      const { data, error } = await createRideRequest(rideData);

      if (error) throw error;

      // Update wallet balance and total spent
      let balance = await AsyncStorage.getItem("loggedInUserBalance");
      let spent = await AsyncStorage.getItem("totalSpent");
      balance = parseFloat(balance) || 0;
      spent = parseFloat(spent) || 0;

      const newBalance = balance - cost;
      const newSpent = spent + cost;

      await AsyncStorage.setItem("loggedInUserBalance", newBalance.toString());
      await AsyncStorage.setItem("totalSpent", newSpent.toString());

      setUserBalance(newBalance);
      setTotalSpent(newSpent);

      Alert.alert(
        "Ride Booked",
        `Your ride has been requested! A driver will be with you shortly.`
      );
    } catch (error) {
      console.log("Error booking ride:", error);
      Alert.alert("Error", "Failed to book ride. Please try again.");
    } finally {
      setIsBooking(false);
    }
  };

  const getReverseGeocode = async (coordinate) => {
    try {
      const address = await Location.reverseGeocodeAsync({
        latitude: coordinate.latitude,
        longitude: coordinate.longitude,
      });

      if (address && address.length > 0) {
        const { street, city, region, country } = address[0];
        return `${street}, ${city}, ${region}, ${country}`;
      } else {
        return "Unknown location";
      }
    } catch (error) {
      console.error("Error during reverse geocoding: ", error);
      return "Error fetching address";
    }
  };

  const getDistance = (loc1, loc2) => {
    const R = 6371e3;
    const φ1 = (loc1.latitude * Math.PI) / 180;
    const φ2 = (loc2.latitude * Math.PI) / 180;
    const Δφ = ((loc2.latitude - loc1.latitude) * Math.PI) / 180;
    const Δλ = ((loc2.longitude - loc1.longitude) * Math.PI) / 180;

    const a =
      Math.sin(Δφ / 2) * Math.sin(Δφ / 2) +
      Math.cos(φ1) * Math.cos(φ2) * Math.sin(Δλ / 2) * Math.sin(Δλ / 2);
    const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));

    return R * c;
  };

  // Get current location name
  const [currentLocationName, setCurrentLocationName] = useState("");

  // Update location name when location changes
  useEffect(() => {
    if (location) {
      const getLocationName = async () => {
        try {
          const address = await Location.reverseGeocodeAsync({
            latitude: location.coords.latitude,
            longitude: location.coords.longitude,
          });

          if (address && address.length > 0) {
            const { name, street, city, region, country } = address[0];
            const locationName = [name, street, city, region, country]
              .filter(Boolean)
              .join(", ");
            setCurrentLocationName(locationName);
          }
        } catch (error) {
          console.error("Error getting location name:", error);
        }
      };

      getLocationName();
    }
  }, [location]);

  return (
    <SafeAreaView
      style={{ flex: 1, backgroundColor: "#f9f9f9" }}
      edges={["top"]}
    >
      <StatusBar barStyle="dark-content" />

      <ScrollView
        showsVerticalScrollIndicator={false}
        style={{ flex: 1 }}
        contentContainerStyle={{
          flexGrow: 1,
          paddingHorizontal: 16,
          paddingBottom: 24,
        }}
      >
        <View style={{ flex: 1, gap: 24 }}>
          <View
            style={tailwind.style("flex-row justify-between items-center", {
              marginTop: 25,
            })}
          >
            <Text
              style={tailwind.style({
                fontFamily: "nunitoSansExtraBold",
                fontWeight: 700,
                fontSize: 20,
                lineHeight: 24.55,
                color: "#072F4A",
              })}
            >
              Welcome {userName || "Guest"}
            </Text>

            <View>
              <UserAvatar width={38} height={38} />
            </View>
          </View>

          {/* Balance Card */}
          <View style={tailwind.style("mb-6")}>
            <LinearGradient
              colors={["#193a69", "#1e4985", "#123566"]}
              style={tailwind.style("rounded-2xl p-6")}
              start={{ x: 0, y: 0 }}
              end={{ x: 1, y: 1 }}
            >
              <View
                style={tailwind.style("flex-row justify-between items-start")}
              >
                <View>
                  <Text
                    style={tailwind.style("text-gray-200 text-sm font-medium")}
                  >
                    Available Balance
                  </Text>
                  <View style={tailwind.style("flex-row items-end mt-1")}>
                    <Text
                      style={tailwind.style("text-3xl font-bold text-white")}
                    >
                      ₦{userBalance.toLocaleString("en-NG")}
                    </Text>
                    <Text
                      style={tailwind.style(
                        "text-gray-300 text-base ml-1 mb-1"
                      )}
                    >
                      NGN
                    </Text>
                  </View>
                  <View style={tailwind.style("mt-4")}>
                    <Text style={tailwind.style("text-gray-300 text-sm")}>
                      Total Spent:
                      <Text style={tailwind.style("text-white font-semibold")}>
                        {" "}
                        ₦{totalSpent.toLocaleString("en-NG")}
                      </Text>
                    </Text>
                  </View>
                </View>

                <TouchableOpacity
                  onPress={() => navigation.navigate("wallet")}
                  style={tailwind.style(
                    "bg-white/10 border border-white/20 rounded-xl px-4 py-3 flex-row items-center"
                  )}
                >
                  <PlusIcon width={16} height={16} fill="#fff" />
                  <Text style={tailwind.style("text-white font-semibold ml-2")}>
                    Fund Wallet
                  </Text>
                </TouchableOpacity>
              </View>
            </LinearGradient>
          </View>

          {/* Location Header */}
          <View style={styles.locationHeader}>
            <View style={styles.locationContent}>
              <View style={styles.locationIcon}>
                <MaterialIcons name="location-on" size={20} color="#123566" />
              </View>
              <View>
                <Text style={styles.locationTitle}>Your Location</Text>
                <Text style={styles.locationAddress} numberOfLines={1}>
                  {currentLocationName || "Getting your location..."}
                </Text>
              </View>
            </View>
          </View>

          {/* Map View */}
          <View style={styles.mapCard}>
            <View style={styles.mapContainer}>
              <MapView
                ref={mapRef}
                style={styles.map}
                region={region}
                onRegionChangeComplete={setRegion}
                showsUserLocation={true}
                showsMyLocationButton={false}
                showsBuildings={true}
                showsTraffic={true}
                showsIndoors={true}
                showsCompass={true}
                showsScale={true}
                onMapReady={() => setMapReady(true)}
                onPress={handleMapPress}
                mapType="standard"
                loadingEnabled={true}
                loadingIndicatorColor="#666666"
                loadingBackgroundColor="#eeeeee"
                initialRegion={region}
                customMapStyle={[
                  {
                    featureType: "poi",
                    elementType: "labels",
                    stylers: [{ visibility: "off" }],
                  },
                ]}
              >
                {destination && (
                  <Marker
                    coordinate={{
                      latitude: destination.latitude,
                      longitude: destination.longitude,
                    }}
                    title="Destination"
                    description="Your ride destination"
                  >
                    <View style={styles.destinationMarker}>
                      <View style={styles.markerPin} />
                      <View style={styles.markerPulse} />
                    </View>
                  </Marker>
                )}
              </MapView>

              {/* Custom Location Button */}
              <TouchableOpacity
                style={styles.myLocationButton}
                onPress={async () => {
                  const currentLocation =
                    await Location.getCurrentPositionAsync({});
                  mapRef.current.animateToRegion(
                    {
                      latitude: currentLocation.coords.latitude,
                      longitude: currentLocation.coords.longitude,
                      latitudeDelta: 0.005,
                      longitudeDelta: 0.005,
                    },
                    1000
                  );
                }}
              >
                <MaterialIcons name="my-location" size={20} color="#123566" />
              </TouchableOpacity>
            </View>

            {/* Destination Input */}
            <View style={styles.destinationInputContainer}>
              <MaterialIcons
                name="location-on"
                size={20}
                color="#FF3B30"
                style={styles.destinationIcon}
              />
              <Text style={styles.destinationText}>
                {destination
                  ? "Tap on the map to change destination"
                  : "Tap on the map to set destination"}
              </Text>
            </View>
          </View>

          {destination && (
            <TouchableOpacity
              onPress={bookRide}
              style={[
                styles.rideButton,
                isBooking && styles.rideButtonDisabled,
              ]}
              disabled={isBooking}
            >
              {isBooking ? (
                <ActivityIndicator color="white" />
              ) : (
                <Text style={styles.rideButtonText}>Book Ride</Text>
              )}
            </TouchableOpacity>
          )}
        </View>
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  // Location Header
  locationHeader: {
    paddingHorizontal: 5,
  },
  locationContent: {
    flexDirection: "row",
    alignItems: "center",
  },
  locationIcon: {
    backgroundColor: "#E6F0FF",
    width: 36,
    height: 36,
    borderRadius: 18,
    justifyContent: "center",
    alignItems: "center",
    marginRight: 12,
  },
  locationTitle: {
    fontSize: 12,
    color: "#666",
    marginBottom: 2,
  },
  locationAddress: {
    fontSize: 15,
    fontWeight: "500",
    color: "#000",
  },

  // Map Styles
  mapCard: {
    backgroundColor: "#fff",
    borderRadius: 16,
    overflow: "hidden",
  },
  mapContainer: {
    height: Dimensions.get("window").height * 0.6,
    width: "100%",
    position: "relative",
  },
  map: {
    ...StyleSheet.absoluteFillObject,
  },
  // Marker Styles
  destinationMarker: {
    alignItems: "center",
    justifyContent: "center",
  },
  markerPin: {
    width: 20,
    height: 20,
    borderRadius: 10,
    backgroundColor: "#FF3B30",
    borderWidth: 2,
    borderColor: "white",
  },
  markerPulse: {
    position: "absolute",
    width: 30,
    height: 30,
    borderRadius: 15,
    backgroundColor: "rgba(255, 59, 48, 0.3)",
  },
  // Location Button
  myLocationButton: {
    position: "absolute",
    bottom: 20,
    right: 16,
    backgroundColor: "white",
    width: 44,
    height: 44,
    borderRadius: 22,
    alignItems: "center",
    justifyContent: "center",
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.2,
    shadowRadius: 4,
    elevation: 3,
  },
  // Destination Input
  destinationInputContainer: {
    flexDirection: "row",
    alignItems: "center",
    padding: 16,
    borderTopWidth: 1,
    borderTopColor: "#f0f0f0",
  },
  destinationIcon: {
    marginRight: 12,
  },
  destinationText: {
    flex: 1,
    color: "#555",
    fontSize: 14,
  },
  errorBanner: {
    position: "absolute",
    top: 10,
    left: 10,
    right: 10,
    backgroundColor: "rgba(220, 38, 38, 0.9)",
    padding: 10,
    borderRadius: 5,
    zIndex: 1000,
  },
  errorText: {
    color: "white",
    textAlign: "center",
    fontSize: 14,
  },
  rideButton: {
    backgroundColor: "#123566",
    paddingVertical: 15,
    paddingHorizontal: 30,
    borderRadius: 30,
    alignItems: "center",
    marginBottom: 20,
    flexDirection: "row",
    justifyContent: "center",
    minHeight: 54,
    color: "#fff",
  },
  rideButtonText: {
    color: "#fff",
    fontWeight: "600",
    fontSize: 16,
  },
  rideButtonDisabled: {
    opacity: 0.7,
  },
});
