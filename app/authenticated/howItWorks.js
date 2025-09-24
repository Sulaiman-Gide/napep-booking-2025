import { useColorScheme, StatusBar, ScrollView, View } from "react-native";
import { TouchableOpacity, Text, Platform, Image } from "react-native";
import React from "react";
import tailwind from "twrnc";
import { SafeAreaView } from "react-native-safe-area-context";
import { useTabVisibility } from "../../context/TabVisibilityContext";
import { useFocusEffect } from "@react-navigation/native";
import Entypo from "@expo/vector-icons/Entypo";
import { router } from "expo-router";

const Content = () => {
  return (
    <ScrollView
      style={tailwind.style("bg-white flex-1", {
        paddingVertical: 0,
        paddingHorizontal: 16,
      })}
    >
      {/* Header */}
      <View style={tailwind.style({ gap: 5, marginTop: 20 })}>
        {/* Title Section */}
        <Text
          style={tailwind.style("text-[#1F1F1F] font-extrabold", {
            fontFamily: "nunitoSansBold",
            fontSize: 24,
            lineHeight: 34,
          })}
        >
          How it works
        </Text>

        {/* Subtitle / Description */}
        <Text
          style={tailwind.style("text-[#7D7D7D] tracking-wider text-base", {
            fontSize: 16,
            lineHeight: 24,
            fontWeight: 400,
            fontFamily: "nunitoSansBold",
          })}
        >
          Here is a complete guide on how our mobile app works.
        </Text>
      </View>

      {/* Steps Section */}
      <View style={tailwind.style("mt-6")}>
        {/* Step 1: Register and Login */}
        <View style={tailwind.style("mb-5")}>
          <Text style={tailwind.style("font-bold text-lg text-gray-900")}>
            1. Register and Login
          </Text>
          <Text
            style={tailwind.style("text-[#7D7D7D] tracking-wider text-base", {
              marginVertical: 5,
            })}
          >
            First, register by providing your details, then log in to access the
            app.
          </Text>
        </View>

        {/* Step 2: View Wallet & Make Booking */}
        <View style={tailwind.style("mb-5")}>
          <Text style={tailwind.style("font-bold text-lg text-gray-900")}>
            2. View Wallet & Make Keke Booking
          </Text>
          <Text
            style={tailwind.style("text-[#7D7D7D] tracking-wider text-base", {
              marginVertical: 5,
            })}
          >
            After logging in, you can view your wallet balance and the total
            amount spent. To book a Keke Napep, click on the map to select your
            destination and proceed with booking.
          </Text>
        </View>

        {/* Step 3: Fund Wallet & View Transaction History */}
        <View style={tailwind.style("mb-5")}>
          <Text style={tailwind.style("font-bold text-lg text-gray-900")}>
            3. Fund Wallet & View Transaction History
          </Text>
          <Text
            style={tailwind.style("text-[#7D7D7D] tracking-wider text-base", {
              marginVertical: 5,
            })}
          >
            On the wallet page, you can add funds to your wallet and view your
            transaction history.
          </Text>
        </View>

        {/* Step 4: Confirm Payment for Trip */}
        <View style={tailwind.style("mb-5")}>
          <Text style={tailwind.style("font-bold text-lg text-gray-900")}>
            4. Confirm Trip Payment
          </Text>
          <Text
            style={tailwind.style("text-[#7D7D7D] tracking-wider text-base", {
              marginVertical: 5,
            })}
          >
            Once a booking is completed, confirm the payment, which will be
            deducted from your wallet.
          </Text>
        </View>

        {/* Step 5: Profile - Logout & Contact Support */}
        <View style={tailwind.style("mb-5")}>
          <Text style={tailwind.style("font-bold text-lg text-gray-900")}>
            5. Profile: Logout & Contact Support
          </Text>
          <Text
            style={tailwind.style("text-[#7D7D7D] tracking-wider text-base", {
              marginVertical: 5,
            })}
          >
            On your profile page, you can log out and reach out to our customer
            service for support.
          </Text>
        </View>
      </View>
    </ScrollView>
  );
};

export default function HowItWorksPage() {
  const { setTabBarVisible } = useTabVisibility();
  const colorScheme = useColorScheme();

  useFocusEffect(
    React.useCallback(() => {
      setTabBarVisible(false);
    }, [setTabBarVisible])
  );

  return Platform.OS === "android" ? (
    <SafeAreaView style={tailwind.style("bg-white flex-1")}>
      <View
        style={tailwind.style({
          gap: 10,
          padding: 16,
          backgroundColor: "#f0f0f0",
        })}
      >
        <TouchableOpacity onPress={() => router.push("/authenticated/profile")}>
          <Entypo name="chevron-small-left" size={27} color="#242424" />
        </TouchableOpacity>
      </View>
      <Content />
    </SafeAreaView>
  ) : (
    <SafeAreaView style={tailwind.style("bg-white flex-1")}>
      <View style={tailwind.style("bg-white flex-1")}>
        <View
          style={tailwind.style({
            gap: 10,
            padding: 16,
            backgroundColor: "#f0f0f0",
          })}
        >
          <TouchableOpacity
            onPress={() => router.push("/authenticated/profile")}
          >
            <Entypo name="chevron-small-left" size={27} color="#242424" />
          </TouchableOpacity>
        </View>
        <Content />
      </View>
    </SafeAreaView>
  );
}
