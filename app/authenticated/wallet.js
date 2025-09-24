import AsyncStorage from "@react-native-async-storage/async-storage";
import { useFocusEffect } from "@react-navigation/native";
import { LinearGradient } from "expo-linear-gradient";
import { router } from "expo-router";
import React, { useCallback, useRef, useState } from "react";
import {
  ActivityIndicator,
  RefreshControl,
  SafeAreaView,
  ScrollView,
  Text,
  TouchableOpacity,
  View,
} from "react-native";
import tailwind from "twrnc";

// Icons
import Entypo from "@expo/vector-icons/Entypo";
import MaterialCommunityIcons from "@expo/vector-icons/MaterialCommunityIcons";
import MaterialIcons from "@expo/vector-icons/MaterialIcons";

// Components
import {
  PaymentBottomSheet,
  SuccessBottomSheet,
} from "../../components/PaymentBottomSheet";
import { useTabVisibility } from "../../context/TabVisibilityContext";

// Assets
import PlusIcon from "../../assets/images/plus-icon.svg";

const Content = () => {
  // State
  const [userName, setUserName] = useState("");
  const [userBalance, setUserBalance] = useState(0);
  const [transactions, setTransactions] = useState([]);
  const [showAll, setShowAll] = useState(false);
  const [totalSpent, setTotalSpent] = useState(0);
  const [isPaymentSuccessful, setIsPaymentSuccessful] = useState(false);
  const [isLoading, setIsLoading] = useState(true);
  const [isRefreshing, setIsRefreshing] = useState(false);

  // Refs
  const bottomSheetRef = useRef(null);
  const successBottomSheetRef = useRef(null);

  // Fetch user data
  const fetchUserData = async () => {
    try {
      setIsLoading(true);
      const [name, balance, totalSpent, transactionsData] = await Promise.all([
        AsyncStorage.getItem("loggedInUserName"),
        AsyncStorage.getItem("loggedInUserBalance"),
        AsyncStorage.getItem("totalSpent"),
        AsyncStorage.getItem("userTransactions"),
      ]);

      setUserName(name || "Guest");
      setUserBalance(parseFloat(balance) || 0);
      setTotalSpent(parseFloat(totalSpent) || 0);

      if (transactionsData) {
        setTransactions(JSON.parse(transactionsData));
      }
    } catch (error) {
      console.error("Error fetching user data: ", error);
    } finally {
      setIsLoading(false);
      setIsRefreshing(false);
    }
  };

  // Handle pull to refresh
  const onRefresh = useCallback(() => {
    setIsRefreshing(true);
    fetchUserData();
  }, []);

  // Load data on focus
  useFocusEffect(
    useCallback(() => {
      fetchUserData();
    }, [])
  );

  const openPaymentSheet = () => {
    if (bottomSheetRef.current) {
      bottomSheetRef.current.expand();
    }
  };

  const handlePaymentSuccess = (amount) => {
    const newBalance = userBalance + parseFloat(amount);
    setUserBalance(newBalance);
    AsyncStorage.setItem("loggedInUserBalance", newBalance.toString());
    setIsPaymentSuccessful(true);

    // Create a new transaction (credit)
    const newTransaction = {
      id: transactions.length + 1,
      name: "Account Credit",
      type: "Wallet credit",
      amount: `+ ₦ ${amount}`,
      color: "green",
    };

    // Update transactions state
    const updatedTransactions = [...transactions, newTransaction];
    setTransactions(updatedTransactions);

    // Save transactions to AsyncStorage
    AsyncStorage.setItem(
      "userTransactions",
      JSON.stringify(updatedTransactions)
    );

    // Update the total spent if applicable
    const newTotalSpent = totalSpent; // No need to update totalSpent for credit transactions
    setTotalSpent(newTotalSpent);

    if (successBottomSheetRef.current) {
      successBottomSheetRef.current.expand();
    }
  };

  const displayedTransactions = showAll
    ? transactions
    : transactions.slice(0, 5);

  if (isLoading && !isRefreshing) {
    return (
      <View
        style={tailwind.style("flex-1 justify-center items-center bg-white")}
      >
        <ActivityIndicator size="large" color="#193a69" />
      </View>
    );
  }

  return (
    <View style={tailwind.style("bg-white flex-1")}>
      <ScrollView
        contentContainerStyle={tailwind.style("flex-grow")}
        refreshControl={
          <RefreshControl
            refreshing={isRefreshing}
            onRefresh={onRefresh}
            colors={["#193a69"]}
            tintColor="#193a69"
          />
        }
      >
        <View style={tailwind.style("px-4")}>
          {/* Header */}
          <View style={tailwind.style("mb-4")}>
            <Text style={tailwind.style("text-2xl font-bold text-gray-900")}>
              Wallet
            </Text>
            <Text style={tailwind.style("text-gray-500 mt-1")}>
              Manage your funds and track transactions
            </Text>
          </View>

          {/* Balance Card */}
          <View style={tailwind.style("mb-6")}>
            <LinearGradient
              colors={["#193a69", "#1e4985", "#123566"]}
              style={tailwind.style("rounded-2xl p-6")}
              start={{ x: 0, y: 0 }}
              end={{ x: 1, y: 1 }}
            >
              <View
                style={tailwind.style("flex-row justify-between items-start")}
              >
                <View>
                  <Text
                    style={tailwind.style("text-gray-200 text-sm font-medium")}
                  >
                    Available Balance
                  </Text>
                  <View style={tailwind.style("flex-row items-end mt-1")}>
                    <Text
                      style={tailwind.style("text-3xl font-bold text-white")}
                    >
                      ₦{userBalance.toLocaleString("en-NG")}
                    </Text>
                    <Text
                      style={tailwind.style(
                        "text-gray-300 text-base ml-1 mb-1"
                      )}
                    >
                      NGN
                    </Text>
                  </View>
                  <View style={tailwind.style("mt-4")}>
                    <Text style={tailwind.style("text-gray-300 text-sm")}>
                      Total Spent:
                      <Text style={tailwind.style("text-white font-semibold")}>
                        {" "}
                        ₦{totalSpent.toLocaleString("en-NG")}
                      </Text>
                    </Text>
                  </View>
                </View>

                <TouchableOpacity
                  onPress={openPaymentSheet}
                  style={tailwind.style(
                    "bg-white/10 border border-white/20 rounded-xl px-4 py-3 flex-row items-center"
                  )}
                >
                  <PlusIcon width={16} height={16} fill="#fff" />
                  <Text style={tailwind.style("text-white font-semibold ml-2")}>
                    Fund Wallet
                  </Text>
                </TouchableOpacity>
              </View>
            </LinearGradient>
          </View>

          {/* Transactions Section */}
          <View style={tailwind.style("mb-6")}>
            <View
              style={tailwind.style(
                "flex-row justify-between items-center mb-4"
              )}
            >
              <Text style={tailwind.style("text-lg font-bold text-gray-900")}>
                Recent Transactions
              </Text>
              {transactions.length > 0 && (
                <TouchableOpacity onPress={() => setShowAll(!showAll)}>
                  <Text style={tailwind.style("text-blue-600 font-medium")}>
                    {showAll ? "Show Less" : "View All"}
                  </Text>
                </TouchableOpacity>
              )}
            </View>

            {transactions.length === 0 ? (
              <View style={tailwind.style("items-center justify-center py-10")}>
                <MaterialCommunityIcons
                  name="wallet-outline"
                  size={48}
                  color="#e5e7eb"
                />
                <Text style={tailwind.style("text-gray-500 mt-3 text-center")}>
                  No transactions yet
                </Text>
                <Text
                  style={tailwind.style("text-gray-500 mt-1.5 text-center")}
                >
                  Fund your wallet to get started.
                </Text>
              </View>
            ) : (
              <View style={tailwind.style("bg-white rounded-xl shadow-sm")}>
                {displayedTransactions.map((transaction) => (
                  <View
                    key={transaction.id}
                    style={tailwind.style(
                      "flex-row items-center py-4 px-4 border-b border-gray-100",
                      { borderBottomWidth: 1 }
                    )}
                  >
                    <View
                      style={tailwind.style(
                        "w-10 h-10 rounded-full items-center justify-center",
                        transaction.color === "green"
                          ? "bg-green-50"
                          : "bg-red-50"
                      )}
                    >
                      <MaterialIcons
                        name={
                          transaction.color === "green"
                            ? "arrow-downward"
                            : "arrow-upward"
                        }
                        size={20}
                        color={
                          transaction.color === "green" ? "#10b981" : "#ef4444"
                        }
                      />
                    </View>

                    <View style={tailwind.style("flex-1 ml-3")}>
                      <Text style={tailwind.style("font-medium text-gray-900")}>
                        {transaction.name}
                      </Text>
                      <Text
                        style={tailwind.style("text-gray-500 text-sm mt-0.5")}
                      >
                        {new Date().toLocaleDateString()} • {transaction.type}
                      </Text>
                    </View>

                    <Text
                      style={[
                        tailwind.style("font-semibold text-base"),
                        {
                          color:
                            transaction.color === "green"
                              ? "#10b981"
                              : "#ef4444",
                        },
                      ]}
                    >
                      {transaction.amount}
                    </Text>
                  </View>
                ))}
              </View>
            )}
          </View>
        </View>
      </ScrollView>

      {/* Bottom Sheets */}
      <PaymentBottomSheet
        ref={bottomSheetRef}
        onSuccess={handlePaymentSuccess}
      />
      {isPaymentSuccessful && (
        <SuccessBottomSheet
          ref={successBottomSheetRef}
          onClose={() => {
            setIsPaymentSuccessful(false);
            successBottomSheetRef.current?.close();
          }}
        />
      )}
    </View>
  );
};

export default function WalletPage() {
  const { setTabBarVisible } = useTabVisibility();

  useFocusEffect(
    React.useCallback(() => {
      setTabBarVisible(false);
      return () => setTabBarVisible(true);
    }, [setTabBarVisible])
  );

  return (
    <SafeAreaView style={tailwind.style("bg-white flex-1")} edges={["top"]}>
      <View style={tailwind.style("px-2")}>
        <TouchableOpacity
          onPress={() => router.push("/authenticated")}
          style={tailwind.style("py-2")}
        >
          <Entypo name="chevron-small-left" size={32} color="#242424" />
        </TouchableOpacity>
      </View>
      <Content />
    </SafeAreaView>
  );
}
