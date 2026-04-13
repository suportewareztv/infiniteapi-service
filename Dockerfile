FROM node:20-alpine

WORKDIR /app

COPY package*.json ./
RUN npm install --production

COPY dist/ ./dist/
COPY .env* ./

EXPOSE 8080

CMD ["node", "--experimental-specifier-resolution=node", "dist/server.js"]
