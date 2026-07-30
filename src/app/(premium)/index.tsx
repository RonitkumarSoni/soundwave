import React from "react";
import { View, Text, StyleSheet, ScrollView, TouchableOpacity, Alert, Linking, Modal, Pressable } from "react-native";
import { LinearGradient } from "expo-linear-gradient";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { Ionicons } from "@expo/vector-icons";
import { colors, gradients, spacing, borderRadius } from "@/theme/colors";
import { useRouter } from "expo-router";
import { useAuthStore } from "@/stores/useAuthStore";

// YOUR REAL UPI ID HERE (e.g. yourname@paytm, number@ybl)
const MY_UPI_ID = "kumarronit739@ybl"; 
const APP_NAME = "Soundwave Premium";
const AMOUNT = "99.00";

export default function PremiumScreen() {
  const insets = useSafeAreaInsets();
  const router = useRouter();
  const { user, upgradeToPremium } = useAuthStore();
  const isPremium = user?.is_premium;

  const [paymentModalVisible, setPaymentModalVisible] = React.useState(false);

  const features = [
    "Ad-free music listening",
    "Download to listen offline",
    "Play songs in any order",
    "High audio quality",
    "Listen with friends in real time",
    "Organize listening queue"
  ];

  const handleSubscribe = () => {
    if (isPremium) {
      router.push("/(home)");
      return;
    }
    router.push("/checkout/step1");
  };

  const initiatePayment = async (appScheme: string) => {
    setPaymentModalVisible(false);
    
    const params = `pa=${MY_UPI_ID}&pn=${encodeURIComponent(APP_NAME)}&am=${AMOUNT}&cu=INR`;
    const genericUpi = `upi://pay?${params}`;
    const specificUpi = appScheme ? `${appScheme}://pay?${params}` : genericUpi;

    try {
      // Try specific app first, then fallback to generic
      let urlToOpen = specificUpi;
      let supported = await Linking.canOpenURL(specificUpi);
      
      if (!supported && appScheme !== '') {
        supported = await Linking.canOpenURL(genericUpi);
        urlToOpen = genericUpi;
      }

      if (supported) {
        await Linking.openURL(urlToOpen);
        
        // Simulate callback verification
        setTimeout(() => {
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
        }, 2000);
      } else {
        Alert.alert("Error", "No UPI app found on your phone. Please install Google Pay, PhonePe, or Paytm.");
      }
    } catch (error) {
      console.error(error);
      Alert.alert("Error", "Something went wrong while opening the payment app.");
    }
  };

  return (
    <LinearGradient
      colors={[gradients.background[0], gradients.background[1], gradients.background[2]]}
      style={styles.container}
    >
      <ScrollView
        contentContainerStyle={{
          paddingTop: insets.top + spacing.xl,
          paddingBottom: 160,
          paddingHorizontal: spacing.lg,
        }}
        showsVerticalScrollIndicator={false}
      >
        <View style={styles.header}>
          <Text style={styles.title}>Get more out of Soundwave with Premium</Text>
        </View>

        <View style={styles.featuresCard}>
          <Text style={styles.cardTitle}>Why join Premium?</Text>
          <View style={styles.divider} />
          {features.map((feature, index) => (
            <View key={index} style={styles.featureRow}>
              <Ionicons name="checkmark-circle" size={24} color={colors.accentSolid} />
              <Text style={styles.featureText}>{feature}</Text>
            </View>
          ))}
        </View>

        <View style={styles.planCard}>
          <View style={styles.planHeader}>
            <Text style={styles.planName}>Premium Individual</Text>
            <View style={styles.planPriceContainer}>
              <Text style={styles.planPrice}>$9.99</Text>
              <Text style={styles.planPeriod}>/ month</Text>
            </View>
          </View>
          <Text style={styles.planDesc}>Cancel anytime. Terms and conditions apply.</Text>
          
          <TouchableOpacity style={[styles.subscribeBtn, isPremium && { backgroundColor: colors.surface }]} onPress={handleSubscribe} activeOpacity={0.8}>
            <Text style={[styles.subscribeBtnText, isPremium && { color: colors.secondaryLabel }]}>
              {isPremium ? "You are already a Premium Member" : "Get Premium"}
            </Text>
          </TouchableOpacity>
        </View>
      </ScrollView>

      {/* Payment Selection Modal */}
      <Modal
        visible={paymentModalVisible}
        transparent={true}
        animationType="slide"
        onRequestClose={() => setPaymentModalVisible(false)}
      >
        <View style={styles.modalOverlay}>
          <Pressable style={styles.modalBackdrop} onPress={() => setPaymentModalVisible(false)} />
          <View style={styles.modalContent}>
            <View style={styles.modalHeader}>
              <Text style={styles.modalTitle}>Complete your payment</Text>
              <Text style={styles.modalSubtitle}>Pay ₹{AMOUNT} to {MY_UPI_ID}</Text>
            </View>
            
            <View style={styles.paymentOptions}>
              <TouchableOpacity style={styles.paymentOption} onPress={() => initiatePayment('gpay')}>
                <Ionicons name="logo-google" size={24} color="#EA4335" />
                <Text style={styles.paymentOptionText}>Google Pay</Text>
                <Ionicons name="chevron-forward" size={20} color={colors.secondaryLabel} />
              </TouchableOpacity>
              
              <TouchableOpacity style={styles.paymentOption} onPress={() => initiatePayment('phonepe')}>
                <Ionicons name="phone-portrait" size={24} color="#5E35B1" />
                <Text style={styles.paymentOptionText}>PhonePe</Text>
                <Ionicons name="chevron-forward" size={20} color={colors.secondaryLabel} />
              </TouchableOpacity>
              
              <TouchableOpacity style={styles.paymentOption} onPress={() => initiatePayment('paytmmp')}>
                <Ionicons name="wallet" size={24} color="#00BAF2" />
                <Text style={styles.paymentOptionText}>Paytm</Text>
                <Ionicons name="chevron-forward" size={20} color={colors.secondaryLabel} />
              </TouchableOpacity>

              <TouchableOpacity style={styles.paymentOption} onPress={() => initiatePayment('')}>
                <Ionicons name="apps" size={24} color={colors.accentSolid} />
                <Text style={styles.paymentOptionText}>Other UPI Apps</Text>
                <Ionicons name="chevron-forward" size={20} color={colors.secondaryLabel} />
              </TouchableOpacity>
            </View>
            
            <TouchableOpacity style={styles.cancelButton} onPress={() => setPaymentModalVisible(false)}>
              <Text style={styles.cancelButtonText}>Cancel</Text>
            </TouchableOpacity>
          </View>
        </View>
      </Modal>

    </LinearGradient>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: colors.background,
  },
  header: {
    marginBottom: spacing.xxl,
  },
  title: {
    fontSize: 32,
    fontWeight: "bold",
    color: colors.label,
    lineHeight: 40,
  },
  featuresCard: {
    backgroundColor: colors.surface,
    borderRadius: borderRadius.lg,
    padding: spacing.xl,
    marginBottom: spacing.xxl,
  },
  cardTitle: {
    fontSize: 18,
    fontWeight: "bold",
    color: colors.label,
    marginBottom: spacing.md,
  },
  divider: {
    height: 1,
    backgroundColor: colors.surfaceBorder,
    marginBottom: spacing.md,
  },
  featureRow: {
    flexDirection: "row",
    alignItems: "center",
    marginBottom: spacing.sm,
  },
  featureText: {
    color: colors.label,
    fontSize: 16,
    marginLeft: spacing.md,
  },
  planCard: {
    backgroundColor: "rgba(255, 255, 255, 0.05)",
    borderWidth: 1,
    borderColor: colors.surfaceBorder,
    borderRadius: borderRadius.lg,
    padding: spacing.xl,
  },
  planHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: spacing.sm,
  },
  planName: {
    fontSize: 20,
    fontWeight: "bold",
    color: colors.label,
  },
  planPriceContainer: {
    alignItems: "flex-end",
  },
  planPrice: {
    fontSize: 24,
    fontWeight: "bold",
    color: colors.label,
  },
  planPeriod: {
    fontSize: 12,
    color: colors.secondaryLabel,
  },
  planDesc: {
    fontSize: 14,
    color: colors.secondaryLabel,
    marginBottom: spacing.xl,
    lineHeight: 20,
  },
  subscribeBtn: {
    backgroundColor: colors.accentSolid,
    paddingVertical: spacing.md,
    borderRadius: 30,
    alignItems: "center",
  },
  subscribeBtnText: {
    color: "#fff",
    fontSize: 16,
    fontWeight: "bold",
  },
  modalOverlay: {
    flex: 1,
    justifyContent: "flex-end",
  },
  modalBackdrop: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: "rgba(0,0,0,0.6)",
  },
  modalContent: {
    backgroundColor: colors.surface,
    borderTopLeftRadius: borderRadius.xl,
    borderTopRightRadius: borderRadius.xl,
    padding: spacing.xl,
    paddingBottom: 40,
  },
  modalHeader: {
    marginBottom: spacing.xl,
    alignItems: "center",
  },
  modalTitle: {
    fontSize: 22,
    fontWeight: "bold",
    color: colors.label,
    marginBottom: 4,
  },
  modalSubtitle: {
    fontSize: 14,
    color: colors.secondaryLabel,
  },
  paymentOptions: {
    marginBottom: spacing.xl,
  },
  paymentOption: {
    flexDirection: "row",
    alignItems: "center",
    paddingVertical: spacing.md,
    borderBottomWidth: StyleSheet.hairlineWidth,
    borderBottomColor: colors.surfaceBorder,
  },
  paymentOptionText: {
    flex: 1,
    fontSize: 18,
    color: colors.label,
    marginLeft: spacing.md,
    fontWeight: "500",
  },
  cancelButton: {
    paddingVertical: spacing.md,
    alignItems: "center",
  },
  cancelButtonText: {
    color: colors.secondaryLabel,
    fontSize: 16,
    fontWeight: "600",
  },
});
