from jwt import decode, get_unverified_header
from jwt.algorithms import RSAAlgorithm
import os
import requests
import json
from cryptography.hazmat.primitives import serialization
from logging import getLogger
from src.keyvault import get_secret_from_keyvault

logger = getLogger(__name__)

payload = None


async def getKey(kid: str):
    global payload
    if payload is None:
        keys_url = f"https://login.microsoftonline.com/{get_secret_from_keyvault(os.getenv('ENTRA_TENANT_ID'))}/discovery/v2.0/keys"
        payload = requests.get(keys_url).json()

    for key in payload["keys"]:
        if key["kid"] == kid:
            public_key = RSAAlgorithm.from_jwk(key)
            pb = public_key.public_bytes(
                encoding=serialization.Encoding.PEM,
                format=serialization.PublicFormat.SubjectPublicKeyInfo,
            )
            return public_key, pb


async def extractUser(token: str):
    try:
        hdr = get_unverified_header(token)
        alg = hdr["alg"]
        kid = hdr["kid"]
        key, _ = await getKey(kid)
        decoded = decode(
            token, key, algorithms=[alg], audience=get_secret_from_keyvault(os.getenv("ENTRA_CLIENT_ID"))
        )
        user = {
            "firstName": decoded["given_name"],
            "lastName": decoded["family_name"],
            "email": decoded.get(
                "preferred_username",
                decoded.get("email", "")
            ),
            "id": decoded["oid"],
            "userId": decoded["oid"],
            "roles": decoded.get("roles",[]),
        }
        logger.debug(f"User: {user['userId']} / {user['email']} extracted")
        return user
    except Exception as e:
        print(e)
