FROM node:20-alpine

RUN apk add --no-cache \
    python3 \
    make \
    g++ \
    cairo-dev \
    jpeg-dev \
    pango-dev \
    giflib-dev \
    pixman-dev \
    pangomm-dev \
    libjpeg-turbo-dev \
    freetype-dev

WORKDIR /app

COPY package*.json ./

RUN npm ci --only=production

COPY . .

RUN mkdir -p logs

ENV NODE_ENV=production

USER node

CMD ["node", "src/index.js"]
