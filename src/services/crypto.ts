import { gcm } from '@noble/ciphers/aes.js';
import * as Crypto from 'expo-crypto';
import * as SecureStore from 'expo-secure-store';

// One 256-bit key protects the database (SQLCipher) and every stored document file.
// It lives in the Keychain, never leaves this device, and is only loaded after a biometric unlock.
const MASTER_KEY_NAME = 'mi.masterKey';
const MASTER_KEY_OPTIONS: SecureStore.SecureStoreOptions = {
  keychainAccessible: SecureStore.WHEN_PASSCODE_SET_THIS_DEVICE_ONLY,
};

const KEY_BYTES = 32;
const NONCE_BYTES = 12;
// Leading byte of every sealed blob, so the format can change later without guessing.
const FORMAT_VERSION = 1;

// Held in memory only while the vault is unlocked. clearMasterKey() wipes it on lock.
let masterKey: Uint8Array | null = null;

// Loads the key from the Keychain, creating it on first launch. Called by AppLock after Face ID / Touch ID.
// Throws if the device has no passcode, because the Keychain refuses the write.
export async function unlockMasterKey(): Promise<void> {
  if (masterKey) return;

  const stored = await SecureStore.getItemAsync(MASTER_KEY_NAME, MASTER_KEY_OPTIONS);
  if (stored) {
    masterKey = hexToBytes(stored);
    return;
  }

  const created = Crypto.getRandomBytes(KEY_BYTES);
  await SecureStore.setItemAsync(MASTER_KEY_NAME, bytesToHex(created), MASTER_KEY_OPTIONS);
  masterKey = created;
}

export function clearMasterKey(): void {
  masterKey?.fill(0);
  masterKey = null;
}

// The statement SQLCipher needs right after the database opens. Uses the raw-key form, so no passphrase
// derivation runs at each open.
export function sqlCipherKeyStatement(): string {
  return `PRAGMA key = "x'${bytesToHex(requireMasterKey())}'"`;
}

// Output layout: version (1 byte) | nonce (12 bytes) | ciphertext + authentication tag.
export function sealBytes(plain: Uint8Array): Uint8Array {
  const nonce = Crypto.getRandomBytes(NONCE_BYTES);
  const cipherText = gcm(requireMasterKey(), nonce).encrypt(plain);

  const sealed = new Uint8Array(1 + NONCE_BYTES + cipherText.length);
  sealed[0] = FORMAT_VERSION;
  sealed.set(nonce, 1);
  sealed.set(cipherText, 1 + NONCE_BYTES);
  return sealed;
}

// Throws if the blob was altered or the key is wrong: GCM authenticates the data before returning it.
export function openBytes(sealed: Uint8Array): Uint8Array {
  if (sealed[0] !== FORMAT_VERSION) throw new Error('Unknown encrypted format');

  const nonce = sealed.subarray(1, 1 + NONCE_BYTES);
  return gcm(requireMasterKey(), nonce).decrypt(sealed.subarray(1 + NONCE_BYTES));
}

function requireMasterKey(): Uint8Array {
  if (!masterKey) throw new Error('The vault is locked');
  return masterKey;
}

function bytesToHex(bytes: Uint8Array): string {
  return Array.from(bytes, (byte) => byte.toString(16).padStart(2, '0')).join('');
}

function hexToBytes(hex: string): Uint8Array {
  const bytes = new Uint8Array(hex.length / 2);
  for (let index = 0; index < bytes.length; index += 1) {
    bytes[index] = parseInt(hex.slice(index * 2, index * 2 + 2), 16);
  }
  return bytes;
}
