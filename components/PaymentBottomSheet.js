import { MaterialIcons } from "@expo/vector-icons";
import React, {
  forwardRef,
  useCallback,
  useImperativeHandle,
  useRef,
  useState,
} from "react";
import {
  ActivityIndicator,
  Animated,
  Keyboard,
  StyleSheet,
  Text,
  TextInput,
  TouchableOpacity,
  View,
} from "react-native";

// Local Components
import CustomBottomSheet from "./CustomBottomSheet";

// Local Assets
import Success from "../assets/images/success-svg.svg";

// Constants
const CARD_NUMBER_LENGTH = 16;
const EXPIRY_LENGTH = 5; // MM/YY
const CVV_LENGTH = 3;

const PaymentBottomSheet = forwardRef(({ onSuccess }, ref) => {
  const bottomSheetRef = useRef(null);
  const [amount, setAmount] = useState("");
  const [cardNumber, setCardNumber] = useState("");
  const [expiryDate, setExpiryDate] = useState("");
  const [cvv, setCvv] = useState("");
  const [loading, setLoading] = useState(false);
  const [errors, setErrors] = useState({});
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isVisible, setIsVisible] = useState(false);
  const shakeAnimation = useRef(new Animated.Value(0)).current;

  // Expose methods to parent via ref
  useImperativeHandle(ref, () => ({
    expand: () => {
      setIsVisible(true);
      if (bottomSheetRef.current) {
        bottomSheetRef.current.expand();
      }
    },
    close: () => {
      if (bottomSheetRef.current) {
        bottomSheetRef.current.close();
      }
    },
  }));

  const startShake = useCallback(() => {
    Animated.sequence([
      Animated.timing(shakeAnimation, {
        toValue: 10,
        duration: 50,
        useNativeDriver: true,
      }),
      Animated.timing(shakeAnimation, {
        toValue: -10,
        duration: 50,
        useNativeDriver: true,
      }),
      Animated.timing(shakeAnimation, {
        toValue: 10,
        duration: 50,
        useNativeDriver: true,
      }),
      Animated.timing(shakeAnimation, {
        toValue: 0,
        duration: 50,
        useNativeDriver: true,
      }),
    ]).start();
  }, [shakeAnimation]);

  const validateForm = useCallback(() => {
    const newErrors = {};

    if (!amount) {
      newErrors.amount = "Amount is required";
    } else if (isNaN(amount) || parseFloat(amount) <= 0) {
      newErrors.amount = "Please enter a valid amount";
    }

    if (
      !cardNumber ||
      cardNumber.replace(/\s/g, "").length < CARD_NUMBER_LENGTH
    ) {
      newErrors.cardNumber = "Please enter a valid card number";
    }

    if (!expiryDate || expiryDate.length < EXPIRY_LENGTH) {
      newErrors.expiryDate = "Please enter a valid expiry date";
    } else {
      const [month, year] = expiryDate.split("/");
      const expiry = new Date(2000 + parseInt(year), parseInt(month) - 1);
      const today = new Date();

      if (expiry < new Date(today.getFullYear(), today.getMonth())) {
        newErrors.expiryDate = "Card has expired";
      }
    }

    if (!cvv || cvv.length < CVV_LENGTH) {
      newErrors.cvv = "Please enter a valid CVV";
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  }, [amount, cardNumber, expiryDate, cvv]);

  const formatCardNumber = (text) => {
    // Remove all non-digits
    const cleaned = text.replace(/\D/g, "");
    // Add space after every 4 digits
    const formatted = cleaned.replace(/(\d{4})(?=\d)/g, "$1 ");
    return formatted.trim();
  };

  const formatExpiryDate = (text) => {
    // Remove all non-digits
    const cleaned = text.replace(/\D/g, "");
    // Add slash after 2 digits
    if (cleaned.length >= 3) {
      return `${cleaned.slice(0, 2)}/${cleaned.slice(2, 4)}`;
    }
    return cleaned;
  };

  const handleCardNumberChange = (text) => {
    const formatted = formatCardNumber(text);
    if (formatted.length <= 19) {
      // 16 digits + 3 spaces
      setCardNumber(formatted);
    }
  };

  const handleExpiryChange = (text) => {
    const formatted = formatExpiryDate(text);
    if (formatted.length <= 5) {
      // MM/YY format
      setExpiryDate(formatted);
    }
  };

  const handleCvvChange = (text) => {
    // Only allow digits and limit length
    if (/^\d*$/.test(text) && text.length <= CVV_LENGTH) {
      setCvv(text);
    }
  };

  const handleAmountChange = (text) => {
    // Allow only numbers and one decimal point
    if (text === "" || /^\d*\.?\d*$/.test(text)) {
      setAmount(text);
    }
  };

  const handlePayment = async () => {
    Keyboard.dismiss();

    if (!validateForm()) {
      startShake();
      return;
    }

    setLoading(true);
    setIsSubmitting(true);

    try {
      // Simulate API call
      await new Promise((resolve) => setTimeout(resolve, 2000));

      if (onSuccess) {
        onSuccess(amount);
        // Reset form
        setAmount("");
        setCardNumber("");
        setExpiryDate("");
        setCvv("");
        setErrors({});
      }

      ref.current.close();
    } catch (error) {
      console.error("Payment error:", error);
      setErrors((prev) => ({
        ...prev,
        submit: "Payment failed. Please try again.",
      }));
    } finally {
      setLoading(false);
      setIsSubmitting(false);
    }
  };

  const renderInput = ({
    label,
    value,
    onChangeText,
    placeholder,
    keyboardType = "default",
    maxLength,
    secureTextEntry = false,
    error,
    autoCapitalize = "none",
    returnKeyType = "next",
    onSubmitEditing,
    blurOnSubmit = true,
    icon = null,
    inputStyle = {},
    containerStyle = {},
  }) => {
    const isError = !!error;
    const inputStyles = [
      styles.input,
      isError && styles.inputError,
      icon && { paddingLeft: 40 },
      inputStyle,
    ];

    return (
      <View style={[styles.inputContainer, containerStyle]}>
        <Text style={[styles.label, isError && styles.labelError]}>
          {label}
          {isError && <Text style={styles.errorText}> • {error}</Text>}
        </Text>
        <View style={{ position: "relative" }}>
          {icon && <View style={styles.iconContainer}>{icon}</View>}
          <TextInput
            style={inputStyles}
            value={value}
            onChangeText={onChangeText}
            placeholder={placeholder}
            placeholderTextColor="#9CA3AF"
            keyboardType={keyboardType}
            maxLength={maxLength}
            secureTextEntry={secureTextEntry}
            autoCapitalize={autoCapitalize}
            returnKeyType={returnKeyType}
            onSubmitEditing={onSubmitEditing}
            blurOnSubmit={blurOnSubmit}
            editable={!isSubmitting}
            selectTextOnFocus={!isSubmitting}
          />
        </View>
      </View>
    );
  };

  const handleClose = () => {
    setIsVisible(false);
  };

  return (
    <CustomBottomSheet
      ref={bottomSheetRef}
      isVisible={isVisible}
      onClose={handleClose}
    >
      <Animated.View
        style={[
          styles.sheetContent,
          { transform: [{ translateX: shakeAnimation }] },
        ]}
      >
        <View style={styles.header}>
          <Text style={styles.title}>Fund Your Wallet</Text>
          <Text style={styles.description}>
            Securely add funds using your debit/credit card
          </Text>
        </View>

        <View style={styles.formContainer}>
          {renderInput({
            label: "Card Number",
            value: cardNumber,
            onChangeText: handleCardNumberChange,
            placeholder: "1234 5678 9012 3456",
            keyboardType: "number-pad",
            maxLength: 19, // 16 digits + 3 spaces
            error: errors.cardNumber,
            icon: (
              <MaterialIcons
                name="credit-card"
                size={20}
                color={errors.cardNumber ? "#EF4444" : "#6B7280"}
              />
            ),
          })}

          <View style={styles.row}>
            <View style={[styles.column, { marginRight: 10 }]}>
              {renderInput({
                label: "Expiry Date",
                value: expiryDate,
                onChangeText: handleExpiryChange,
                placeholder: "MM/YY",
                keyboardType: "number-pad",
                maxLength: 5,
                error: errors.expiryDate,
                containerStyle: { flex: 1 },
              })}
            </View>
            <View style={[styles.column, { marginLeft: 10 }]}>
              {renderInput({
                label: "CVV",
                value: cvv,
                onChangeText: handleCvvChange,
                placeholder: "•••",
                keyboardType: "number-pad",
                maxLength: 3,
                secureTextEntry: true,
                error: errors.cvv,
                containerStyle: { flex: 1 },
              })}
            </View>
          </View>

          {renderInput({
            label: "Amount (₦)",
            value: amount,
            onChangeText: handleAmountChange,
            placeholder: "0.00",
            keyboardType: "decimal-pad",
            error: errors.amount,
            icon: (
              <View style={styles.currencyIconContainer}>
                <Text style={styles.currencySymbol}>₦</Text>
              </View>
            ),
            inputStyle: {
              fontWeight: "600",
              fontSize: 18,
              borderWidth: 2,
            },
          })}

          {errors.submit && (
            <View style={styles.errorContainer}>
              <MaterialIcons name="error-outline" size={16} color="#EF4444" />
              <Text style={styles.submitError}>{errors.submit}</Text>
            </View>
          )}

          <TouchableOpacity
            style={[
              styles.button,
              (loading || isSubmitting) && styles.buttonDisabled,
            ]}
            onPress={handlePayment}
            disabled={loading || isSubmitting}
            activeOpacity={0.9}
          >
            {loading ? (
              <ActivityIndicator size="small" color="white" />
            ) : (
              <View style={styles.buttonContent}>
                <Text style={styles.buttonText}>
                  Pay {amount ? `₦${parseFloat(amount).toLocaleString()}` : ""}
                </Text>
                {!amount && (
                  <MaterialIcons
                    name="arrow-forward"
                    size={20}
                    color="white"
                    style={styles.buttonIcon}
                  />
                )}
              </View>
            )}
          </TouchableOpacity>

          <View style={styles.securityInfo}>
            <MaterialIcons
              name="security"
              size={16}
              color="#6B7280"
              style={styles.securityIcon}
            />
            <Text style={styles.securityText}>
              Your payment is secured with end-to-end encryption
            </Text>
          </View>
        </View>
      </Animated.View>
    </CustomBottomSheet>
  );
});

