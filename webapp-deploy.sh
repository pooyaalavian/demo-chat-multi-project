cd app
git fetch && git pull
rm app.zip
zip -r app.zip .
az webapp deploy --name $WEB_APP_NAME --resource-group $RESOURCE_GROUP --src-path app.zip