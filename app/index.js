import { useRouter } from "expo-router";
import { useEffect, useState } from "react";
import { ActivityIndicator, StyleSheet, View } from "react-native";
import useAuth from "../hooks/useAuth";

export default function Index() {
  const router = useRouter();
  const { user } = useAuth();
  const [isMounted, setIsMounted] = useState(false);

  useEffect(() => {
    setIsMounted(true);
  }, []);

  useEffect(() => {
    if (isMounted) {
      if (user) {
        router.replace("/authenticated/index");
      } else {
        router.replace("/auth");
      }
    }
  }, [user, router, isMounted]);

  return (
    <View style={styles.container}>
      <ActivityIndicator size="large" color="#193a69" />
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
    backgroundColor: "#f1f5f9",
  },
});
