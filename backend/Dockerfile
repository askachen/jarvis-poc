FROM node:20-alpine

# Prisma's native schema engine binary requires OpenSSL on Alpine
RUN apk add --no-cache openssl

WORKDIR /app

# Install dependencies first (for caching)
COPY package*.json ./
RUN npm install

# Copy prisma schema and generate client
COPY prisma ./prisma
RUN npx prisma generate

# Copy source
COPY . .

EXPOSE 3000

# Use db push for POC (no migration files required), then seed, then dev
CMD ["sh", "-c", "npx prisma db push --accept-data-loss && npx ts-node prisma/seed.ts && npm run dev"]
