import FontAwesome from "@expo/vector-icons/FontAwesome";
import { useFonts } from "expo-font";
import { Stack } from "expo-router";
import * as SplashScreen from "expo-splash-screen";
import { StatusBar } from "expo-status-bar";
import { useEffect } from "react";
import {
  ActivityIndicator,
  StyleSheet,
  useColorScheme,
  View,
} from "react-native";
import { AuthProvider } from "../hooks/useAuth";

SplashScreen.preventAutoHideAsync();

export default function RootLayout() {
  const [loaded, error] = useFonts({
    nunitoSansRegular: require("../assets/fonts/NunitoSans-Regular.ttf"),
    nunitoSansMedium: require("../assets/fonts/NunitoSans-Medium.ttf"),
    nunitoSansBold: require("../assets/fonts/NunitoSans-Bold.ttf"),
    nunitoSansExtraBold: require("../assets/fonts/NunitoSans-ExtraBold.ttf"),
    ...FontAwesome.font,
  });

  const colorScheme = useColorScheme();

  useEffect(() => {
    if (loaded) {
      SplashScreen.hideAsync();
    } else if (error) {
      console.error("Error loading fonts:", error);
    }
  }, [loaded, error]);

  if (!loaded) {
    return (
      <View style={styles.container}>
        <ActivityIndicator size="large" color="#081225" />
      </View>
    );
  }

  return (
    <>
      <StatusBar
        barStyle={colorScheme === "dark" ? "light-content" : "dark-content"}
      />
      <AuthProvider>
        <Stack>
          <Stack.Screen name="index" options={{ headerShown: false }} />
          <Stack.Screen name="auth" options={{ headerShown: false }} />
          <Stack.Screen name="authenticated" options={{ headerShown: false }} />
        </Stack>
      </AuthProvider>
    </>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
    backgroundColor: "#fff",
  },
});
