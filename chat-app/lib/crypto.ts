// lib/crypto.ts

export async function generateKey(): Promise<CryptoKey> {
    return window.crypto.subtle.generateKey(
        {
            name: "AES-GCM",
            length: 256,
        },
        true,
        ["encrypt", "decrypt"]
    );
}

export async function exportKey(key: CryptoKey): Promise<string> {
    const exported = await window.crypto.subtle.exportKey("jwk", key);
    return JSON.stringify(exported); // Simple encapsulation, though sending as base64 string from raw bytes is shorter, JWK is robust.
}

export async function importKey(jwkString: string): Promise<CryptoKey> {
    const jwk = JSON.parse(jwkString);
    return window.crypto.subtle.importKey(
        "jwk",
        jwk,
        {
            name: "AES-GCM",
            length: 256,
        },
        true,
        ["encrypt", "decrypt"]
    );
}

// AES-GCM requires an IV (Initialization Vector). We can prepend it to the ciphertext.
export async function encryptMessage(message: string, key: CryptoKey): Promise<string> {
    const encoder = new TextEncoder();
    const data = encoder.encode(message);
    const iv = window.crypto.getRandomValues(new Uint8Array(12)); // 96-bit IV standard for GCM

    const ciphertextBuffer = await window.crypto.subtle.encrypt(
        {
            name: "AES-GCM",
            iv: iv,
        },
        key,
        data
    );

    // Combine IV + Ciphertext
    const ciphertextArray = new Uint8Array(ciphertextBuffer);
    const bundle = new Uint8Array(iv.length + ciphertextArray.length);
    bundle.set(iv, 0);
    bundle.set(ciphertextArray, iv.length);

    // Convert to Base64 to send over socket string
    return Buffer.from(bundle).toString('base64');
}

export async function decryptMessage(bundleBase64: string, key: CryptoKey): Promise<string> {
    const bundle = Buffer.from(bundleBase64, 'base64');
    const iv = bundle.slice(0, 12);
    const ciphertext = bundle.slice(12);

    const decryptedBuffer = await window.crypto.subtle.decrypt(
        {
            name: "AES-GCM",
            iv: iv,
        },
        key,
        ciphertext
    );

    const decoder = new TextDecoder();
    return decoder.decode(decryptedBuffer);
}
