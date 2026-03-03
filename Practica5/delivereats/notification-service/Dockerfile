FROM node:20-alpine

WORKDIR /app

COPY package*.json ./

# Usar npm install en lugar de npm ci (no requiere package-lock.json)
RUN npm install

COPY . .

# Compilar TypeScript con nest CLI
RUN npx nest build

CMD ["node", "dist/main"]