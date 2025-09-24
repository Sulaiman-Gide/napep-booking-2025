import { supabase } from "../supabase";

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

// Subscribe to ride updates
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
