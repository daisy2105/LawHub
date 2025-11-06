const crypto = require('crypto');

// Simple encryption utility for chat messages
class MessageEncryption {
    constructor() {
        // Use a fixed secret key for demo (in production, use proper key management)
        this.secretKey = process.env.ENCRYPTION_KEY || 'lawhub-chat-secret-key-32chars!';
        this.algorithm = 'aes-256-cbc';
    }

    // Encrypt a message
    encrypt(text) {
        try {
            // Generate a proper 32-byte key from our secret
            const key = crypto.scryptSync(this.secretKey, 'salt', 32);
            const iv = crypto.randomBytes(16);
            
            const cipher = crypto.createCipheriv(this.algorithm, key, iv);
            let encrypted = cipher.update(text, 'utf8', 'hex');
            encrypted += cipher.final('hex');
            
            // Return IV + encrypted text (separated by :)
            return iv.toString('hex') + ':' + encrypted;
        } catch (error) {
            console.error('Encryption error:', error);
            return text; // Return original text if encryption fails
        }
    }

    // Decrypt a message
    decrypt(encryptedText) {
        try {
            // Handle different encryption formats
            
            // Case 1: CryptoJS format (starts with U2FsdGVkX1)
            if (encryptedText && encryptedText.startsWith('U2FsdGVkX1')) {
                // This is CryptoJS encrypted message - we shouldn't decrypt it server-side
                // The frontend handles this encryption/decryption
                // For now, return as-is since frontend will handle decryption
                console.log('⚠️ CryptoJS encrypted message detected - frontend should handle decryption');
                return encryptedText;
            }
            
            // Case 2: Our IV:encrypted format
            if (encryptedText && encryptedText.includes(':')) {
                const parts = encryptedText.split(':');
                if (parts.length === 2 && parts[0].length === 32) {
                    const iv = Buffer.from(parts[0], 'hex');
                    const encryptedData = parts[1];
                    
                    // Generate the same key used for encryption
                    const key = crypto.scryptSync(this.secretKey, 'salt', 32);
                    
                    const decipher = crypto.createDecipheriv(this.algorithm, key, iv);
                    let decrypted = decipher.update(encryptedData, 'hex', 'utf8');
                    decrypted += decipher.final('utf8');
                    
                    return decrypted;
                }
            }
            
            // Case 3: Plain text (not encrypted)
            // If it doesn't match any encrypted format, return as-is
            return encryptedText;
            
        } catch (error) {
            console.error('Decryption error:', error);
            console.error('Failed to decrypt:', encryptedText);
            
            // Return original text if decryption fails
            return encryptedText;
        }
    }

    // Check if text appears to be encrypted
    isEncrypted(text) {
        if (!text) return false;
        
        // Check for CryptoJS format
        if (text.startsWith('U2FsdGVkX1')) return true;
        
        // Check for our IV:encrypted format
        if (text.includes(':') && text.split(':').length === 2 && 
            text.split(':')[0].length === 32) return true;
        
        return false;
    }
}

module.exports = new MessageEncryption();