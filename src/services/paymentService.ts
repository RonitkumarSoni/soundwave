import axios from 'axios';
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
export const createPaymentOrder=()=>call<{order_id:string;key_id:string;amount:number;currency:string;days:number;mode:'test'}>('orders',{});
export const verifyPayment=(data:{order_id:string;payment_id:string;signature:string})=>call<{verified:boolean}>('verify',data);
export async function payForPremium():Promise<void> { throw new Error('Payments require the installed Android build'); }
