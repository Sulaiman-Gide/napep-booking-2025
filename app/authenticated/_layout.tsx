import React from "react";
import { SafeAreaView, View, StyleSheet } from "react-native";
import {
  TabVisibilityProvider,
  useTabVisibility,
} from "../../context/TabVisibilityContext";
import TabLayout from "../../components/TabLayout";

const Layout = () => {
  const { tabBarVisible } = useTabVisibility();

  return (
    <View style={styles.content}>
      <TabLayout tabBarVisible={tabBarVisible} />
    </View>
  );
};

export default function AppLayout() {
  return (
    <TabVisibilityProvider>
      <Layout />
    </TabVisibilityProvider>
  );
}

const styles = StyleSheet.create({
  content: {
    flex: 1,
  },
});
