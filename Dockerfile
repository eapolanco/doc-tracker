# Build Stage for Frontend
FROM node:20-alpine AS frontend-build
WORKDIR /app/client
COPY client/package*.json ./
RUN npm install
COPY client/ ./
RUN npm run build

# Build Stage for Backend
FROM node:20-alpine AS backend-build
WORKDIR /app/backend
COPY backend/package*.json ./
RUN apk add --no-cache python3 make g++
RUN npm install
COPY backend/ ./
RUN npm run build

# Production Stage
FROM node:20-alpine
WORKDIR /app

# Copy backend
COPY --from=backend-build /app/backend/dist ./backend/dist
COPY --from=backend-build /app/backend/node_modules ./backend/node_modules
COPY --from=backend-build /app/backend/package.json ./backend/package.json
COPY --from=backend-build /app/backend/drizzle.config.ts ./backend/
COPY --from=backend-build /app/backend/src/db/schema.ts ./backend/src/db/

# Copy frontend build
COPY --from=frontend-build /app/client/dist ./client/dist

# Setup data directory for SQLite
RUN mkdir -p /app/data
ENV PORT=3001
ENV DATABASE_URL=/app/data/data.db

EXPOSE 3001

CMD ["sh", "-c", "cd backend && npm run db:push && node dist/index.js"]
