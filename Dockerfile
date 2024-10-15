# ---- Build Stage ----
    FROM --platform=linux/arm64 node:18-alpine AS builder

    # Arbeitsverzeichnis setzen
    WORKDIR /app
    
    # Benötigte Build-Tools installieren (falls erforderlich)
    RUN apk add --no-cache python3 make g++
    
    # Build-Argumente deklarieren
    ARG NEXT_PUBLIC_BASE_PATH
    
    # Umgebungsvariable für den Build setzen
    ENV NEXT_PUBLIC_BASE_PATH=$NEXT_PUBLIC_BASE_PATH
    
    # package.json und package-lock.json kopieren
    COPY package*.json ./
    
    # Abhängigkeiten installieren
    RUN npm ci
    
    # Restlichen Code kopieren
    COPY . .
    
    # Next.js-Anwendung bauen
    RUN npm run build
    
    # Produktionsabhängigkeiten installieren
    RUN npm prune --production
    
    # ---- Produktions-Image ----
    FROM --platform=linux/arm64 node:18-alpine
    
    # Arbeitsverzeichnis setzen
    WORKDIR /app
    
    # Produktionsumgebungsvariable setzen
    ENV NODE_ENV=production
    
    # Benötigte Dateien vom Builder kopieren
    COPY --from=builder /app/package*.json ./
    COPY --from=builder /app/node_modules ./node_modules
    COPY --from=builder /app/.next ./.next
    # COPY --from=builder /app/public ./public
    
    # Port exponieren
    EXPOSE 3000
    
    # Startbefehl
    CMD ["npm", "start"]
    