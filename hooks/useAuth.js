import AsyncStorage from "@react-native-async-storage/async-storage";
import * as Linking from "expo-linking";
import { router } from "expo-router";
import { createContext, useContext, useEffect, useState } from "react";
import { supabase } from "../lib/supabase";

const AuthContext = createContext({});

export function AuthProvider({ children }) {
  const [user, setUser] = useState(null);
  const [session, setSession] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    // Check active sessions on initial load
    const {
      data: { subscription: authSubscription },
    } = supabase.auth.onAuthStateChange(async (event, session) => {
      setSession(session);
      setUser(session?.user ?? null);
      setLoading(false);
    });

    // Set up deep linking for email verification
    const handleDeepLink = (event) => {
      const url = event?.url || event;
      if (!url) return;

      // Extract the access token from the URL
      const params = new URLSearchParams(url.split("#")[1]);
      const accessToken = params.get("access_token");
      const refreshToken = params.get("refresh_token");
      const tokenType = params.get("token_type");
      const expiresIn = params.get("expires_in");

      if (accessToken && refreshToken) {
        supabase.auth.setSession({
          access_token: accessToken,
          refresh_token: refreshToken,
          token_type: tokenType,
          expires_in: parseInt(expiresIn),
        });
      }
    };

    // Listen for deep links when the app is opened from a link
    const deepLinkSubscription = Linking.addEventListener(
      "url",
      handleDeepLink
    );

    // Handle the case when the app is opened from a link
    Linking.getInitialURL().then((url) => {
      if (url) handleDeepLink({ url });
    });

    return () => {
      deepLinkSubscription?.remove();
      authSubscription?.unsubscribe();
    };
  }, []);

  useEffect(() => {
    const {
      data: { subscription },
    } = supabase.auth.onAuthStateChange(async (event, session) => {
      if (session) {
        await AsyncStorage.setItem(
          "supabase.auth.token",
          JSON.stringify(session)
        );
        setSession(session);
        setUser(session.user);
        router.replace("/authenticated");
      } else {
        setSession(null);
        setUser(null);
        router.replace("/auth");
      }
    });

    // Check for existing session
    const loadSession = async () => {
      const sessionStr = await AsyncStorage.getItem("supabase.auth.token");
      if (sessionStr) {
        const session = JSON.parse(sessionStr);
        setSession(session);
        setUser(session?.user || null);
      }
    };

    loadSession();

    return () => {
      subscription?.unsubscribe();
    };
  }, []);

  // Sign up with email and password
  const signUp = async ({ email, password, fullName, phoneNumber }) => {
    try {
      const { data, error } = await supabase.auth.signUp({
        email,
        password,
        options: {
          data: {
            full_name: fullName,
            phone_number: phoneNumber,
          },
          // Make sure to set a proper redirect URL
          emailRedirectTo: `${process.env.EXPO_PUBLIC_APP_URL || "yourapp://"}`,
        },
      });

      if (error) throw error;

      // If you're using a users table, insert the user data
      const { error: profileError } = await supabase.from("users").insert([
        {
          id: data.user.id,
          email,
          full_name: fullName,
          phone_number: phoneNumber,
          created_at: new Date().toISOString(),
        },
      ]);

      if (profileError) throw profileError;

      return { data, error: null };
    } catch (error) {
      console.log("Signup error:", error);
      return { data: null, error };
    }
  };

  // Sign in with email and password
  const signIn = async (email, password) => {
    try {
      const { data, error } = await supabase.auth.signInWithPassword({
        email,
        password,
      });
      if (error) throw error;
      if (data?.session) {
        await AsyncStorage.setItem(
          "supabase.auth.token",
          JSON.stringify(data.session)
        );

        router.replace("/authenticated");
      }
      return { data, error: null };
    } catch (error) {
      console.log("Sign in error:", error);
      return { data: null, error };
    }
  };

  // Sign out
  const signOut = async () => {
    try {
      const { error } = await supabase.auth.signOut();
      if (error) throw error;

      // Clear the stored session
      await AsyncStorage.removeItem("supabase.auth.token");

      setUser(null);
      setSession(null);
      return { error: null };
    } catch (error) {
      console.error("Sign out error:", error);
      return { error };
    }
  };

  // Reset password
  const resetPassword = async (email) => {
    try {
      const { error } = await supabase.auth.resetPasswordForEmail(email, {
        redirectTo: Linking.createURL("/auth/reset-password"),
      });

      if (error) throw error;

      return { error: null };
    } catch (error) {
      console.error("Password reset error:", error);
      return { error };
    }
  };

  // Update password
  const updatePassword = async (newPassword) => {
    try {
      const { error } = await supabase.auth.updateUser({
        password: newPassword,
      });
      if (error) throw error;
      return { error: null };
    } catch (error) {
      return { error };
    }
  };

  return (
    <AuthContext.Provider
      value={{
        user,
        session,
        loading,
        signUp,
        signIn,
        signOut,
        resetPassword,
        updatePassword,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error("useAuth must be used within an AuthProvider");
  }
  return context;
}

export default useAuth;
