# Stage 1: Build the frontend
FROM node:20-alpine AS frontend-builder
WORKDIR /app/frontend

# Accept build arguments for Vite (baked into the static files at build time)
ARG VITE_PATH
ARG VITE_RECAPTCHA_V3_SITE_KEY

# Set them as env variables for the build process
ENV VITE_PATH=$VITE_PATH
ENV VITE_RECAPTCHA_V3_SITE_KEY=$VITE_RECAPTCHA_V3_SITE_KEY

# Install dependencies
COPY frontend/package*.json ./
RUN npm ci

# Copy frontend source and build
COPY frontend/ ./
RUN npm run build

# Stage 2: Runner image
FROM node:20-alpine AS runner
WORKDIR /app/backend

# Set production environment
ENV NODE_ENV=production

# Install backend dependencies (production only to save space)
COPY backend/package*.json ./
RUN npm ci --only=production

# Copy backend source
COPY backend/ ./

# Copy built frontend assets from the builder stage
# Placed at /app/frontend/dist because Backend/server.js expects it at '../frontend/dist'
COPY --from=frontend-builder /app/frontend/dist /app/frontend/dist

# Ensure persistent directories exist inside the container and set permissions
RUN mkdir -p src/utils/logs && touch src/utils/logs/app.log && \
    chown -R node:node . && chown -R node:node /app/frontend

# Security: Run as a non-root user
USER node

# Expose port (default is 3000 in server.js)
EXPOSE 3000

# Start the backend server
CMD ["node", "server.js"]
