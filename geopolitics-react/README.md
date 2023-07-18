This is an application meant to help understand world events. It consists of several different 'Nodes' which can be rearranged into a custom dashboard depending on what specifically you want to analyze. This application is (currently) also responsible for automatically prepopulating data, we rely on curated knowledge databases such as WikiData, as well as Harvard's Atlas of Economic Complexity & other databases such as SIPRI. Datasets will be able to be transformed &  routed to aforementioned dashboard visualization nodes, with user-definable spec. Data sources are retrieved at build to add type assurances to our data. 

Currently the routing between Dashboard nodes is still being developed, check dev branch for current status

Node types include:
- Map - for geographic entities
- Network - for any relational entities
- Timeline - for any temporal/strictly ordered entities
