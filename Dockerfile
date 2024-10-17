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

# Baue die Next.js-Anwendung
RUN npm run build

# Exponiere den Port, den die Anwendung verwendet
EXPOSE 3000

# Setze die Umgebungsvariable für die Datenbank
ENV DATABASE_URL=/mnt/ycontroldata_settings.db

# Starte die Anwendung
CMD ["npm", "start"]
