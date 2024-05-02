# check if variables exist
if [ -z "$RESOURCE_GROUP" ]; then
    echo "RESOURCE_GROUP is not set"
    exit 1
fi
if [ -z "$WEBAPP_NAME" ]; then
    echo "WEBAPP_NAME is not set"
    exit 1
fi
if [ -z "$FNAPP_NAME" ]; then
    echo "FNAPP_NAME is not set"
    exit 1
fi

# fetch latest code
echo "Fetching latest code: "
echo "  - running: git fetch && git pull"
git fetch && git pull

# deploy webapp
echo "Deploying webapp"
echo "  - running: cd webapp"
cd webapp
echo "  - running: rm app.zip && zip -r app.zip ."
rm app.zip && zip -r app.zip .
echo "  - running: az webapp deploy --name $WEBAPP_NAME --resource-group $RESOURCE_GROUP --src-path app.zip"
az webapp deploy --name $WEBAPP_NAME --resource-group $RESOURCE_GROUP --src-path app.zip
echo "  - running: cd .."
cd ..

# deploy function app
echo "Deploying function app"
echo "  - running: cd fnapp"
cd fnapp
echo "  - running: rm app.zip && zip -r app.zip ."
rm app.zip && zip -r app.zip .
echo "  - running: func azure functionapp publish $FNAPP_NAME --build remote --python"
func azure functionapp publish $FNAPP_NAME --build remote --python
