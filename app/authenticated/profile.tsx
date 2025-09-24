import AntDesign from "@expo/vector-icons/AntDesign";
import FontAwesome5 from "@expo/vector-icons/FontAwesome5";
import AsyncStorage from "@react-native-async-storage/async-storage";
import { useFocusEffect } from "@react-navigation/native";
import { Href, router } from "expo-router";
import React, { useEffect, useState } from "react";
import {
  Image,
  Linking,
  ScrollView,
  StatusBar,
  Text,
  TouchableOpacity,
  useColorScheme,
  View,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import tailwind from "twrnc";
import CustomText from "../../components/CustomText";
import { useTabVisibility } from "../../context/TabVisibilityContext";
import useAuth from "../../hooks/useAuth";
import type { AuthContextType } from "../../hooks/useAuth.d";

export default function Profile() {
  const colorScheme = useColorScheme();
  const [userName, setUserName] = useState("");
  const [userEmail, setUserEmail] = useState("");
  const [isLoading, setIsLoading] = useState(true);
  const { setTabBarVisible } = useTabVisibility();
  const { user, signOut } = useAuth() as AuthContextType;

  useFocusEffect(
    React.useCallback(() => {
      setTabBarVisible(true);
    }, [setTabBarVisible])
  );

  useEffect(() => {
    const fetchUserData = async () => {
      try {
        if (user) {
          const userEmail = user.email || "";
          const name =
            user.user_metadata?.full_name || user.email?.split("@")[0] || "";

          setUserEmail(userEmail);
          setUserName(name);

          if (userEmail)
            await AsyncStorage.setItem("loggedInUserEmail", userEmail);
          if (name) await AsyncStorage.setItem("loggedInUserName", name);
        } else {
          const email = await AsyncStorage.getItem("loggedInUserEmail");
          const name = await AsyncStorage.getItem("loggedInUserName");

          if (email) setUserEmail(email);
          if (name) setUserName(name);
        }
      } catch (error) {
        console.error("Error fetching user data: ", error);
      } finally {
        setIsLoading(false);
      }
    };

    fetchUserData();
  }, [user]);

  return (
    <SafeAreaView
      style={tailwind.style("bg-[#f9f9f9]", { flex: 1 })}
      edges={["top"]}
    >
      <StatusBar
        barStyle={colorScheme === "dark" ? "dark-content" : "dark-content"}
      />
      <View style={tailwind.style("flex-1")}>
        <ScrollView
          showsVerticalScrollIndicator={false}
          style={{ flex: 1, paddingHorizontal: 16 }}
          contentContainerStyle={{ flexGrow: 1 }}
        >
          <View>
            <Image
              source={
                user?.user_metadata?.avatar_url
                  ? { uri: user.user_metadata.avatar_url }
                  : require("../../assets/images/male-avater.jpg")
              }
              style={tailwind.style(
                "w-32 h-32 rounded-full mt-10 mx-auto mb-3",
                {}
              )}
            />
            <Text
              style={tailwind.style("mx-auto pt-1", {
                fontFamily: "nunitoSansExtraBold",
                fontWeight: 700,
                fontSize: 25,
                lineHeight: 24.55,
                color: "#072F4A",
              })}
            >
              {isLoading ? "Loading..." : userName || "User"}
            </Text>
            <Text
              style={tailwind.style("mx-auto pt-1", {
                fontFamily: "nunitoSansMedium",
                fontWeight: 400,
                fontSize: 18,
                lineHeight: 24.55,
                color: "#072F4A50",
              })}
            >
              {isLoading ? "Loading..." : userEmail || ""}
            </Text>
          </View>
          <View style={tailwind.style("flex-1 gap-5 mt-10")}>
            <TouchableOpacity
              onPress={() => {
                const phoneNumber = "+2347068011002";
                const message = "Hi, I need help with...";
                const url = `https://api.whatsapp.com/send?phone=${phoneNumber}&text=${encodeURIComponent(
                  message
                )}`;
                Linking.openURL(url);
              }}
              style={tailwind.style(
                "flex-row gap-3 items-center border-gray-200 border-b border-t py-5"
              )}
            >
              <View style={tailwind.style("bg-gray-200 rounded-full p-2.5")}>
                <AntDesign name="phone" size={20} color="black" />
              </View>
              <CustomText
                style={tailwind.style("text-black font-bold pt-1 ml-3 mt-1", {
                  fontSize: 20,
                })}
              >
                Customer Service
              </CustomText>
            </TouchableOpacity>

            <TouchableOpacity
              onPress={() => router.push("/authenticated/howItWorks" as Href)}
              style={tailwind.style(
                "flex-row gap-3 items-center border-gray-200 border-b py-5"
              )}
            >
              <View style={tailwind.style("bg-gray-200 rounded-full p-2.5")}>
                <FontAwesome5 name="hand-point-right" size={20} color="black" />
              </View>
              <CustomText
                style={tailwind.style("text-black font-bold pt-1 ml-3 mt-1", {
                  fontSize: 20,
                })}
              >
                How It Works
              </CustomText>
            </TouchableOpacity>

            <TouchableOpacity
              onPress={async () => {
                try {
                  const { error } = await signOut();
                  if (error) throw error;
                  // Clear any stored user data
                  await AsyncStorage.multiRemove([
                    'loggedInUserEmail',
                    'loggedInUserName'
                  ]);
                  // Navigate to auth screen
                  router.replace("/auth");
                } catch (error) {
                  console.error('Error signing out:', error);
                  // Handle error (e.g., show an alert)
                }
              }}
              style={tailwind.style(
                "flex-row gap-3 items-center border-gray-200 border-b py-5"
              )}
            >
              <View style={tailwind.style("bg-gray-200 rounded-full p-2.5")}>
                <AntDesign name="logout" size={20} color="black" />
              </View>
              <CustomText
                style={tailwind.style("text-black font-bold pt-1 ml-3 mt-1", {
                  fontSize: 20,
                })}
              >
                Log Out
              </CustomText>
            </TouchableOpacity>
          </View>
        </ScrollView>

        <Text
          style={tailwind.style("mx-auto mb-3 pt-1", {
            fontFamily: "nunitoSansExtraBold",
            fontWeight: 400,
            fontSize: 16,
            lineHeight: 24.55,
            color: "#072F4A90",
          })}
        >
          Developed by: Shamwilu Umar
        </Text>

        <Text
          style={tailwind.style("mx-auto mb-3 pt-1", {
            fontFamily: "nunitoSansBold",
            fontWeight: 400,
            fontSize: 16,
            lineHeight: 24.55,
            color: "#072F4A9020",
          })}
        >
          App Version:{" "}
          <Text style={{ fontFamily: "nunitoSansBold" }}> V1.2</Text>
        </Text>
      </View>
    </SafeAreaView>
  );
}
