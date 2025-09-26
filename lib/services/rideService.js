// Complete a ride and deduct the ride price from the user's wallet in the database
export const completeRide = async (rideId, driverId) => {
  try {
    // 1. Get the ride info (to get user_id and price)
    const { data: rideData, error: rideError } = await supabase
      .from("rides")
      .select("id, user_id, price")
      .eq("id", rideId)
      .single();

    console.log("[completeRide] rideData:", rideData, "rideError:", rideError);
    if (rideError) throw rideError;
    if (!rideData) throw new Error("Ride not found");

    // 2. Deduct the price from the user's wallet_balance using the RPC
    const { data: rpcResult, error: walletError } = await supabase.rpc(
      "decrement_wallet",
      {
        user_id: rideData.user_id,
        amount: rideData.price,
      }
    );
    console.log(
      "[completeRide] RPC result:",
      rpcResult,
      "walletError:",
      walletError
    );
    if (walletError) throw walletError;

    // 3. Mark the ride as completed
    const { data, error } = await supabase
      .from("rides")
      .update({
        status: "completed",
        driver_id: driverId,
        completed_at: new Date().toISOString(),
      })
      .eq("id", rideId)
      .eq("driver_id", driverId)
      .eq("status", "accepted")
      .select();

    console.log("[completeRide] ride update result:", data, "error:", error);
    if (error) throw error;
    return { data, error: null };
  } catch (error) {
    console.error("Error completing ride:", error);
    return { data: null, error };
  }
};
import { supabase } from "../supabase";

export const getAvailableRides = async ({
  latitude,
  longitude,
  radius = 10,
}) => {
  try {
    const { data, error } = await supabase
      .from("rides")
      .select("*")
      .eq("status", "pending")
      .order("created_at", { ascending: false });

    if (error) {
      console.error("Error fetching available rides:", error);
      throw error;
    }

    return { data, error: null };
  } catch (error) {
    console.error("Error fetching available rides:", error);
    return { data: null, error };
  }
};

// Helper function to calculate distance between two points in meters
function getDistance(coord1, coord2) {
  const R = 6371e3; // Earth's radius in meters
  const φ1 = (coord1.latitude * Math.PI) / 180;
  const φ2 = (coord2.latitude * Math.PI) / 180;
  const Δφ = ((coord2.latitude - coord1.latitude) * Math.PI) / 180;
  const Δλ = ((coord2.longitude - coord1.longitude) * Math.PI) / 180;

  const a =
    Math.sin(Δφ / 2) * Math.sin(Δφ / 2) +
    Math.cos(φ1) * Math.cos(φ2) * Math.sin(Δλ / 2) * Math.sin(Δλ / 2);
  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));

  return R * c; // Distance in meters
}

export const createRideRequest = async (rideData) => {
  try {
    const { data, error } = await supabase
      .from("rides")
      .insert([rideData])
      .select();

    if (error) throw error;
    return { data, error: null };
  } catch (error) {
    console.error("Error creating ride request:", error);
    return { data: null, error };
  }
};

export const getRideRequests = async (userId) => {
  try {
    const { data, error } = await supabase
      .from("rides")
      .select("*")
      .eq("user_id", userId)
      .order("created_at", { ascending: false });

    if (error) throw error;
    return { data, error: null };
  } catch (error) {
    console.error("Error fetching ride requests:", error);
    return { data: null, error };
  }
};

export const cancelRideRequest = async (rideId, userId) => {
  try {
    const { data, error } = await supabase
      .from("rides")
      .update({ status: "cancelled" })
      .eq("id", rideId)
      .eq("user_id", userId)
      .eq("status", "pending")
      .select();

    if (error) throw error;
    return { data, error: null };
  } catch (error) {
    console.error("Error cancelling ride request:", error);
    return { data: null, error };
  }
};

export const subscribeToRideUpdates = (userId, callback) => {
  return supabase
    .channel("rides")
    .on(
      "postgres_changes",
      {
        event: "*",
        schema: "public",
        table: "rides",
        filter: `user_id=eq.${userId}`,
      },
      (payload) => {
        callback(payload);
      }
    )
    .subscribe();
};

export const acceptRide = async (rideId, driverId) => {
  try {
    const { data, error } = await supabase
      .from("rides")
      .update({
        status: "accepted",
        driver_id: driverId,
        accepted_at: new Date().toISOString(),
      })
      .eq("id", rideId)
      .eq("status", "pending")
      .select();

    if (error) throw error;
    return { data, error: null };
  } catch (error) {
    console.error("Error accepting ride:", error);
    return { data: null, error };
  }
};
