from azure.identity import DefaultAzureCredential
from azure.keyvault.secrets import SecretClient
import time
import os

KEYVAULT_URL = os.getenv('AZURE_KEYVAULT_ENDPOINT')

# Create a custom cache with TTL
class CustomCache:
    def __init__(self, maxsize=None, ttl_seconds=3600):
        self.cache = {}
        self.maxsize = maxsize
        self.ttl_seconds = ttl_seconds

    def get(self, key):
        if key in self.cache:
            value, timestamp = self.cache[key]
            if time.time() - timestamp <= self.ttl_seconds:
                return value
            else:
                del self.cache[key]
        return None

    def set(self, key, value):
        if self.maxsize is not None and len(self.cache) >= self.maxsize:
            # Evict the oldest item if cache is full
            oldest_key = min(self.cache, key=lambda k: self.cache[k][1])
            del self.cache[oldest_key]
        self.cache[key] = (value, time.time())

# Create a cache instance
my_cache = CustomCache(maxsize=100, ttl_seconds=3600)

def get_secret_from_keyvault(secret_name):
    cached_value = my_cache.get(secret_name)
    if cached_value:
        return cached_value

    try:
        # Create a DefaultAzureCredential to use managed identity
        credential = DefaultAzureCredential()

        # Create a SecretClient
        secret_client = SecretClient(KEYVAULT_URL, credential)

        # Retrieve the secret value
        secret_value = secret_client.get_secret(secret_name).value

        # Cache the secret value
        my_cache.set(secret_name, secret_value)

        return secret_value
    except Exception as e:
        print(f"Error retrieving secret: {str(e)}")
        return None