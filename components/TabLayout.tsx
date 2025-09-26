import FontAwesome6 from "@expo/vector-icons/FontAwesome6";
import { Tabs } from "expo-router";
import React from "react";
import { Image, Platform, StyleSheet, View } from "react-native";
import HomeNonactive from "../assets/images/home-nonactive.svg";
import profileIcon from "../assets/images/person.png";
import CustomText from "./CustomText";

interface TabIconProps {
  focused: boolean;
}

interface TabLayoutProps {
  tabBarVisible: boolean;
}

const TabLayout: React.FC<TabLayoutProps> = ({ tabBarVisible }) => {
  return (
    <Tabs
      screenOptions={{
        tabBarStyle: {
          backgroundColor: "#f9f9f9",
          justifyContent: "space-around",
          alignItems: "center",
          height: Platform.OS === "ios" ? 100 : 80,
          paddingVertical: 10,
          borderTopWidth: 0.5,
          borderColor: "#E9E9E9",
          elevation: 0,
          display: tabBarVisible ? "flex" : "none",
        },
        headerShown: false,
      }}
    >
      <Tabs.Screen
        name="index"
        options={{
          tabBarLabel: ({ focused }: TabIconProps) => (
            <CustomText
              style={[styles.label, { color: focused ? "#003AA5" : "#757575" }]}
            >
              Home
            </CustomText>
          ),
          tabBarIcon: ({ focused }: TabIconProps) => (
            <View style={styles.iconContainer}>
              <HomeNonactive width={24} height={24} />
            </View>
          ),
        }}
      />
      <Tabs.Screen
        name="wallet"
        options={{
          tabBarLabel: ({ focused }: TabIconProps) => (
            <CustomText
              style={[styles.label, { color: focused ? "#003AA5" : "#757575" }]}
            >
              Wallet
            </CustomText>
          ),
          tabBarIcon: ({ focused }: TabIconProps) => (
            <View style={styles.iconContainer}>
              <HomeNonactive width={24} height={24} />
            </View>
          ),
        }}
      />
      <Tabs.Screen
        name="payment"
        options={{
          tabBarLabel: ({ focused }: TabIconProps) => (
            <CustomText
              style={[styles.label, { color: focused ? "#003AA5" : "#757575" }]}
            >
              Payment
            </CustomText>
          ),
          tabBarIcon: ({ focused }: TabIconProps) => (
            <View style={styles.iconContainer}>
              <FontAwesome6
                name="money-bill-transfer"
                size={24}
                color="#757575"
                style={[styles.icon, focused && styles.iconFocused]}
              />
            </View>
          ),
        }}
      />
      <Tabs.Screen
        name="profile"
        options={{
          tabBarLabel: ({ focused }: TabIconProps) => (
            <CustomText
              style={[styles.label, { color: focused ? "#003AA5" : "#757575" }]}
            >
              Profile
            </CustomText>
          ),
          tabBarIcon: ({ focused }: TabIconProps) => (
            <View style={styles.iconContainer}>
              <Image
                source={profileIcon}
                style={[styles.icon, focused && styles.iconFocused]}
              />
            </View>
          ),
        }}
      />
      <Tabs.Screen
        name="howItWorks"
        options={{
          href: null,
        }}
      />
      <Tabs.Screen
        name="dashboard"
        options={{
          href: null,
        }}
      />
    </Tabs>
  );
};

const styles = StyleSheet.create({
  label: {
    fontSize: 14,
    fontWeight: "500",
    lineHeight: 19.1,
    marginBottom: Platform.OS === "ios" ? 10 : 15,
    fontFamily: "nunitoSansBold",
    textAlign: "center",
  },
  iconContainer: {
    alignItems: "center",
    justifyContent: "center",
  },
  icon: {
    width: 24,
    height: 24,
  },
  iconFocused: {},
});

export default TabLayout;
