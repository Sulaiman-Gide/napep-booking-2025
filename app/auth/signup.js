import { MaterialCommunityIcons } from "@expo/vector-icons";
import Ionicons from "@expo/vector-icons/Ionicons";
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

export default function CreateAccount() {
  const colorScheme = useColorScheme();
  const [fullName, setFullName] = useState("");
  const [email, setEmail] = useState("");
  const [phoneNumber, setPhoneNumber] = useState("");
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const auth = useAuth();

  const toggleShowPassword = () => {
    setShowPassword(!showPassword);
  };

  const toggleShowConfirmPassword = () => {
    setShowConfirmPassword(!showConfirmPassword);
  };

  const validatePhoneNumber = (phone) => {
    const phoneRegex = /^\+?[\d\s-]{10,}$/;
    return phoneRegex.test(phone);
  };

  const validateForm = (showAlerts = false) => {
    // Validate phone number
    const phoneRegex = /^\+?[\d\s-]{10,}$/;
    if (!phoneNumber || !phoneRegex.test(phoneNumber)) {
      if (showAlerts) {
        Alert.alert("Error", "Please enter a valid phone number");
      }
      return false;
    }

    // Validate password match
    if (password !== confirmPassword) {
      if (showAlerts) {
        Alert.alert("Error", "Passwords don't match!");
      }
      return false;
    }

    // Check all required fields
    if (!fullName || !email || !password || !confirmPassword || !phoneNumber) {
      if (showAlerts) {
        Alert.alert("Error", "Please fill in all required fields");
      }
      return false;
    }

    return true;
  };

  const handleCreateAccount = async () => {
    if (!validateForm(true)) {
      // Pass true to show alerts only on form submission
      return;
    }

    if (!email || !password || !fullName || !phoneNumber) {
      Alert.alert("All fields are required!");
      return;
    }
    console.log({ email, password, fullName, phoneNumber });

    setIsLoading(true);

    try {
      const { error } = await auth.signUp({
        email,
        password,
        fullName,
        phoneNumber,
      });

      if (error) {
        console.log("Signup error details:", error);
        throw error;
      }

      Alert.alert(
        "Check your email!",
        "We've sent you a confirmation email. Please verify your email to continue."
      );

      // Navigate to login after a short delay
      setTimeout(() => {
        router.push("/auth/login");
      }, 2000);
    } catch (error) {
      console.error("Signup error:", error);
      Alert.alert(
        "Signup Error",
        error.message || "An error occurred during signup. Please try again."
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
            }}
          >
            <Image
              source={require("../../assets/images/background.jpg")}
              style={tw.style("w-full", { height: "25%" })}
              resizeMode="cover"
            />
            <TouchableOpacity
              style={tw.style("", { position: "absolute", top: 55, left: 20 })}
              onPress={() => router.back()}
            >
              <Ionicons name="arrow-back-sharp" size={27} color="white" />
            </TouchableOpacity>
            <View
              style={tw.style(
                "w-full rounded-t-[20px] bg-white h-[75%] pt-8 px-6",
                {
                  flex: 1,
                  gap: 24,
                }
              )}
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
                  Welcome! Let's create your account.
                </Text>
                <Text
                  style={tw.style({
                    color: "#aaa",
                    fontSize: 14,
                    fontWeight: 400,
                  })}
                >
                  Please fill in the details below to get started with your new
                  profile.
                </Text>
              </View>

              <View style={{ gap: 16 }}>
                <TextInput
                  style={tw.style({
                    backgroundColor: "#f9fafb",
                    borderRadius: 12,
                    paddingVertical: 14,
                    paddingHorizontal: 16,
                    fontSize: 14,
                  })}
                  placeholder="Full name"
                  value={fullName}
                  onChangeText={setFullName}
                  placeholderTextColor="#aaa"
                  underlineColorAndroid="transparent"
                  autoCapitalize="words"
                />

                <TextInput
                  style={tw.style({
                    backgroundColor: "#f9fafb",
                    borderRadius: 12,
                    paddingVertical: 14,
                    paddingHorizontal: 16,
                    fontSize: 14,
                  })}
                  placeholder="Email address"
                  value={email}
                  onChangeText={setEmail}
                  keyboardType="email-address"
                  autoCapitalize="none"
                  autoComplete="email"
                  placeholderTextColor="#aaa"
                  underlineColorAndroid="transparent"
                />

                <View
                  style={tw.style({
                    flexDirection: "row",
                    gap: "2",
                    alignItems: "center",
                    backgroundColor: "#f9fafb",
                    borderRadius: 12,
                    paddingVertical: 14,
                    paddingHorizontal: 16,
                    fontSize: 14,
                  })}
                >
                  <TextInput
                    style={tw`flex-1 text-gray-800`}
                    placeholder="Enter your phone number"
                    placeholderTextColor="#9CA3AF"
                    keyboardType="phone-pad"
                    value={phoneNumber}
                    onChangeText={setPhoneNumber}
                    autoCapitalize="none"
                  />
                </View>

                <View
                  style={tw.style("flex-row justify-between items-center", {
                    backgroundColor: "#f9fafb",
                    borderRadius: 12,
                    paddingVertical: 14,
                    paddingHorizontal: 16,
                  })}
                >
                  <TextInput
                    style={tw.style("flex-1", {
                      backgroundColor: "transparent",
                      fontSize: 14,
                    })}
                    secureTextEntry={!showPassword}
                    value={password}
                    onChangeText={setPassword}
                    placeholder="Create password"
                    placeholderTextColor="#aaa"
                    autoCapitalize="none"
                    autoComplete="password-new"
                    underlineColorAndroid="transparent"
                  />
                  <MaterialCommunityIcons
                    name={showPassword ? "eye-off" : "eye"}
                    size={20}
                    color="#aaa"
                    onPress={toggleShowPassword}
                  />
                </View>

                <View
                  style={tw.style("flex-row justify-between items-center", {
                    backgroundColor: "#f9fafb",
                    borderRadius: 12,
                    paddingVertical: 14,
                    paddingHorizontal: 16,
                  })}
                >
                  <TextInput
                    style={tw.style("flex-1", {
                      backgroundColor: "transparent",
                      fontSize: 14,
                    })}
                    secureTextEntry={!showConfirmPassword}
                    value={confirmPassword}
                    onChangeText={setConfirmPassword}
                    placeholder="Confirm password"
                    placeholderTextColor="#aaa"
                    autoCapitalize="none"
                    autoComplete="password"
                    underlineColorAndroid="transparent"
                    returnKeyType="go"
                    onSubmitEditing={handleCreateAccount}
                  />
                  <MaterialCommunityIcons
                    name={showConfirmPassword ? "eye-off" : "eye"}
                    size={20}
                    color="#aaa"
                    onPress={toggleShowConfirmPassword}
                  />
                </View>
              </View>

              <View style={tw.style("mt-4")}>
                <TouchableOpacity
                  style={tw.style("w-full rounded-2xl", {
                    backgroundColor: validateForm() ? COLORS.title : "#cccccc",
                    paddingVertical: 16,
                    borderRadius: 100,
                    opacity: validateForm() ? 1 : 0.7,
                  })}
                  onPress={handleCreateAccount}
                  disabled={!validateForm() || isLoading}
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
                      Create Account
                    </Text>
                  )}
                </TouchableOpacity>
              </View>

              <View
                style={tw.style("flex-row justify-center items-center mt-6")}
              >
                <Text style={tw.style("text-gray-500 mr-1")}>
                  Already have an account?
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
