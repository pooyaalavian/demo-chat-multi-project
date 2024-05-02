git fetch && git pull
cd webapp
rm app.zip && zip -r app.zip .
az webapp deploy --name $WEBAPP_NAME --resource-group $RESOURCE_GROUP --src-path app.zip
cd ..
cd fnapp
rm app.zip && zip -r app.zip .
func azure functionapp publish $FNAPP_NAME --build remote --python
