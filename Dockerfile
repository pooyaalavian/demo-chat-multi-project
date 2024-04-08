FROM node:20-alpine AS frontend
WORKDIR /webapp  
WORKDIR /frontend 
COPY ./frontend/package*.json ./ 
RUN chown -R node:node /webapp /frontend
COPY ./frontend/package*.json ./  
USER node
RUN npm ci  
COPY --chown=node:node ./frontend/ /frontend  
RUN npm run build

FROM python:3.11-alpine as webapp
RUN apk add --no-cache --virtual .build-deps \  
    build-base \  
    libffi-dev \  
    openssl-dev \  
    curl \  
    && apk add --no-cache \  
    libpq 

COPY webapp/requirements.txt /webapp/
WORKDIR /webapp
RUN pip install --no-cache-dir -r /webapp/requirements.txt \  
    && rm -rf /root/.cache  

COPY ./webapp/ /webapp/  
COPY --from=frontend /webapp/static  /webapp/static/
RUN rm /webapp/.env
EXPOSE 80  

CMD ["uvicorn", "--host", "0.0.0.0", "--port", "80", "--workers", "$WEB_CONCURRENCY", "app:app"]