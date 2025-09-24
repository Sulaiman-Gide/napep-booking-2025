import { useRouter } from "expo-router";
import { StatusBar } from "expo-status-bar";
import React from "react";
import {
  Image,
  Text,
  TouchableOpacity,
  View,
  useColorScheme,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import tailwind from "twrnc";
import CustomText from "../../components/CustomText";

export default function Onboarding() {
  const router = useRouter();
  const colorScheme = useColorScheme();
  return (
    <SafeAreaView style={tailwind`flex-1 bg-white px-3`}>
      <StatusBar
        barStyle={colorScheme === "dark" ? "dark-content" : "dark-content"}
      />
      {/* Header Content */}
      <View style={tailwind`flex-0.7 overflow-hidden bg-[#FDFAF260]`}>
        {/* Top Image */}
        <Image
          source={require("../../assets/images/onboarding-3.png")}
          style={tailwind.style("h-full w-full", {
            objectFit: "contain",
            position: "absolute",
          })}
        />
      </View>

      {/* Footer Buttons */}
      <View style={tailwind`flex-0.3 justify-between pb-2.5`}>
        <Text
          style={tailwind`text-center text-2xl text-black font-semibold mb-1`}
        >
          Discover Kano like never before!
        </Text>
        <CustomText style={tailwind`text-center text-lg font-semibold mb-3`}>
          Experience the fastest, most comfortable, and easiest way to explore
          our vibrant platform.
        </CustomText>
        <View style={tailwind`w-full flex-row`}>
          <TouchableOpacity
            onPress={() => router.push("/auth/signup")}
            style={tailwind.style("flex-0.5 bg-[#123566] mr-1", {
              fontWeight: 600,
              padding: 12,
              borderRadius: 8,
            })}
          >
            <CustomText
              style={tailwind.style("text-center text-white text-base", {
                fontWeight: 600,
              })}
            >
              Create an account
            </CustomText>
          </TouchableOpacity>

          <TouchableOpacity
            onPress={() => router.push("/auth/login")}
            style={tailwind.style("flex-0.5 border ml-1", {
              fontWeight: 600,
              padding: 12,
              borderRadius: 8,
            })}
          >
            <CustomText
              style={tailwind.style("text-center text-base", {
                fontWeight: 600,
              })}
            >
              Login
            </CustomText>
          </TouchableOpacity>
        </View>

        <TouchableOpacity onPress={() => router.push("/auth/driver-login")}>
          <CustomText
            style={tailwind.style("text-center text-base", { fontWeight: 600 })}
          >
            Login as a Driver
          </CustomText>
        </TouchableOpacity>
      </View>
    </SafeAreaView>
  );
}
