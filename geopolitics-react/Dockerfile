FROM node
WORKDIR "/Project/"
RUN git clone -b  deploy https://github.com/OrgansWithoutBodies/TypeLibrary ./Coordinates/type-library
RUN git clone -b dev https://github.com/OrgansWithoutBodies/NumberScript ./type-algebra
RUN git clone https://github.com/OrgansWithoutBodies/ReactKonvaComponents
RUN git clone -b deploy https://github.com/OrgansWithoutBodies/geopolitics-frontend Geopolitics/frontend/
RUN ls Geopolitics/frontend/geopolitics-react
# TODO make it so we don't need this specific file structure - publish npm pkgs?
WORKDIR "./type-algebra/"
RUN yarn
RUN yarn build
WORKDIR "../Coordinates/type-library/"
RUN yarn
RUN yarn build
WORKDIR "../../Geopolitics/frontend/geopolitics-react/"
RUN yarn
WORKDIR "./dataPrep/"
RUN yarn
RUN ls ./../../
RUN pwd
RUN npx ts-node src/main.ts --wd internationalOrganizations
WORKDIR "../"
RUN ls ./../../..
RUN yarn
RUN yarn build
EXPOSE 4173
CMD ["yarn", "preview","--host"]

