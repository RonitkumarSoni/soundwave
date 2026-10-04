declare module 'react-native-razorpay' {
  interface CheckoutOptions {
    key: string; order_id: string; amount: number; currency: string;
    name: string; description: string;
    prefill?: { email?: string; name?: string; contact?: string };
    theme?: { color: string };
  }
  interface CheckoutResult {
    razorpay_payment_id: string;
    razorpay_order_id: string;
    razorpay_signature: string;
  }
  const RazorpayCheckout: { open(options: CheckoutOptions): Promise<CheckoutResult> };
  export default RazorpayCheckout;
}
