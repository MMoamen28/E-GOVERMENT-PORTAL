# Build stage
FROM node:20 AS builder

WORKDIR /app

COPY package*.json ./
RUN npm ci

COPY . .
RUN npm run build

# Run stage
FROM node:20

WORKDIR /app

COPY package*.json ./
RUN npm ci --omit=dev

COPY --from=builder /app/dist ./dist
COPY --from=builder /app/frontend ./frontend
COPY --from=builder /app/rules ./rules
COPY --from=builder /app/flowable ./flowable

EXPOSE 3000

CMD ["node", "dist/main.js"]
