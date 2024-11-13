
# --- Stage 1: Dependencies ---
    FROM --platform=linux/arm64 node:18-alpine AS deps

    # Arbeitsverzeichnis festlegen
    WORKDIR /app
    
    # Nur die package-Dateien kopieren, um den Cache optimal zu nutzen
    COPY package*.json ./
    
    # Abhängigkeiten installieren
    RUN npm install
    
    # --- Stage 2: Build ---
    FROM --platform=linux/arm64 node:18-alpine AS builder
    
    WORKDIR /app
    
    # Abhängigkeiten von vorherigem Schritt kopieren
    COPY --from=deps /app/node_modules ./node_modules
    
    # Quellcode kopieren
    COPY . .
    
    # Temporäre Umgebungsvariablen für den Build-Prozess festlegen, um DB- und MQTT-Verbindungen zu vermeiden
    ENV DB_HOST=dummy_host
    ENV MQTT_BROKER_URL=dummy_mqtt
    ENV BUILD_MODE=true
    ENV NEXT_TELEMETRY_DISABLED=1 
    # Next.js-Anwendung bauen
    RUN npm run build
    
    # --- Stage 3: Production Image ---
    FROM --platform=linux/arm64 node:18-alpine AS runner
    
    WORKDIR /app
    
    # Nur das Notwendige von vorherigem Schritt kopieren
    COPY --from=builder /app/.next ./.next
    COPY --from=builder /app/node_modules ./node_modules
    COPY --from=builder /app/package*.json ./
    COPY --from=builder /app/public ./public
    
    # Laufzeit-Umgebungsvariablen für DB und MQTT konfigurieren
    ENV DB_HOST=mariadb
    ENV MQTT_BROKER_URL=mqtt://192.168.10.31:1883
    ENV BUILD_MODE=false  
    
    # Expose port and run the application
    EXPOSE 3000
    CMD ["npm", "start"]
    