const SuccessBottomSheet = forwardRef(({ onClose, amount }, ref) => {
  const bottomSheetRef = useRef(null);
  const [isVisible, setIsVisible] = useState(false);

  // Expose methods to parent via ref
  useImperativeHandle(ref, () => ({
    expand: () => {
      setIsVisible(true);
      if (bottomSheetRef.current) {
        bottomSheetRef.current.expand();
      }
    },
    close: () => {
      if (bottomSheetRef.current) {
        bottomSheetRef.current.close();
      }
    },
  }));

  const handleClose = () => {
    setIsVisible(false);
    if (onClose) onClose();
  };

  return (
    <CustomBottomSheet
      ref={bottomSheetRef}
      isVisible={isVisible}
      onClose={handleClose}
    >
      <View style={styles.successContent}>
        <Success width={80} height={80} style={styles.successIcon} />
        <Text style={styles.successTitle}>Payment Successful!</Text>
        <Text style={styles.successMessage}>
          You've successfully added ₦
          {amount ? parseFloat(amount).toLocaleString() : "0.00"} to your
          wallet. You can now use these funds for your next ride.
        </Text>
        <TouchableOpacity
          style={styles.successButton}
          onPress={onClose}
          activeOpacity={0.9}
        >
          <Text style={styles.buttonText}>Done</Text>
        </TouchableOpacity>
      </View>
    </CustomBottomSheet>
  );
});

