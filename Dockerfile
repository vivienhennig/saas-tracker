# --- Stage 1: Build ---
FROM node:20-alpine as build

# Arbeitsverzeichnis setzen
WORKDIR /app

# Kopieren der Package-Dateien für effizientes Caching
COPY package*.json ./

# Installation der Abhängigkeiten
RUN npm install

# Kopieren des restlichen Quellcodes
COPY . .

# Argumente definieren (werden beim Build-Befehl übergeben)
ARG API_KEY
ARG SUPABASE_URL
ARG SUPABASE_KEY

# Setzen als Umgebungsvariablen für den Build-Prozess
# Vite benötigt standardmäßig das Prefix VITE_, um sie einzubetten
ENV VITE_API_KEY=$API_KEY
ENV VITE_SUPABASE_URL=$SUPABASE_URL
ENV VITE_SUPABASE_KEY=$SUPABASE_KEY

# Build ausführen (erstellt den dist-Ordner)
RUN npm run build

# --- Stage 2: Production ---
FROM nginx:stable-alpine

# Kopieren des Build-Ergebnisses aus Stage 1 in das Nginx-Verzeichnis
COPY --from=build /app/dist /usr/share/nginx/html

# Kopieren der benutzerdefinierten Nginx-Konfiguration
COPY nginx.conf /etc/nginx/conf.d/default.conf

# Port 80 freigeben
EXPOSE 80

# Nginx im Vordergrund starten
CMD ["nginx", "-g", "daemon off;"]