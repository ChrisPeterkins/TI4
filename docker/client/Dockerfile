# Development Dockerfile for client
FROM node:20-alpine

WORKDIR /app

# Copy package files
COPY package*.json ./
COPY lerna.json ./

# Copy workspace package files
COPY client/package*.json ./client/
COPY shared/package*.json ./shared/

# Install dependencies
RUN npm ci
RUN npx lerna bootstrap

# Copy source code
COPY client ./client
COPY shared ./shared

WORKDIR /app/client

# Expose port
EXPOSE 5173

# Start development server
CMD ["npm", "run", "dev"]