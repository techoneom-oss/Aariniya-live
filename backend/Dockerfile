FROM node:18-slim

WORKDIR /app

# Copy package.json and package-lock.json (if exists)
COPY package*.json ./

# Install dependencies (only production if preferred, but standard npm install is fine)
RUN npm install --production

# Copy the rest of the application files
COPY . .

# Expose the port. Render sets the PORT env variable automatically, 
# but exposing 5000 as fallback is good practice.
EXPOSE 5000

# Run the app
CMD ["node", "server.js"]
