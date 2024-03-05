# Demo App

## Deployment for Docker

```sh
export CONTAINER=<your-acr>
export IMG_NAME=<your-img>
docker build . -t $CONTAINER.azurecr.io/$IMG_NAME
az login
az acr login -n $CONTAINER
docker push $CONTAINER.azurecr.io/$IMG_NAME
```