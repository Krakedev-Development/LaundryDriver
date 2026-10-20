import * as Crypto from "expo-crypto";

export const passwordHash = (password: string) =>
  Crypto.digestStringAsync(Crypto.CryptoDigestAlgorithm.SHA256, password);
