import {Platform} from 'react-native';

export const EWR_PRODUCTS = ['ewr_100', 'ewr_500', 'ewr_1000', 'ewr_5000'] as const;
export type EwrProductId = (typeof EWR_PRODUCTS)[number];

export type PurchaseProof = {
  productId: string;
  transactionId?: string | null;
  purchaseToken?: string | null;
  signedTransaction?: string | null;
  store: 'apple' | 'google';
};

export function purchaseProof(purchase: any): PurchaseProof {
  return {
    productId: purchase?.productId ?? '',
    transactionId: purchase?.transactionId ?? purchase?.id ?? null,
    purchaseToken: purchase?.purchaseToken ?? null,
    signedTransaction: purchase?.transactionReceipt ?? purchase?.signedTransactionInfo ?? null,
    store: Platform.OS === 'ios' ? 'apple' : 'google',
  };
}

export function productIsKnown(productId: string): productId is EwrProductId {
  return (EWR_PRODUCTS as readonly string[]).includes(productId);
}
