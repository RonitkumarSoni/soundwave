import React,{useEffect,useState} from 'react';
import { Text,TouchableOpacity,StyleSheet,ActivityIndicator,Platform } from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useRouter } from 'expo-router';
import Toast from 'react-native-toast-message';
import { useAuthStore } from '@/stores/useAuthStore';
import { billingConfig,payForPremium,BillingConfig } from '@/services/paymentService';
import { auth } from '@/lib/firebase';
export default function PremiumScreen(){
 const insets=useSafeAreaInsets(),router=useRouter();
 const premium=useAuthStore(s=>s.user?.is_premium===true);
 const [config,setConfig]=useState<BillingConfig|null>(null),[busy,setBusy]=useState(false),[error,setError]=useState('');
 useEffect(()=>{let active=true;billingConfig().then(c=>{if(active)setConfig(c)}).catch(()=>{if(active)setError('Payment service is unavailable. Please retry later.')});return()=>{active=false}},[]);
 const purchase=async()=>{if(busy)return;setBusy(true);try{await payForPremium();await useAuthStore.getState().syncUser(auth.currentUser);Toast.show({type:'success',text1:'Test payment verified',text2:'Your access is active for 30 days'});}catch(e){const message=e instanceof Error?e.message:'Payment cancelled or verification pending. Please retry.';Toast.show({type:'error',text1:message});}finally{setBusy(false)}};
 return <LinearGradient colors={['#170B2E','#0A0514']} style={[styles.page,{paddingTop:insets.top+24}]}>
 <Text style={styles.title}>Soundwave Premium</Text>
 <Text style={styles.description}>{premium?'Your subscription is active':'₹99 · 30 days'}</Text>
 <Text style={styles.description}>Offline downloads for supported tracks. Spotify Premium is separate.</Text>
 {config?.enabled&&Platform.OS==='android'?<><Text style={styles.description}>TEST MODE — no real money is charged. This is a test purchase, not an automatic subscription.</Text><TouchableOpacity disabled={busy} onPress={()=>{void purchase()}} style={styles.button}>{busy?<ActivityIndicator color="#FFF"/>:<Text style={styles.buttonText}>Test purchase · ₹99</Text>}</TouchableOpacity></>:<Text style={styles.description}>{error||'Purchases unavailable on this build/server.'}</Text>}
 {premium&&<TouchableOpacity onPress={()=>router.push('/downloads')} style={styles.button}><Text style={styles.buttonText}>Manage downloads</Text></TouchableOpacity>}
 </LinearGradient>;
}
const styles=StyleSheet.create({page:{flex:1,paddingHorizontal:24},title:{fontSize:28,fontWeight:'700',color:'#FFF'},description:{fontSize:16,lineHeight:25,color:'#B9A9D9',marginTop:20},button:{minHeight:48,justifyContent:'center',marginTop:20,backgroundColor:'#7047EB',borderRadius:12,paddingHorizontal:16},buttonText:{color:'#FFF',fontSize:18}});
