FROM node
WORKDIR /app
RUN git clone https://github.com/OrgansWithoutBodies/TypeLibrary Coordinates/type-library
RUN git clone https://github.com/OrgansWithoutBodies/NumberScript
RUN git clone -b deploy https://github.com/OrgansWithoutBodies/geopolitics-frontend Geopolitics/frontend/geopolitics-frontend
WORKDIR "Geopolitics/frontend/geopolitics-frontend/geopolitics-react/"
RUN yarn
# TODO make it so we don't need this specific file structure - publish npm pkgs?
WORKDIR "./dataPrep/"
RUN yarn
RUN npx ts-node src/main.ts --wd internationalOrganizations
WORKDIR "../"
RUN yarn build
RUN yarn preview

