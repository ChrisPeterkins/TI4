# Development Dockerfile for server
FROM node:20-alpine

WORKDIR /app

# Copy package files
COPY package*.json ./
COPY lerna.json ./

# Copy workspace package files
COPY server/package*.json ./server/
COPY shared/package*.json ./shared/

# Install dependencies
RUN npm ci
RUN npx lerna bootstrap

# Copy source code
COPY server ./server
COPY shared ./shared

WORKDIR /app/server

# Expose port
EXPOSE 3001

# Start development server
CMD ["npm", "run", "dev"]