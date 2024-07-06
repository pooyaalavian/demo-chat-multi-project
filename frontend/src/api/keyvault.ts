import { DefaultAzureCredential } from "@azure/identity";
import { SecretClient } from "@azure/keyvault-secrets";
import NodeCache from "node-cache"; // Install this package using npm or yarn

// Create a custom cache with TTL
const myCache = new NodeCache({ stdTTL: 3600 }); // Set TTL in seconds

export async function getSecretFromKeyVault(vaultUrl: string, secretName: string): Promise<string|null> {
    const cachedValue = <string>myCache.get(secretName);
    if (cachedValue) {
        return cachedValue;
    }

    try {
        // Create a DefaultAzureCredential to use managed identity
        const credential = new DefaultAzureCredential();

        // Create a SecretClient
        const secretClient = new SecretClient(vaultUrl, credential);

        // Retrieve the secret value
        const secretValue = await secretClient.getSecret(secretName);

        // Cache the secret value
        myCache.set(secretName, secretValue.value);

        return <string>secretValue.value;
    } catch (error: any) {
        return error;
    }
}