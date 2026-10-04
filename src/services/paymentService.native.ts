import axios from 'axios';
import Constants from 'expo-constants';
import { auth } from '@/lib/firebase';
import { API_BASE } from '@/lib/config';
export interface BillingConfig { enabled:boolean;mode:'test';amount:number;currency:string;days:number; }
async function call<T>(path:string,data?:unknown):Promise<T> {
 const user=auth.currentUser;
 if (!user || !user.emailVerified) throw new Error('Verify your email and sign in to continue');
 const token=await user.getIdToken();
 const response=await axios.request<T>({url:API_BASE+'/billing/'+path,method:data===undefined?'GET':'POST',data,headers:{Authorization:'Bearer '+token},timeout:20000});
 return response.data;
}
export const billingConfig=()=>call<BillingConfig>('config');
export async function payForPremium():Promise<void> {
 if(Constants.executionEnvironment==='storeClient')throw new Error('Razorpay requires the installed APK, not Expo Go');
 const user=auth.currentUser;if(!user)throw new Error('Sign in to continue');
 const sdk=await import('react-native-razorpay');
 const order=await call<{order_id:string;key_id:string;amount:number;currency:string}>('orders',{});
 const result=await sdk.default.open({key:order.key_id,order_id:order.order_id,amount:order.amount,currency:order.currency,name:'Soundwave',description:'TEST: Premium access for 30 days',prefill:{email:user.email||'',name:user.displayName||''},theme:{color:'#7047EB'}});
 if(auth.currentUser?.uid!==user.uid)throw new Error('Account changed. Sign back in to verify this payment');
 await call('verify',{order_id:order.order_id,payment_id:result.razorpay_payment_id,signature:result.razorpay_signature});
}
