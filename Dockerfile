FROM node:lts

WORKDIR /app
RUN git clone https://github.com/thanasibakis/data2sound.git .
RUN npm install

EXPOSE 80

CMD ["node", "api.js", "80"]
