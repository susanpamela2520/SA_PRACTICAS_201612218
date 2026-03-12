FROM node:20-alpine
WORKDIR /app
COPY package*.json ./
RUN npm install
COPY . .
RUN npx nest build
RUN mkdir -p dist/proto && cp src/proto/*.proto dist/proto/
CMD ["node", "dist/main"]