"""
Encryption and decryption utilities for sensitive payment details
"""
import logging
from cryptography.fernet import Fernet
from app.core.config import settings

logger = logging.getLogger(__name__)

# Fallback transient key for local dev if setting is default or invalid
_transient_key = Fernet.generate_key()


def get_fernet() -> Fernet:
    """Initialize and return a Fernet instance using the configured ENCRYPTION_KEY"""
    key_str = getattr(settings, "ENCRYPTION_KEY", None)
    
    # Check if key is empty or is the default/fallback key
    if not key_str or key_str == "your-fallback-encryption-key-change-in-prod":
        logger.warning(
            "WARNING: ENCRYPTION_KEY is not configured or using default key. "
            "Falling back to transient key. Data encrypted in this session will not persist across app restarts!"
        )
        return Fernet(_transient_key)
        
    try:
        return Fernet(key_str.encode())
    except Exception as e:
        logger.error(
            f"Failed to initialize Fernet with ENCRYPTION_KEY: {e}. "
            "Falling back to transient key."
        )
        return Fernet(_transient_key)


def encrypt_data(data: str) -> str:
    """Encrypt a string and return a base64 encoded ciphertext string"""
    if not data:
        return ""
    fernet = get_fernet()
    return fernet.encrypt(data.encode()).decode()


def decrypt_data(ciphertext: str) -> str:
    """Decrypt a ciphertext string and return the plaintext string"""
    if not ciphertext:
        return ""
    fernet = get_fernet()
    try:
        return fernet.decrypt(ciphertext.encode()).decode()
    except Exception as e:
        logger.error(f"Failed to decrypt data: {e}")
        raise ValueError("Decryption failed. Invalid key or corrupted data.")
