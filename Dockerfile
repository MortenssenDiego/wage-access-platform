FROM node:21-alpine

# Expose port
EXPOSE 5173

# Create apps-build directory where we are going to copy all and use it as build directory
RUN mkdir /apps-build
# Create apps directory where we are going to copy the built files and use it as run directory
RUN mkdir /apps
WORKDIR /apps-build
COPY ./app/ ./app/
COPY ./public/ ./public/
COPY ./src/ ./src/
COPY ./styles ./styles/
COPY ./eslint.config.js ./
COPY ./package.json ./
COPY ./postcss.config.cjs ./
COPY ./tsconfig.json ./
COPY ./vite.config.ts ./

# Install packages
RUN npm install

# Build
RUN npm run build
RUN mv ./node_modules /apps/
RUN mv ./build /apps/
RUN mv ./package.json /apps/
RUN mv ./package-lock.json /apps/

WORKDIR /apps
RUN rm -r /apps-build

CMD ["npm", "run", "start"]