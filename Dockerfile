FROM node:20



WORKDIR /usr/src/app



COPY . .

RUN rm .env

RUN yarn install


ARG DATABASE_URL

RUN echo "Writing DATABASE_URL to .env file..."
RUN echo "DATABASE_URL=$DATABASE_URL" > .env
RUN printf "DATABASE_URL=$DATABASE_URL\nREDIS_URL=$REDIS_URL" >> .env

RUN echo "DATABASE_URL has been written to .env file."


EXPOSE 3000

CMD ["yarn", "start"]