import React, { useState } from "react";
import { View, Text, StyleSheet, TouchableOpacity, ScrollView } from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { useRouter } from "expo-router";
import { Feather, Ionicons } from "@expo/vector-icons";
import { LinearGradient } from "expo-linear-gradient";
import { useCountryPricing } from "@/hooks/useCountryPricing";
import { colors, gradients, spacing, borderRadius } from "@/theme/colors";

export default function CheckoutStep1() {
  const insets = useSafeAreaInsets();
  const router = useRouter();
  const { countryName, currencySymbol, price, isIndia, isLoading } = useCountryPricing();
  const [selectedMethod, setSelectedMethod] = useState<"soundwave" | "google">("soundwave");

  if (isLoading) return null;

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
        <Text style={styles.headerTitle}>Checkout</Text>
        <View style={{ width: 24 }} />
      </View>

      <ScrollView contentContainerStyle={styles.scrollContent}>
        {/* Change Plan */}
        <TouchableOpacity style={styles.changePlanBtn}>
          <Text style={styles.changePlanText}>Change plan</Text>
        </TouchableOpacity>

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

        {/* Choose how to pay */}
        <Text style={styles.sectionTitle}>Choose how to pay</Text>
        <Text style={styles.sectionSubtitle}>
          You can pay directly through Soundwave or using your Google Play account.
        </Text>

        <View style={styles.paymentMethodsRow}>
          <TouchableOpacity 
            style={[styles.methodBox, selectedMethod === "soundwave" && styles.methodBoxSelected]}
            onPress={() => setSelectedMethod("soundwave")}
            activeOpacity={0.8}
          >
            <Ionicons name="musical-notes" size={18} color={selectedMethod === "soundwave" ? colors.accentSolid : colors.label} style={{ marginRight: 8 }} />
            <Text style={[styles.methodText, selectedMethod === "soundwave" && { color: colors.accentSolid }]}>Soundwave</Text>
          </TouchableOpacity>
          
          <TouchableOpacity 
            style={[styles.methodBox, selectedMethod === "google" && styles.methodBoxSelected]}
            onPress={() => setSelectedMethod("google")}
            activeOpacity={0.8}
          >
            <Ionicons name="logo-google-playstore" size={18} color={selectedMethod === "google" ? colors.accentSolid : colors.label} style={{ marginRight: 8 }} />
            <Text style={[styles.methodText, selectedMethod === "google" && { color: colors.accentSolid }]}>Google Play</Text>
          </TouchableOpacity>
        </View>

        {selectedMethod === "soundwave" && (
          <View style={styles.paymentDetails}>
            <Text style={styles.detailsText}>
              Pay through <Text style={{ fontWeight: "700", color: colors.label }}>Soundwave</Text> with any supported payment method.
            </Text>
            
            <View style={styles.iconRow}>
              {isIndia ? (
                <>
                  <View style={styles.dummyIcon}><Text style={styles.dummyIconText}>BHIM</Text></View>
                  <View style={[styles.dummyIcon, { backgroundColor: '#5F259F' }]}><Text style={styles.dummyIconText}>Pe</Text></View>
                  <View style={[styles.dummyIcon, { backgroundColor: '#FFF' }]}><Text style={[styles.dummyIconText, { color: '#000' }]}>G</Text></View>
                  <View style={[styles.dummyIcon, { backgroundColor: '#00B9F1' }]}><Text style={styles.dummyIconText}>Pay</Text></View>
                  <View style={[styles.dummyIcon, { backgroundColor: colors.surfaceElevated }]}><Text style={styles.dummyIconText}>+ 18</Text></View>
                </>
              ) : (
                <>
                  <View style={[styles.dummyIcon, { backgroundColor: '#1A1F71', width: 44 }]}><Text style={styles.dummyIconText}>VISA</Text></View>
                  <View style={[styles.dummyIcon, { backgroundColor: '#EB001B', width: 44 }]}><Text style={styles.dummyIconText}>MASTER</Text></View>
                  <View style={[styles.dummyIcon, { backgroundColor: '#003087', width: 44 }]}><Text style={styles.dummyIconText}>PAYPAL</Text></View>
                </>
              )}
            </View>

            <TouchableOpacity 
              activeOpacity={0.8}
              onPress={() => router.push("/checkout/step2")}
              style={styles.continueButtonContainer}
            >
              <LinearGradient colors={gradients.primary} style={styles.continueButton}>
                <Text style={styles.continueButtonText}>Continue with Soundwave</Text>
              </LinearGradient>
            </TouchableOpacity>
          </View>
        )}

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
  changePlanBtn: {
    alignSelf: "flex-end",
    marginBottom: spacing.lg,
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
    marginBottom: 24,
    lineHeight: 20,
  },
  paymentMethodsRow: {
    flexDirection: "row",
    gap: 12,
    marginBottom: 16,
  },
  methodBox: {
    flex: 1,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    paddingVertical: 16,
    backgroundColor: colors.surface,
    borderRadius: borderRadius.sm,
    borderWidth: 1,
    borderColor: colors.surfaceBorder,
  },
  methodBoxSelected: {
    borderColor: colors.accentSolid,
    backgroundColor: colors.surfaceElevated,
  },
  methodText: {
    color: colors.label,
    fontSize: 16,
    fontWeight: "600",
  },
  paymentDetails: {
    backgroundColor: colors.surfaceElevated,
    borderRadius: borderRadius.sm,
    padding: 20,
    alignItems: "center",
    marginTop: -8, // slight overlap visual fix
    borderWidth: 1,
    borderColor: colors.surfaceBorder,
  },
  detailsText: {
    color: colors.secondaryLabel,
    fontSize: 14,
    textAlign: "center",
    marginBottom: 20,
    lineHeight: 20,
  },
  iconRow: {
    flexDirection: "row",
    gap: 8,
    marginBottom: 24,
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
  continueButtonContainer: {
    width: "100%",
  },
  continueButton: {
    width: "100%",
    paddingVertical: 16,
    borderRadius: borderRadius.pill,
    alignItems: "center",
  },
  continueButtonText: {
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
