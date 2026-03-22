FROM node:18.14

WORKDIR /app

COPY package*.json ./

RUN npm install

COPY . .

RUN npm run build

EXPOSE 4173

# adapter-node: run built server. ORIGIN/PROTOCOL_HEADER/HOST_HEADER set at runtime for proxy.
ENV PORT=4173
ENV BODY_SIZE_LIMIT=10485760
CMD ["node", "build"]