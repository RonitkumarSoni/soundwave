import React, { useState } from "react";
import { View, Text, StyleSheet, TouchableOpacity, ScrollView, Alert, Linking, ActivityIndicator } from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { useRouter } from "expo-router";
import { Feather, Ionicons } from "@expo/vector-icons";
import { LinearGradient } from "expo-linear-gradient";
import { useAuthStore } from "@/stores/useAuthStore";
import { useCountryPricing } from "@/hooks/useCountryPricing";
import { colors, gradients, spacing, borderRadius } from "@/theme/colors";

const MY_UPI_ID = "kumarronit739@ybl"; 
const APP_NAME = "Soundwave Premium";

export default function CheckoutStep2() {
  const insets = useSafeAreaInsets();
  const router = useRouter();
  const { upgradeToPremium } = useAuthStore();
  const { countryName, countryCode, currencySymbol, price, isIndia, isLoading } = useCountryPricing();
  const [selectedMethod, setSelectedMethod] = useState<"upi" | "card">(isIndia ? "upi" : "card");
  const [isProcessing, setIsProcessing] = useState(false);

  // Sync selectedMethod if isIndia changes after mount
  React.useEffect(() => {
    if (!isIndia) setSelectedMethod("card");
  }, [isIndia]);

  if (isLoading) return null;

  const initiatePayment = async () => {
    if (selectedMethod !== "upi") {
      Alert.alert("Notice", "Credit/Debit card payments are not supported yet. Please select UPI.");
      return;
    }

    setIsProcessing(true);
    
    const params = `pa=${MY_UPI_ID}&pn=${encodeURIComponent(APP_NAME)}&am=${price}&cu=INR`;
    const genericUpi = `upi://pay?${params}`;

    try {
      const supported = await Linking.canOpenURL(genericUpi);
      
      if (supported) {
        await Linking.openURL(genericUpi);
        
        // Simulate callback verification
        setTimeout(() => {
          setIsProcessing(false);
          Alert.alert(
            "Payment Verification",
            "Did you successfully complete the payment?",
            [
              { text: "No", style: "cancel" },
              { 
                text: "Yes, Paid", 
                onPress: async () => {
                  await upgradeToPremium();
                  Alert.alert("Success!", "Your payment is verified. You are now a Premium member.", [
                    { text: "Awesome", onPress: () => router.push("/(library)") }
                  ]);
                }
              }
            ]
          );
        }, 3000);
      } else {
        setIsProcessing(false);
        Alert.alert("Error", "No UPI app found on your phone. Please install Google Pay, PhonePe, or Paytm.");
      }
    } catch (error) {
      setIsProcessing(false);
      console.error(error);
      Alert.alert("Error", "Something went wrong while opening the payment app.");
    }
  };

  return (
    <LinearGradient
      colors={[gradients.background[0], gradients.background[1], gradients.background[2]]}
      style={[styles.container, { paddingTop: insets.top }]}
    >
      {/* Header */}
      <View style={styles.header}>
        <TouchableOpacity onPress={() => router.back()} style={styles.backButton}>
          <Feather name="arrow-left" size={24} color={colors.label} />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Soundwave Checkout</Text>
        <View style={{ width: 24 }} />
      </View>

      <ScrollView contentContainerStyle={styles.scrollContent}>
        <View style={styles.headerRow}>
          <Text style={styles.sectionTitle}>Checkout</Text>
          <TouchableOpacity>
            <Text style={styles.changePlanText}>Change plan</Text>
          </TouchableOpacity>
        </View>

        {/* Plan Summary Card */}
        <View style={styles.planCard}>
          <View style={styles.planCardLeft}>
            <LinearGradient colors={gradients.primary} style={styles.appIconBg}>
              <Ionicons name="musical-notes" size={24} color={colors.label} />
            </LinearGradient>
            <View>
              <Text style={styles.planTitle}>Premium Standard</Text>
              <Text style={styles.planSubtitle}>1 Standard account</Text>
            </View>
          </View>
          <View style={styles.planCardRight}>
            <Text style={styles.planPrice}>{currencySymbol}{price}</Text>
            <Text style={styles.planSubtitle}>For 12 months</Text>
          </View>
        </View>

        {/* Terms */}
        <View style={styles.termsContainer}>
          <Text style={styles.termText}>• One-time payment, does not auto-renew</Text>
          <Text style={styles.termText}>• Offer <Text style={{ textDecorationLine: 'underline' }}>Terms apply</Text></Text>
        </View>

        {/* Address */}
        <Text style={styles.sectionTitle}>Address</Text>
        <Text style={styles.sectionSubtitle}>Tax is calculated based on your address.</Text>
        
        <View style={styles.addressBox}>
          <View>
            <Text style={styles.addressText}>{countryName}</Text>
            <Text style={styles.addressSubtext}>{countryCode}</Text>
          </View>
          <TouchableOpacity>
            <Text style={styles.editText}>Edit</Text>
          </TouchableOpacity>
        </View>

        {/* Payment Method */}
        <Text style={styles.sectionTitle}>Payment method</Text>
        
        <View style={styles.paymentMethodsContainer}>
          {/* UPI - Only show for India */}
          {isIndia && (
            <>
              <TouchableOpacity 
                style={styles.paymentRow}
                onPress={() => setSelectedMethod("upi")}
                activeOpacity={0.8}
              >
                <View style={styles.radioContainer}>
                  <View style={[styles.outerCircle, selectedMethod === "upi" && styles.outerCircleSelected]}>
                    {selectedMethod === "upi" && <View style={styles.innerCircle} />}
                  </View>
                  <View>
                    <Text style={styles.methodTitle}>UPI (Select your UPI app)</Text>
                    <View style={styles.iconRow}>
                      <View style={styles.dummyIcon}><Text style={styles.dummyIconText}>BHIM</Text></View>
                      <View style={[styles.dummyIcon, { backgroundColor: '#5F259F' }]}><Text style={styles.dummyIconText}>Pe</Text></View>
                      <View style={[styles.dummyIcon, { backgroundColor: '#FFF' }]}><Text style={[styles.dummyIconText, { color: '#000' }]}>G</Text></View>
                      <View style={[styles.dummyIcon, { backgroundColor: '#00B9F1' }]}><Text style={styles.dummyIconText}>Pay</Text></View>
                    </View>
                  </View>
                </View>
              </TouchableOpacity>

              <View style={styles.divider} />
            </>
          )}

          {/* Card */}
          <TouchableOpacity 
            style={styles.paymentRow}
            onPress={() => setSelectedMethod("card")}
            activeOpacity={0.8}
          >
            <View style={styles.radioContainer}>
              <View style={[styles.outerCircle, selectedMethod === "card" && styles.outerCircleSelected]}>
                {selectedMethod === "card" && <View style={styles.innerCircle} />}
              </View>
              <View>
                <Text style={styles.methodTitle}>Credit or debit card</Text>
                <View style={styles.iconRow}>
                  <View style={[styles.dummyIcon, { backgroundColor: '#1A1F71', width: 44 }]}><Text style={styles.dummyIconText}>VISA</Text></View>
                  <View style={[styles.dummyIcon, { backgroundColor: '#EB001B', width: 44 }]}><Text style={styles.dummyIconText}>MASTER</Text></View>
                </View>
              </View>
            </View>
          </TouchableOpacity>
        </View>

        <TouchableOpacity 
          activeOpacity={0.8}
          onPress={initiatePayment}
          disabled={isProcessing}
          style={styles.buyButtonContainer}
        >
          <LinearGradient colors={gradients.primary} style={[styles.buyButton, isProcessing && { opacity: 0.7 }]}>
            {isProcessing ? (
              <ActivityIndicator color={colors.label} />
            ) : (
              <Text style={styles.buyButtonText}>Buy Now</Text>
            )}
          </LinearGradient>
        </TouchableOpacity>

        <View style={styles.footer}>
          <Text style={styles.footerText}>{countryName}</Text>
          <Text style={[styles.footerText, { textDecorationLine: 'underline', marginLeft: 16 }]}>Change country</Text>
        </View>

      </ScrollView>
    </LinearGradient>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  header: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    paddingHorizontal: spacing.lg,
    paddingVertical: spacing.lg,
  },
  backButton: {
    padding: 4,
  },
  headerTitle: {
    color: colors.label,
    fontSize: 18,
    fontWeight: "700",
  },
  scrollContent: {
    paddingHorizontal: spacing.lg,
    paddingBottom: 40,
  },
  headerRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: 24,
  },
  changePlanText: {
    color: colors.label,
    textDecorationLine: "underline",
    fontSize: 14,
  },
  planCard: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: 24,
  },
  planCardLeft: {
    flexDirection: "row",
    alignItems: "center",
  },
  appIconBg: {
    width: 48,
    height: 48,
    borderRadius: borderRadius.sm,
    justifyContent: "center",
    alignItems: "center",
    marginRight: 16,
  },
  planTitle: {
    color: colors.label,
    fontSize: 18,
    fontWeight: "700",
    marginBottom: 4,
  },
  planSubtitle: {
    color: colors.secondaryLabel,
    fontSize: 14,
  },
  planCardRight: {
    alignItems: "flex-end",
  },
  planPrice: {
    color: colors.label,
    fontSize: 18,
    fontWeight: "700",
    marginBottom: 4,
  },
  termsContainer: {
    marginBottom: 32,
  },
  termText: {
    color: colors.secondaryLabel,
    fontSize: 14,
    marginBottom: 4,
  },
  sectionTitle: {
    color: colors.label,
    fontSize: 24,
    fontWeight: "700",
    marginBottom: 8,
  },
  sectionSubtitle: {
    color: colors.secondaryLabel,
    fontSize: 14,
    marginBottom: 16,
  },
  addressBox: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    padding: 20,
    backgroundColor: colors.surface,
    borderRadius: borderRadius.sm,
    marginBottom: 32,
    borderWidth: 1,
    borderColor: colors.surfaceBorder,
  },
  addressText: {
    color: colors.label,
    fontSize: 16,
    fontWeight: "600",
    marginBottom: 4,
  },
  addressSubtext: {
    color: colors.secondaryLabel,
    fontSize: 14,
  },
  editText: {
    color: colors.accentSolid,
    fontSize: 16,
    fontWeight: "700",
  },
  paymentMethodsContainer: {
    backgroundColor: colors.surface,
    borderRadius: borderRadius.sm,
    overflow: "hidden",
    marginBottom: 32,
    borderWidth: 1,
    borderColor: colors.surfaceBorder,
  },
  paymentRow: {
    padding: 20,
  },
  divider: {
    height: 1,
    backgroundColor: colors.surfaceBorder,
  },
  radioContainer: {
    flexDirection: "row",
    alignItems: "flex-start",
  },
  outerCircle: {
    width: 24,
    height: 24,
    borderRadius: 12,
    borderWidth: 2,
    borderColor: colors.secondaryLabel,
    justifyContent: "center",
    alignItems: "center",
    marginRight: 16,
    marginTop: 2,
  },
  outerCircleSelected: {
    borderColor: colors.accentSolid,
  },
  innerCircle: {
    width: 12,
    height: 12,
    borderRadius: 6,
    backgroundColor: colors.accentSolid,
  },
  methodTitle: {
    color: colors.label,
    fontSize: 16,
    fontWeight: "600",
    marginBottom: 12,
  },
  iconRow: {
    flexDirection: "row",
    gap: 8,
  },
  dummyIcon: {
    width: 36,
    height: 24,
    backgroundColor: colors.surface,
    borderRadius: 4,
    justifyContent: "center",
    alignItems: "center",
    borderWidth: 1,
    borderColor: colors.surfaceBorder,
  },
  dummyIconText: {
    color: colors.label,
    fontSize: 10,
    fontWeight: "700",
  },
  buyButtonContainer: {
    width: "100%",
  },
  buyButton: {
    width: "100%",
    paddingVertical: 16,
    borderRadius: borderRadius.pill,
    alignItems: "center",
  },
  buyButtonText: {
    color: colors.label,
    fontSize: 16,
    fontWeight: "700",
  },
  footer: {
    flexDirection: "row",
    justifyContent: "center",
    marginTop: 40,
  },
  footerText: {
    color: colors.secondaryLabel,
    fontSize: 14,
  }
});
