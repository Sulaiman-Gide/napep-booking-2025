import { MaterialCommunityIcons } from "@expo/vector-icons";
import Ionicons from "@expo/vector-icons/Ionicons";
import { router } from "expo-router";
import { useState } from "react";
import {
  ActivityIndicator,
  Alert,
  Image,
  Keyboard,
  StatusBar,
  Text,
  TextInput,
  TouchableOpacity,
  TouchableWithoutFeedback,
  useColorScheme,
  View,
} from "react-native";
import tw from "twrnc";

import { COLORS } from "../../constants/theme";
import useAuth from "../../hooks/useAuth";

export default function Login() {
  const colorScheme = useColorScheme();
  const [loading, setLoading] = useState(false);
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const { signIn } = useAuth();

  const toggleShowPassword = () => {
    setShowPassword(!showPassword);
  };

  const isFormValid = () => {
    return email && password;
  };

  const handleLoginAccount = async () => {
    setLoading(true);
    const { error } = await signIn(email, password);
    setLoading(false);
    if (error) {
      Alert.alert(
        "Login Error",
        error.message || "Invalid email or password. Please try again."
      );
    } else {
      router.replace("/authenticated/dashboard");
    }
  };

  return (
    <TouchableWithoutFeedback onPress={Keyboard.dismiss}>
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
        />
        <TouchableOpacity
          style={tw.style("", { position: "absolute", top: 55, left: 20 })}
          onPress={() => router.push("/auth")}
        >
          <Ionicons name="arrow-back-sharp" size={27} color="white" />
        </TouchableOpacity>
        <View
          style={tw.style("w-full rounded-t-[20px] bg-white flex-1 pt-8", {
            flex: 1,
            paddingHorizontal: 16,
            gap: 32,
          })}
        >
          <View style={{ gap: 4 }}>
            <Text
              style={tw.style({
                lineHeight: 24,
                fontSize: 20,
                fontWeight: 700,
                color: COLORS.title,
              })}
            >
              Driver Login
            </Text>
            <Text
              style={tw.style({ color: "#aaa", fontSize: 14, fontWeight: 400 })}
            >
              Please fill in the details below to login into your driver
              profile.
            </Text>
          </View>

          <View style={{ gap: 18 }}>
            <TextInput
              style={tw.style({
                backgroundColor: "#f9fafb",
                borderRadius: 12,
                paddingTop: 14,
                paddingBottom: 16,
                paddingHorizontal: 12,
                fontSize: 12,
              })}
              placeholder="Enter your email"
              onChangeText={(text) =>
                setEmail(text.charAt(0).toLowerCase() + text.slice(1))
              }
              keyboardType="email-address"
              placeholderTextColor="#aaa"
              underlineColorAndroid="transparent"
              autoCapitalize="none"
            />

            <View
              style={tw.style("flex-row justify-between items-center", {
                backgroundColor: "#f9fafb",
                borderRadius: 12,
                paddingTop: 14,
                paddingBottom: 16,
                paddingHorizontal: 12,
              })}
            >
              <TextInput
                style={tw.style("flex-1 h-full mb-1", {
                  backgroundColor: "transparent",
                  fontSize: 12,
                })}
                secureTextEntry={!showPassword}
                value={password}
                onChangeText={setPassword}
                placeholder="Password"
                placeholderTextColor="#aaa"
                underlineColorAndroid="transparent"
              />
              <MaterialCommunityIcons
                name={showPassword ? "eye-off" : "eye"}
                size={20}
                color="#aaa"
                onPress={toggleShowPassword}
              />
            </View>
          </View>

          <View style={tw.style("flex-1")}>
            <View style={tw.style("w-full")}>
              <TouchableOpacity
                style={tw.style("w-full rounded-2xl", {
                  backgroundColor: COLORS.title,
                  paddingVertical: 16,
                  borderRadius: 100,
                })}
                onPress={handleLoginAccount}
                disabled={!isFormValid() || loading}
              >
                {loading ? (
                  <ActivityIndicator size={20} color="#FFF" />
                ) : (
                  <Text
                    style={tw.style("font-semibold text-center", {
                      color: "white",
                      letterSpacing: 0.8,
                    })}
                  >
                    Sign In
                  </Text>
                )}
              </TouchableOpacity>
            </View>
            <View style={{ flex: 1 }} />
            <TouchableOpacity
              onPress={() => router.push("/auth/signup")}
              style={tw.style(
                "w-full px-6 justify-center items-center gap-2 pb-12"
              )}
            >
              <Text
                style={tw.style("text-center mr-2", {
                  color: "#aaa",
                  letterSpacing: 0.6,
                  fontSize: 14,
                })}
              >
                Developed by: Shamwilu Umar
              </Text>
              <Text
                style={tw.style("text-center", {
                  color: COLORS.title,
                  fontSize: 14,
                })}
              >
                All rights reseved
              </Text>
            </TouchableOpacity>
          </View>
        </View>
      </View>
    </TouchableWithoutFeedback>
  );
}
