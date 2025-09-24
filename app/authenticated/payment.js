import { MaterialIcons } from "@expo/vector-icons";
import { useFocusEffect } from "@react-navigation/native";
import { useRouter } from "expo-router";
import { useCallback, useEffect, useState } from "react";
import {
  ActivityIndicator,
  Alert,
  RefreshControl,
  ScrollView,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import tailwind from "twrnc";
import {
  cancelRideRequest,
  getRideRequests,
} from "../../lib/services/rideService";
import { supabase } from "../../lib/supabase";

export default function Payment() {
  const [bookings, setBookings] = useState([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [user, setUser] = useState(null);
  const router = useRouter();

  const fetchBookings = async (userId) => {
    try {
      setRefreshing(true);
      const { data, error } = await getRideRequests(userId);
      if (error) throw error;
      setBookings(data || []);
    } catch (error) {
      console.error("Error fetching bookings:", error);
      Alert.alert("Error", "Failed to load rides. Please try again.");
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  // Fetch data on initial load and when screen comes into focus
  useFocusEffect(
    useCallback(() => {
      const fetchUserAndBookings = async () => {
        try {
          const {
            data: { user },
          } = await supabase.auth.getUser();
          if (!user) {
            router.push("/auth");
            return;
          }
          setUser(user);
          await fetchBookings(user.id);
        } catch (error) {
          console.error("Error:", error);
          setLoading(false);
        }
      };

      fetchUserAndBookings();

      // Set up interval to refresh data every 15 seconds
      const intervalId = setInterval(() => {
        if (user?.id) {
          fetchBookings(user.id);
        }
      }, 15000); // 15 seconds

      // Clean up interval on unmount
      return () => clearInterval(intervalId);
    }, [user?.id])
  );

  // Handle manual refresh
  const onRefresh = useCallback(() => {
    if (user?.id) {
      fetchBookings(user.id);
    }
  }, [user?.id]);

  // Fetch user session and bookings
  useEffect(() => {
    const fetchData = async () => {
      try {
        // Get current user session
        const {
          data: { user },
        } = await supabase.auth.getUser();
        if (!user) {
          router.push("/auth");
          return;
        }
        setUser(user);

        // Subscribe to real-time updates
        const subscription = supabase
          .channel("rides")
          .on(
            "postgres_changes",
            {
              event: "*",
              schema: "public",
              table: "rides",
              filter: `user_id=eq.${user.id}`,
            },
            (payload) => {
              fetchBookings(user.id);
            }
          )
          .subscribe();

        // Initial fetch
        await fetchBookings(user.id);

        return () => {
          subscription.unsubscribe();
        };
      } catch (error) {
        console.error("Error fetching data:", error);
        Alert.alert("Error", "Failed to load bookings");
      } finally {
        setLoading(false);
      }
    };

    fetchData();
  }, []);

  // Handle cancel ride
  const handleCancelRide = async (rideId) => {
    if (!user) return;

    try {
      const { error } = await cancelRideRequest(rideId, user.id);
      if (error) throw error;

      Alert.alert("Success", "Ride has been cancelled");
      fetchBookings(user.id);
    } catch (error) {
      console.error("Error cancelling ride:", error);
      Alert.alert("Error", "Failed to cancel ride");
    }
  };

  // Loading state
  if (loading) {
    return (
      <View style={[styles.container, styles.centered]}>
        <ActivityIndicator size="large" color="#123566" />
      </View>
    );
  }

  const getStatusColor = (status) => {
    switch (status) {
      case "accepted":
        return "bg-blue-100 text-blue-800";
      case "in_progress":
        return "bg-yellow-100 text-yellow-800";
      case "completed":
        return "bg-green-100 text-green-800";
      case "cancelled":
        return "bg-red-100 text-red-800";
      default:
        return "bg-gray-100 text-gray-800";
    }
  };

  if (loading) {
    return (
      <View style={styles.container}>
        <Text>Loading...</Text>
      </View>
    );
  }

  return (
    <SafeAreaView style={{ flex: 1 }}>
      <View style={styles.container}>
        <View style={styles.header}>
          <Text style={tailwind.style("text-2xl font-bold")}>My Rides</Text>
        </View>

        <ScrollView
          ccontentContainerStyle={styles.scrollContainer}
          refreshControl={
            <RefreshControl
              refreshing={refreshing}
              onRefresh={onRefresh}
              colors={["#123566"]}
              tintColor="#123566"
            />
          }
        >
          {bookings.length === 0 ? (
            <View style={styles.emptyState}>
              <MaterialIcons name="directions-car" size={48} color="#9CA3AF" />
              <Text style={styles.emptyText}>No rides yet</Text>
              <Text style={styles.emptySubtext}>
                Your ride history will appear here
              </Text>
            </View>
          ) : (
            bookings.map((booking) => (
              <View key={booking.id} style={styles.bookingCard}>
                <View style={styles.bookingHeader}>
                  <Text style={styles.bookingTitle}>
                    Ride to {booking.destination_address.split(",")[0]}
                  </Text>
                  <View
                    style={[
                      styles.statusBadge,
                      tailwind.style(getStatusColor(booking.status)),
                    ]}
                  >
                    <Text style={styles.statusText}>
                      {booking.status.replace("_", " ").toUpperCase()}
                    </Text>
                  </View>
                </View>

                <View style={styles.detailRow}>
                  <MaterialIcons name="location-on" size={16} color="#4B5563" />
                  <Text style={styles.detailText}>
                    {booking.destination_address}
                  </Text>
                </View>

                <View style={styles.detailRow}>
                  <MaterialIcons
                    name="directions-car"
                    size={16}
                    color="#4B5563"
                  />
                  <Text style={styles.detailText}>
                    {(booking.distance_km || 0).toFixed(2)} km
                  </Text>
                </View>

                <View style={styles.detailRow}>
                  <MaterialIcons
                    name="attach-money"
                    size={16}
                    color="#4B5563"
                  />
                  <Text style={styles.detailText}>
                    ₦{booking.price?.toFixed(2) || "0.00"}
                  </Text>
                </View>

                <View style={styles.detailRow}>
                  <MaterialIcons name="access-time" size={16} color="#4B5563" />
                  <Text style={styles.detailText}>
                    {new Date(booking.created_at).toLocaleString()}
                  </Text>
                </View>

                {booking.status === "pending" && (
                  <TouchableOpacity
                    style={styles.cancelButton}
                    onPress={() => handleCancelRide(booking.id)}
                  >
                    <Text style={styles.cancelButtonText}>Cancel Ride</Text>
                  </TouchableOpacity>
                )}
              </View>
            ))
          )}
        </ScrollView>
      </View>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: "#F9FAFB",
  },
  centered: {
    justifyContent: "center",
    alignItems: "center",
  },
  header: {
    padding: 20,
    backgroundColor: "white",
    borderBottomWidth: 1,
    borderBottomColor: "#E5E7EB",
  },
  scrollContainer: {
    padding: 16,
  },
  emptyState: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
    padding: 40,
  },
  emptyText: {
    marginTop: 16,
    fontSize: 18,
    fontWeight: "600",
    color: "#374151",
  },
  emptySubtext: {
    marginTop: 8,
    color: "#6B7280",
    textAlign: "center",
  },
  bookingCard: {
    backgroundColor: "white",
    borderRadius: 14,
    marginTop: 16,
    marginHorizontal: 16,
    padding: 16,
    borderWidth: 2,
    borderColor: "#dcdcdc50",
  },
  bookingHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    marginBottom: 12,
  },
  bookingTitle: {
    fontSize: 18,
    fontWeight: "600",
    flex: 1,
    marginRight: 8,
  },
  statusBadge: {
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 12,
    alignSelf: "flex-start",
  },
  statusText: {
    fontSize: 12,
    fontWeight: "600",
    textTransform: "capitalize",
  },
  detailRow: {
    flexDirection: "row",
    alignItems: "center",
    marginTop: 8,
  },
  detailText: {
    marginLeft: 8,
    color: "#4B5563",
  },
  cancelButton: {
    marginTop: 16,
    padding: 12,
    backgroundColor: "#FEE2E2",
    borderRadius: 8,
    alignItems: "center",
  },
  cancelButtonText: {
    color: "#DC2626",
    fontWeight: "600",
  },
});
