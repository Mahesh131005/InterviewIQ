# Dockerfile for Backend
FROM node:18-alpine

WORKDIR /app

# Copy package files
COPY package.json package-lock.yaml* pnpm-lock.yaml* ./

# Install dependencies
RUN npm install

# Copy source
COPY . .

# Expose port
EXPOSE 5000

# Run server
CMD ["npm", "run", "dev"]
