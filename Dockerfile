# Vite 7 needs Node 20.19+ or 22.12+; Debian image fits native deps (better-sqlite3, Tailwind oxide).
FROM node:22-bookworm

WORKDIR /app

COPY package*.json ./

RUN npm ci

COPY . .

RUN npx svelte-kit sync && npm run build

EXPOSE 4173

# adapter-node: set DATABASE_URL at runtime (e.g. file on a mounted volume). Optional: ORIGIN / PROTOCOL_HEADER / HOST_HEADER behind a reverse proxy.
ENV PORT=4173
ENV BODY_SIZE_LIMIT=10485760
CMD ["node", "build"]
