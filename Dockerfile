FROM node:18-alpine3.15 as builder

# build frontend
WORKDIR /src/frontend

RUN npm -g install pnpm
COPY frontend/package.json .
COPY frontend/yarn.lock .
RUN pnpm install
COPY ./frontend .
RUN pnpm build

# build backend
WORKDIR /src/backend
COPY ./backend/package*.json .
COPY ./backend .
RUN pnpm install
RUN pnpm build


FROM node:18-alpine3.15 as production

WORKDIR /src/backend

RUN apk --update add ffmpeg
COPY --from=builder /src/backend/package*.json .
RUN npm install --production

COPY --from=builder /src/backend/dist dist
COPY --from=builder /src/frontend/dist dist/public

# EXPOSE 80
# ENV PORT=80

CMD ["node", "dist/index.js"]