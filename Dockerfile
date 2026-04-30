FROM node:20 AS builder

WORKDIR /app

COPY package*.json ./
RUN npm ci --legacy-peer-deps

COPY . .
RUN npm run build

# Run stage
FROM node:20

WORKDIR /app

COPY package*.json ./
RUN npm ci --omit=dev --legacy-peer-deps

COPY --from=builder /app/dist ./dist
COPY --from=builder /app/src/business-license ./src/business-license
COPY --from=builder /app/frontend ./frontend
COPY --from=builder /app/rules ./rules
COPY --from=builder /app/flowable ./flowable

EXPOSE 3000

CMD ["node", "dist/src/main.js"]
