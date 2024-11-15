# Verwende das offizielle Node.js-Image als Basis
FROM node:18-alpine

# Setze das Arbeitsverzeichnis im Container
WORKDIR /app

# Kopiere die package.json und package-lock.json/yarn.lock
COPY package*.json ./

# Installiere die Abhängigkeiten
RUN npm install

# Kopiere den Rest des Anwendungscodes
COPY . .

# Set default environment variables
ENV NEXT_PUBLIC_BASE_PATH="/visu"
ENV MQTT_BROKER_URL="mqtt://192.168.10.31:1883"
ENV MQTT_TOPIC_DATA="modbus/alarm/data"
ENV MQTT_TOPIC_STATUS="modbus/alarm/status"
ENV DATABASE_URL="./mnt/ycontroldata_settings.db"
ENV DB_HOST="192.168.10.31"
ENV DB_USER="Ygnis"
ENV DB_PASSWORD="Ygnis6017"
ENV DB_NAME="Ycontrol"


# Baue die Next.js-Anwendung
RUN npm run build

# Exponiere den Port, den die Anwendung verwendet
EXPOSE 3000

# Setze die Umgebungsvariable für die Datenbank
ENV DATABASE_URL=/mnt/ycontroldata_settings.db

# Starte die Anwendung
CMD ["npm", "start"]