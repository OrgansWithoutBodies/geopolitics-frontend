FROM node
WORKDIR "/Project/"
RUN git clone -b  deploy https://github.com/OrgansWithoutBodies/TypeLibrary ./Coordinates/type-library
RUN git clone  https://github.com/OrgansWithoutBodies/geometry-helpers ./Coordinates/geometry-helpers
RUN git clone -b dev https://github.com/OrgansWithoutBodies/NumberScript ./type-algebra
RUN git clone -b dev  https://github.com/OrgansWithoutBodies/ReactKonvaComponents
RUN git clone -b deploy  https://github.com/OrgansWithoutBodies/geopolitics-frontend Geopolitics/frontend/
RUN ls Geopolitics/frontend/geopolitics-react
# TODO make it so we don't need this specific file structure - publish npm pkgs?
WORKDIR "./type-algebra/"
RUN yarn
RUN yarn build
WORKDIR "../Coordinates/type-library/"
RUN yarn
RUN yarn build
WORKDIR "../geometry-helpers"
RUN yarn
RUN yarn build
WORKDIR "../../ReactKonvaComponents/"
RUN yarn
RUN yarn build
WORKDIR "../Geopolitics/frontend/geopolitics-react/"
RUN yarn
WORKDIR "./dataPrep/"
RUN mkdir out
RUN yarn
RUN npx ts-node src/main.ts --wd internationalOrganizations
WORKDIR "../"
RUN yarn
RUN yarn build
EXPOSE 4173
CMD ["yarn", "preview","--host"]

