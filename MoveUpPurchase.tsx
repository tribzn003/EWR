import React, {useEffect, useMemo, useState} from 'react';
import {Alert, Platform, Pressable, Text, View} from 'react-native';
import {useIAP} from 'expo-iap';
import {EWR_PRODUCTS, productIsKnown, purchaseProof} from './iap';

export default function MoveUpPurchase({token, apiBase, onSuccess}:{token:string;apiBase:string;onSuccess:()=>void}) {
  const [busy, setBusy] = useState(false);
  const ids = useMemo(() => [...EWR_PRODUCTS], []);
  const {connected, products, fetchProducts, requestPurchase, finishTransaction} = useIAP({
    onPurchaseSuccess: async (purchase:any) => {
      try {
        if (!productIsKnown(purchase?.productId ?? '')) throw new Error('Unknown EWR product');
        setBusy(true);
        const proof = purchaseProof(purchase);
        const path = Platform.OS === 'ios' ? '/payments/apple/verify' : '/payments/google/verify';
        const body = Platform.OS === 'ios'
          ? {product_id: proof.productId, transaction_id: proof.transactionId, signed_transaction: proof.signedTransaction}
          : {product_id: proof.productId, purchase_token: proof.purchaseToken};
        const response = await fetch(apiBase + path, {
          method:'POST',
          headers:{'Content-Type':'application/json',Authorization:`Bearer ${token}`,'Idempotency-Key':String(proof.transactionId ?? proof.purchaseToken)},
          body:JSON.stringify(body)
        });
        if (!response.ok) throw new Error(`Server verification failed (${response.status})`);
        await finishTransaction({purchase, isConsumable:true});
        onSuccess();
        Alert.alert('POSITION UPDATED','Your EWR Credits were verified and applied.');
      } catch (e:any) {
        Alert.alert('Payment pending', e?.message ?? 'The purchase could not be verified yet.');
      } finally { setBusy(false); }
    },
    onPurchaseError: (error:any) => {
      if (error?.code !== 'user-cancelled') Alert.alert('Payment error', error?.message ?? 'Purchase failed.');
    },
  });

  useEffect(() => { if (connected) fetchProducts({skus:ids,type:'in-app'}).catch(()=>{}); }, [connected, ids.join(',')]);

  return <View>
    {ids.map(id => {
      const product:any = products.find((p:any)=>p.id===id);
      return <Pressable key={id} disabled={!connected || busy} onPress={()=>requestPurchase({request:{apple:{sku:id},google:{skus:[id]}},type:'in-app'})} style={{padding:16,marginTop:10,borderRadius:12,backgroundColor:'#111'}}>
        <Text style={{color:'#fff',fontWeight:'800',textAlign:'center'}}>{product?.displayPrice ?? id.replace('ewr_','')+' CREDITS'}</Text>
      </Pressable>;
    })}
    <Text style={{color:'#777',marginTop:12,textAlign:'center'}}>{connected ? (busy ? 'VERIFYING…' : 'Purchase is verified server-side.') : 'Connecting to store…'}</Text>
  </View>;
}
