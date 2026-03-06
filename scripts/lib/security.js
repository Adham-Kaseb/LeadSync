/**
 * LeadSync Security Service
 * Professional-grade encryption and key management using Web Crypto API.
 */
export const Security = {
    ALGO: 'AES-GCM',
    KEY_LEN: 256,
    ITERATIONS: 100000,

    /**
     * Derives a cryptographic key from a password and salt using PBKDF2
     */
    async deriveKey(password, salt) {
        const encoder = new TextEncoder();
        const passwordBuffer = encoder.encode(password);
        
        const baseKey = await crypto.subtle.importKey(
            'raw',
            passwordBuffer,
            { name: 'PBKDF2' },
            false,
            ['deriveKey']
        );

        return await crypto.subtle.deriveKey(
            {
                name: 'PBKDF2',
                salt: salt,
                iterations: this.ITERATIONS,
                hash: 'SHA-256'
            },
            baseKey,
            { name: this.ALGO, length: this.KEY_LEN },
            true, // extractable
            ['encrypt', 'decrypt']
        );
    },

    /**
     * Encrypts a string using a derived key
     * Returns a base64 string containing: salt + iv + ciphertext
     */
    async encrypt(plainText, password) {
        const encoder = new TextEncoder();
        const data = encoder.encode(plainText);
        
        const salt = crypto.getRandomValues(new Uint8Array(16));
        const key = await this.deriveKey(password, salt);
        
        const iv = crypto.getRandomValues(new Uint8Array(12));
        const encrypted = await crypto.subtle.encrypt(
            { name: this.ALGO, iv: iv },
            key,
            data
        );

        // Combine salt, iv, and encrypted data
        const result = new Uint8Array(salt.byteLength + iv.byteLength + encrypted.byteLength);
        result.set(salt, 0);
        result.set(iv, salt.byteLength);
        result.set(new Uint8Array(encrypted), salt.byteLength + iv.byteLength);

        return btoa(String.fromCharCode(...result));
    },

    /**
     * Decrypts a base64 string using the provided password
     */
    async decrypt(encodedData, password) {
        try {
            const raw = new Uint8Array(atob(encodedData).split('').map(c => c.charCodeAt(0)));
            
            const saltSize = 16;
            const ivSize = 12;
            
            const salt = raw.slice(0, saltSize);
            const iv = raw.slice(saltSize, saltSize + ivSize);
            const cipherText = raw.slice(saltSize + ivSize);
            
            const key = await this.deriveKey(password, salt);
            
            const decrypted = await crypto.subtle.decrypt(
                { name: this.ALGO, iv: iv },
                key,
                cipherText
            );

            return new TextDecoder().decode(decrypted);
        } catch (e) {
            console.error('Decryption failed:', e);
            throw new Error('Invalid PIN or corrupted data');
        }
    },

    /**
     * Generates a verification hash to check if a password is correct 
     * without exposing the data encryption key.
     */
    async hashPassword(password, salt) {
        const encoder = new TextEncoder();
        const data = encoder.encode(password + (salt || 'LEADSYNC_SALT'));
        const hash = await crypto.subtle.digest('SHA-256', data);
        return btoa(String.fromCharCode(...new Uint8Array(hash)));
    }
};
