import React, { useState } from "react";
import {
  View,
  Text,
  TouchableWithoutFeedback,
  Keyboard,
  ActivityIndicator,
  Image,
  TextInput,
  TouchableOpacity,
  Alert,
  StatusBar,
  useColorScheme,
  Platform,
  KeyboardAvoidingView,
  ScrollView,
} from "react-native";
import { router } from "expo-router";
import tw from "twrnc";
import { COLORS } from "../../constants/theme";
import Ionicons from "@expo/vector-icons/Ionicons";
import { useAuth } from "../../hooks/useAuth";
import AsyncStorage from "@react-native-async-storage/async-storage";

export default function ResetPassword() {
  const colorScheme = useColorScheme();
  const [email, setEmail] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const { resetPassword } = useAuth();

  const handleResetPassword = async () => {
    if (!email) {
      Alert.alert("Please enter your email address");
      return;
    }

    setIsLoading(true);
    
    try {
      const { error } = await resetPassword(email);
      
      if (error) {
        throw error;
      }
      
      Alert.alert(
        "Check your email",
        `We've sent a password reset link to ${email}. Please check your inbox and follow the instructions to reset your password.`
      );
      
      // Navigate back to login after a short delay
      setTimeout(() => {
        router.push("/auth/login");
      }, 2000);
      
    } catch (error) {
      console.error('Password reset error:', error);
      Alert.alert(
        'Error',
        error.message || 'An error occurred while sending the password reset email.'
      );
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <KeyboardAvoidingView
      behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
      style={{ flex: 1 }}
    >
      <TouchableWithoutFeedback onPress={Keyboard.dismiss}>
        <ScrollView contentContainerStyle={{ flexGrow: 1 }}>
          <View
            style={{
              flex: 1,
              alignItems: "center",
              backgroundColor: "#003b6f",
              padding: 0,
            }}
          >
            <StatusBar
              barStyle={colorScheme === "dark" ? "light-content" : "light-content"}
            />
            <Image
              source={require("../../assets/images/background.jpg")}
              style={tw.style("w-full", { flex: 0.35 })}
              resizeMode="cover"
            />
            <TouchableOpacity
              style={tw.style("", { position: "absolute", top: 55, left: 20 })}
              onPress={() => router.back()}
            >
              <Ionicons name="arrow-back-sharp" size={27} color="white" />
            </TouchableOpacity>
            
            <View
              style={tw.style("w-full rounded-t-[20px] bg-white flex-1 pt-8 px-6", {
                flex: 1,
                gap: 32,
              })}
            >
              <View style={{ gap: 16 }}>
                <Text
                  style={tw.style({
                    lineHeight: 24,
                    fontSize: 20,
                    fontWeight: 700,
                    color: COLORS.title,
                  })}
                >
                  Reset Password
                </Text>
                <Text
                  style={tw.style({ color: "#aaa", fontSize: 14, fontWeight: 400 })}
                >
                  Enter your email address and we'll send you a link to reset your password.
                </Text>
              </View>

              <View style={{ gap: 24 }}>
                <View>
                  <Text style={tw.style("text-gray-600 text-sm mb-1")}>Email Address</Text>
                  <TextInput
                    style={tw.style(
                      "border border-gray-200 rounded-lg px-4 py-3 text-base w-full"
                    )}
                    placeholder="Enter your email"
                    placeholderTextColor="#999"
                    value={email}
                    onChangeText={setEmail}
                    keyboardType="email-address"
                    autoCapitalize="none"
                    autoComplete="email"
                    autoCorrect={false}
                  />
                </View>

                <TouchableOpacity
                  style={tw.style("w-full rounded-2xl", {
                    backgroundColor: email ? COLORS.title : '#cccccc',
                    paddingVertical: 16,
                    opacity: email ? 1 : 0.7,
                  })}
                  onPress={handleResetPassword}
                  disabled={!email || isLoading}
                >
                  {isLoading ? (
                    <ActivityIndicator size={20} color="#FFF" />
                  ) : (
                    <Text
                      style={tw.style("font-semibold text-center", {
                        color: "white",
                        letterSpacing: 0.8,
                      })}
                    >
                      Send Reset Link
                    </Text>
                  )}
                </TouchableOpacity>
              </View>

              <View style={tw.style("flex-row justify-center items-center mt-4")}>
                <Text style={tw.style("text-gray-500 mr-1")}>
                  Remember your password?
                </Text>
                <TouchableOpacity onPress={() => router.push("/auth/login")}>
                  <Text style={tw.style("text-blue-500 font-semibold")}>
                    Sign In
                  </Text>
                </TouchableOpacity>
              </View>
            </View>
          </View>
        </ScrollView>
      </TouchableWithoutFeedback>
    </KeyboardAvoidingView>
  );
}
