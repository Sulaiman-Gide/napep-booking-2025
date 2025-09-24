import { MaterialCommunityIcons } from "@expo/vector-icons";
import Ionicons from "@expo/vector-icons/Ionicons";
import AsyncStorage from "@react-native-async-storage/async-storage";
import { router } from "expo-router";
import { useState } from "react";
import {
  ActivityIndicator,
  Alert,
  Image,
  Keyboard,
  KeyboardAvoidingView,
  Platform,
  ScrollView,
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
import { useAuth } from "../../hooks/useAuth";

export default function Login() {
  const colorScheme = useColorScheme();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const { signIn } = useAuth();

  const toggleShowPassword = () => {
    setShowPassword(!showPassword);
  };

  const isFormValid = () => {
    return email && password;
  };

  const handleLoginAccount = async () => {
    if (!isFormValid()) {
      Alert.alert("Please fill all fields correctly!");
      return;
    }

    setIsLoading(true);

    try {
      const { data, error } = await signIn(email, password);

      if (error) {
        throw error;
      }

      // Store user data in AsyncStorage
      if (data?.user) {
        await AsyncStorage.setItem("loggedInUserEmail", data.user.email);
        const name =
          data.user.user_metadata?.full_name || data.user.email.split("@")[0];
        await AsyncStorage.setItem("loggedInUserName", name);
      }
    } catch (error) {
      console.log("Login error:", error);
      Alert.alert(
        "Login Error",
        error.message || "An error occurred while logging in."
      );
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <KeyboardAvoidingView
      behavior={Platform.OS === "ios" ? "padding" : "height"}
      style={{ flex: 1 }}
    >
      <TouchableWithoutFeedback onPress={Keyboard.dismiss}>
        <ScrollView contentContainerStyle={{ flexGrow: 1 }}>
          <StatusBar
            barStyle={
              colorScheme === "dark" ? "light-content" : "light-content"
            }
          />
          <View
            style={{
              flex: 1,
              alignItems: "center",
              backgroundColor: "#003b6f",
              padding: 0,
              position: "relative",
            }}
          >
            <Image
              source={require("../../assets/images/background.jpg")}
              style={tw.style("w-full", { height: "35%" })}
              resizeMode="cover"
            />
            <TouchableOpacity
              style={tw.style("", { position: "absolute", top: 55, left: 20 })}
              onPress={() => router.push("/auth")}
            >
              <Ionicons name="arrow-back-sharp" size={27} color="white" />
            </TouchableOpacity>
            <View
              style={tw.style("w-full rounded-t-[20px] bg-white h-[65%] pt-8", {
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
                  Welcome Back!
                </Text>
                <Text
                  style={tw.style({
                    color: "#aaa",
                    fontSize: 14,
                    fontWeight: 400,
                  })}
                >
                  Please fill in the details below to login into your profile.
                </Text>
              </View>

              <View style={{ gap: 18 }}>
                <TextInput
                  style={tw.style({
                    backgroundColor: "#f9fafb",
                    borderRadius: 12,
                    paddingTop: 12,
                    paddingBottom: 14,
                    paddingHorizontal: 16,
                    fontSize: 14,
                  })}
                  placeholder="Enter your email"
                  value={email}
                  onChangeText={setEmail}
                  keyboardType="email-address"
                  autoCapitalize="none"
                  autoComplete="email"
                  placeholderTextColor="#aaa"
                  underlineColorAndroid="transparent"
                />

                <View
                  style={tw.style("flex-row justify-between items-center", {
                    backgroundColor: "#f9fafb",
                    borderRadius: 12,
                    paddingTop: 12,
                    paddingBottom: 14,
                    paddingHorizontal: 16,
                  })}
                >
                  <TextInput
                    style={tw.style("flex-1 h-full mb-1", {
                      backgroundColor: "transparent",
                      fontSize: 14,
                    })}
                    secureTextEntry={!showPassword}
                    value={password}
                    onChangeText={setPassword}
                    placeholder="Password"
                    placeholderTextColor="#aaa"
                    autoCapitalize="none"
                    autoComplete="password"
                    underlineColorAndroid="transparent"
                    returnKeyType="go"
                    onSubmitEditing={handleLoginAccount}
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
                      backgroundColor: isFormValid() ? COLORS.title : "#cccccc",
                      paddingVertical: 16,
                      borderRadius: 100,
                      opacity: isFormValid() ? 1 : 0.7,
                    })}
                    onPress={handleLoginAccount}
                    disabled={!isFormValid() || isLoading}
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
                        Sign In
                      </Text>
                    )}
                  </TouchableOpacity>
                </View>
                <TouchableOpacity
                  onPress={() => router.push("/auth/resetPassword")}
                  style={tw.style("mt-4")}
                >
                  <Text style={tw.style("text-center text-blue-500")}>
                    Forgot Password?
                  </Text>
                </TouchableOpacity>
              </View>

              <View
                style={tw.style(
                  "w-full px-6 flex-row justify-center items-start py-10"
                )}
              >
                <Text style={tw.style("text-center mr-2 text-gray-500")}>
                  Don't have an account?
                </Text>
                <TouchableOpacity onPress={() => router.push("/auth/signup")}>
                  <Text style={tw.style("text-blue-500 font-semibold")}>
                    Sign Up
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