const styles = StyleSheet.create({
  // Layout
  sheetContent: {
    flexGrow: 1,
  },
  header: {
    marginBottom: 24,
  },
  formContainer: {
    marginTop: 8,
  },
  row: {
    flexDirection: "row",
    marginHorizontal: -10,
  },
  column: {
    flex: 1,
  },

  // Typography
  title: {
    fontSize: 24,
    fontWeight: "700",
    color: "#111827",
    marginBottom: 8,
    fontFamily: "nunitoSansExtraBold",
  },
  description: {
    fontSize: 14,
    color: "#6B7280",
    lineHeight: 20,
    fontFamily: "nunitoSansRegular",
  },

  // Inputs
  inputContainer: {
    marginBottom: 16,
  },
  label: {
    fontSize: 14,
    fontWeight: "500",
    color: "#374151",
    marginBottom: 6,
    fontFamily: "nunitoSansSemiBold",
  },
  labelError: {
    color: "#EF4444",
  },
  input: {
    height: 52,
    backgroundColor: "#F9FAFB",
    borderWidth: 1,
    borderColor: "#E5E7EB",
    borderRadius: 12,
    paddingHorizontal: 16,
    paddingLeft: 12,
    fontSize: 16,
    color: "#111827",
    fontFamily: "nunitoSansRegular",
    textAlignVertical: "center",
  },
  inputError: {
    borderColor: "#EF4444",
    backgroundColor: "#FEF2F2",
  },
  iconContainer: {
    position: "absolute",
    left: 14,
    top: 14,
    zIndex: 1,
    justifyContent: "center",
    alignItems: "center",
    width: 24,
    height: 24,
  },
  currencySymbol: {
    fontSize: 18,
    color: "#111827",
    fontWeight: "600",
    lineHeight: 24,
  },
  currencyIconContainer: {
    width: 32,
    height: 52,
    paddingTop: 13,
    alignItems: "center",
  },

  // Buttons
  button: {
    backgroundColor: "#193a69",
    borderRadius: 12,
    height: 56,
    justifyContent: "center",
    alignItems: "center",
    marginTop: 8,
    shadowColor: "#193a69",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 2,
  },
  buttonDisabled: {
    opacity: 0.7,
  },
  buttonContent: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
  },
  buttonText: {
    color: "#FFFFFF",
    fontSize: 16,
    fontWeight: "600",
    fontFamily: "nunitoSansBold",
    textAlign: "center",
  },
  buttonIcon: {
    marginLeft: 8,
  },

  // Errors
  errorText: {
    color: "#EF4444",
    fontSize: 12,
    fontWeight: "400",
    fontFamily: "nunitoSansRegular",
  },
  errorContainer: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: "#FEF2F2",
    padding: 12,
    borderRadius: 8,
    marginTop: 16,
    marginBottom: 8,
  },
  submitError: {
    color: "#DC2626",
    fontSize: 13,
    marginLeft: 8,
    fontFamily: "nunitoSansRegular",
  },

  // Security info
  securityInfo: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    marginTop: 24,
    paddingTop: 16,
    borderTopWidth: 1,
    borderTopColor: "#F3F4F6",
  },
  securityIcon: {
    marginRight: 8,
  },
  securityText: {
    color: "#6B7280",
    fontSize: 12,
    fontFamily: "nunitoSansRegular",
  },

  // Success screen
  successContent: {
    padding: 40,
    alignItems: "center",
    justifyContent: "center",
    flex: 1,
  },
  successIcon: {
    marginBottom: 24,
  },
  successTitle: {
    fontSize: 24,
    fontWeight: "700",
    color: "#111827",
    marginBottom: 12,
    textAlign: "center",
    fontFamily: "nunitoSansExtraBold",
  },
  successMessage: {
    fontSize: 16,
    color: "#6B7280",
    textAlign: "center",
    marginBottom: 32,
    lineHeight: 24,
    fontFamily: "nunitoSansRegular",
  },
  successButton: {
    backgroundColor: "#193a69",
    borderRadius: 12,
    height: 56,
    width: "100%",
    justifyContent: "center",
    alignItems: "center",
    shadowColor: "#193a69",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 2,
  },
});

export { PaymentBottomSheet, SuccessBottomSheet };
