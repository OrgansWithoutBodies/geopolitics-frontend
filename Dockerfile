FROM node
WORKDIR "/Project/"
RUN git clone -b  deploy https://github.com/OrgansWithoutBodies/TypeLibrary ./Coordinates/type-library
RUN git clone -b dev https://github.com/OrgansWithoutBodies/NumberScript ./type-algebra
RUN git clone https://github.com/OrgansWithoutBodies/ReactKonvaComponents
RUN git clone -b deploy https://github.com/OrgansWithoutBodies/geopolitics-frontend Geopolitics/frontend/geopolitics-frontend
WORKDIR "Geopolitics/frontend/geopolitics-frontend/geopolitics-react/"
RUN yarn
# TODO make it so we don't need this specific file structure - publish npm pkgs?
WORKDIR "./dataPrep/"
RUN yarn
RUN npx ts-node src/main.ts --wd internationalOrganizations
#WORKDIR "../"
WORKDIR "../../../../../"
RUN ls .
WORKDIR "./type-algebra/"
RUN yarn
RUN yarn build
WORKDIR "../Coordinates/type-library/"
RUN yarn
RUN yarn build
WORKDIR "Projects/Geopolitics/frontend/geopolitics-frontend/"
RUN yarn build
EXPOSE 4173
CMD ["yarn", "preview","--host"]
