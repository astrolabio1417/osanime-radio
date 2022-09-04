FROM node:18-alpine3.15 as base

WORKDIR /src

RUN apk --update add ffmpeg

COPY ./package-lock.json .
COPY ./package.json .

FROM base as production

RUN npm install
COPY . .
ENV PORT=80
EXPOSE 80

CMD ["npm", "run", "start:prod"]


FROM base as development
RUN npm install -g nodemon && npm install
COPY . .
ENV PORT=8000
EXPOSE 8000

CMD ["npm", "run", "start:dev"]