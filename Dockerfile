FROM node:18-alpine3.15 as base

WORKDIR /src
RUN apk --update add ffmpeg
COPY ./package*.json .


FROM base as development
RUN npm install -g typescript ts-node-dev && npm install
COPY . .
ENV PORT=8000
EXPOSE 8000
CMD ["npm", "run", "dev"]


FROM base as production
RUN npm install -g typescript && npm install
COPY . .
CMD ["npm", "run", "start"]