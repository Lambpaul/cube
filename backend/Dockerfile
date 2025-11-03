FROM node:18-alpine

WORKDIR /app

# Copy package files
COPY package.json ./

# Install dependencies
RUN npm install

# Copy application files
COPY app.js ./

# Expose port
EXPOSE 3000

# Start application
CMD ["node", "app.js"]
