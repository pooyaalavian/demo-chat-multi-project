# Demo App

## Docker

```sh
export CONTAINER=<your-acr>
export IMG_NAME=<your-img>
docker build . -t $CONTAINER.azurecr.io/$IMG_NAME
az login
az acr login -n $CONTAINER
docker push $CONTAINER.azurecr.io/$IMG_NAME
```

```
az login
az acr login -n pooyaamlcr
docker build . -t pooyaamlcr.azurecr.io/bis
docker push pooyaamlcr.azurecr.io/bis
```

## Local

### Pre-reqs

1. Clone this repository.
2. Create a new python virtual env. and activate it.
```sh
# Create env
python -m venv .venv

# activate
## windows
./.venv/Scripts/activate

## Mac/Linux
source ./.venv/bin/activate

# install packages
pip install -r ./api_v2/requirements.txt
```

### Deploy Code
```sh
git fetch && git pull
cd app
rm app.zip && zip -r app.zip .
az webapp deploy --src-path app.zip 
```