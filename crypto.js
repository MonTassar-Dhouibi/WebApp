import * as secp from '@noble/secp256k1';
import { sha256 } from '@noble/hashes/sha2.js';
import { ripemd160 } from '@noble/hashes/legacy.js';
import { base58 } from '@scure/base';

function hexToBytes(hex) {
    const bytes = new Uint8Array(hex.length / 2);
    for (let i = 0; i < bytes.length; i++) {
        bytes[i] = parseInt(hex.substring(i * 2, i * 2 + 2), 16);
    }
    return bytes;
}

export function deriveKeyData(hexPrivateKey) {
    try {
        const privKeyBytes = hexToBytes(hexPrivateKey);
        
        // Derive Compressed Public Key (33 bytes)
        const pubKey = secp.getPublicKey(privKeyBytes, true); 
        
        const sha256Hash = sha256(pubKey);
        const ripemd160Hash = ripemd160(sha256Hash);
        
        const payload = new Uint8Array(1 + ripemd160Hash.length);
        payload[0] = 0x00; 
        payload.set(ripemd160Hash, 1);
        
        const hash1 = sha256(payload);
        const hash2 = sha256(hash1);
        const checksum = hash2.slice(0, 4);
        
        const finalPayload = new Uint8Array(payload.length + checksum.length);
        finalPayload.set(payload);
        finalPayload.set(checksum, payload.length);
        
        // Convert the 33-byte PubKey array to a Hex String
        let pubKeyHex = "";
        for (let i = 0; i < pubKey.length; i++) {
            pubKeyHex += pubKey[i].toString(16).padStart(2, '0');
        }

        return {
            address: base58.encode(finalPayload),
            pubKeyHex: pubKeyHex
        };
    } catch (error) {
        return { address: "Invalid Key", pubKeyHex: "" };
    }
}
