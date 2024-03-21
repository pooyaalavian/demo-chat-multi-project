FROM node:20-alpine AS frontend
WORKDIR /app  
WORKDIR /frontend 
COPY ./frontend/package*.json ./ 
RUN chown -R node:node /app /frontend
COPY ./frontend/package*.json ./  
USER node
RUN npm ci  
COPY --chown=node:node ./frontend/ /frontend  
RUN npm run build

FROM python:3.11-alpine as finalapp
RUN apk add --no-cache --virtual .build-deps \  
    build-base \  
    libffi-dev \  
    openssl-dev \  
    curl \  
    && apk add --no-cache \  
    libpq 

COPY app/requirements.txt /app/
WORKDIR /app
RUN pip install --no-cache-dir -r /app/requirements.txt \  
    && rm -rf /root/.cache  

COPY ./app/ /app/  
COPY --from=frontend /app/static  /app/static/
RUN rm /app/.env
EXPOSE 80  

CMD ["uvicorn", "--host", "0.0.0.0", "--port", "80", "--workers", "$WEB_CONCURRENCY", "app:app"]