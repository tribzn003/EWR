# Earth World Ranking — Beta 4.1

## Native IAP integration RC

This RC adds the native in-app purchase layer through `expo-iap` / OpenIAP.

Products:
- `ewr_100`
- `ewr_500`
- `ewr_1000`
- `ewr_5000`

The app never grants credits locally. A purchase is forwarded to EWR's backend, which verifies it with Apple or Google. Only a backend-confirmed transaction can change the ledger, credits, and ranking.

### Platform flow

Android: Play Billing → purchase token → `/api/v1/payments/google/verify` → ledger → credits → ranking.

iOS: StoreKit → signed transaction/JWS → `/api/v1/payments/apple/verify` → ledger → credits → ranking.

### Important

`expo-iap` is a native module, so Expo Go is not sufficient; use a custom development build/EAS build. The current environment does not contain Android SDK tooling or store credentials, so this RC is source/config only and has not been claimed as a built APK/IPA.

Before production, configure the exact product IDs in App Store Connect and Google Play Console and test sandbox/internal-track purchases end-to-end.
