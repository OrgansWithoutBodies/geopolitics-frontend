// import { Query } from "@datorama/akita";
// import {
//   BilateralRelation,
//   CountryHeartMap,
//   adjMatToRawNetwork,
// } from "react-konva-components/src";
// import { Observable, combineLatest, map } from "rxjs";
// import {
//   NetworkNode,
//   ObjectAdjacencyMatrix,
//   RawNetwork,
//   RenderableNetworkEdge,
//   RenderableNetworkNode,
// } from "type-library/src";
// import {
//   CountryMembershipNetworkState,
//   CountryMembershipNetworkStore,
// } from "./CountryMembershipNetwork.store";
// import { BlocID } from "./data.query";
// import { CountryID, QCode, numericalQCode } from "./data.store";

// type TimeStamp<
//   TY extends number = number,
//   TMon extends number = number,
//   TD extends number = number,
//   TH extends number = number,
//   TMin extends number = number,
//   TS extends number = number
// > = `${TY}-${TMon}-${TD}T${TH}:${TMin}:${TS}`;

// export class CountryMembershipNetworkQuery extends Query<CountryMembershipNetworkState> {
//   constructor(
//     private existingCountries: Observable<
//       {
//         item: { type: "uri"; value: QCode<CountryID> };
//         shape: {
//           type: "uri";
//           value: `http://commons.wikimedia.org/data/main/Data:${string}.map`;
//         };
//         stateStart: {
//           datatype: "http://www.w3.org/2001/XMLSchema#dateTime";
//           type: "literal";
//           value: TimeStamp;
//         };
//         center: {
//           datatype: "http://www.opengis.net/ont/geosparql#wktLiteral";
//           type: "literal";
//           value: "Point(10.0 56.0)";
//         };
//         stateEnd: {
//           datatype: "http://www.w3.org/2001/XMLSchema#dateTime";
//           type: "literal";
//           value: TimeStamp;
//         };
//       }[]
//     >,
//     // private selectedNetworkNode: Observable<NodeID>,
//     private membershipNetwork: Observable<
//       {
//         readonly item: {
//           readonly type: "uri";
//           readonly value: QCode;
//         };
//         readonly memberState: {
//           readonly type: "uri";
//           readonly value: QCode<CountryID>;
//         };
//       }[]
//     >,
//     protected store: CountryMembershipNetworkStore
//   ) {
//     super(store);
//   }
//   public networkNodeRenderProps = this.select("networkNodeRenderProps");

//   public blocMemberships: Observable<
//     Record<QCode<BlocID>, QCode<CountryID>[]>
//   > = this.membershipNetwork.pipe(
//     map((blocs) => {
//       const uniqueBlocs = [
//         ...new Set(blocs.map((entry) => [entry.item.value, []])),
//       ];
//       const blocMemberships: Record<
//         QCode<BlocID>,
//         QCode<CountryID>[]
//       > = Object.fromEntries(uniqueBlocs);
//       blocs.forEach((bloc) => {
//         blocMemberships[bloc.item.value as QCode<BlocID>].push(
//           bloc.memberState.value as QCode<CountryID>
//         );
//       });
//       return blocMemberships;
//     })
//   );
//   public countriesInSameTradeBloc: Observable<
//     ObjectAdjacencyMatrix<CountryID, 0 | 1>
//   > = combineLatest([this.blocMemberships]).pipe(
//     map(([blocMemberships]) => {
//       const groupedBlocs = Object.values(blocMemberships);
//       const uniqueEntitiesInTradeBlocs = [...new Set(groupedBlocs.flat())];
//       const QCodeFromCountryIndexLookup = Object.fromEntries(
//         uniqueEntitiesInTradeBlocs.map((entity, ii) => {
//           return [ii, entity] as [number, QCode<CountryID>];
//         })
//       );
//       const tradeBlocMatrix: ObjectAdjacencyMatrix<CountryID, 0 | 1> =
//         Object.fromEntries(
//           new Array(uniqueEntitiesInTradeBlocs.length).fill(0).map((_, ii) => [
//             numericalQCode({
//               item: { value: QCodeFromCountryIndexLookup[ii] },
//             }),
//             Object.fromEntries(
//               new Array(uniqueEntitiesInTradeBlocs.length)
//                 .fill(0)
//                 .map((_, jj) => [
//                   numericalQCode({
//                     item: { value: QCodeFromCountryIndexLookup[jj] },
//                   }),
//                   0,
//                 ])
//             ),
//           ])
//         );
//       groupedBlocs.forEach((entryList) => {
//         entryList.forEach((entry, ii) => {
//           entryList.forEach((otherEntry, jj) => {
//             if (jj > ii) {
//               tradeBlocMatrix[
//                 numericalQCode({ item: { value: entry } }) as CountryID
//               ][
//                 numericalQCode({ item: { value: otherEntry } }) as CountryID
//               ] = 1;
//             }
//           });
//         });
//       });
//       return tradeBlocMatrix;
//     })
//   );
//   public eventParticipantsAsNetwork: Observable<RawNetwork> =
//     this.countriesInSameTradeBloc.pipe(
//       map((objAdjMat) => adjMatToRawNetwork(objAdjMat))
//     );
//   public networkNodesArray: Observable<NetworkNode[]> =
//     this.eventParticipantsAsNetwork.pipe(
//       map(({ nodes }) => {
//         return nodes;
//       })
//     );

//   // maybe need internal state here?
//   public renderableEventNetworkNodes: Observable<RenderableNetworkNode[]> =
//     combineLatest([this.networkNodesArray, this.networkNodeRenderProps]).pipe(
//       map(([nodes, networkNodeRenderProps]) => {
//         return nodes.map((node) => ({
//           ...node,
//           renderedProps: networkNodeRenderProps[node.id],
//         }));
//       })
//     );

//   public renderableEventEdges: Observable<RenderableNetworkEdge[]> =
//     combineLatest([
//       this.renderableEventNetworkNodes,
//       this.eventParticipantsAsNetwork,
//     ]).pipe(
//       map(([nodes, { edges }]) => {
//         return edges.map((edge) => {
//           return {
//             ...edge,
//             renderedProps: {
//               position: {
//                 origin: nodes.find(({ id }) => id === edge.origin)!
//                   .renderedProps.position,
//                 target: nodes.find(({ id }) => id === edge.target)!
//                   .renderedProps.position,
//               },
//             },
//           };
//         });
//       })
//     );

//   public countryHeartMap: Observable<CountryHeartMap<CountryID>> =
//     this.existingCountries.pipe(
//       map((countries) => {
//         return Object.fromEntries(
//           countries.map((country) => {
//             // Point(-63.067777777 18.031944444)
//             const [lat, lon] = country.center.value
//               .replace("Point(", "")
//               .replace(")", "")
//               .split(" ");
//             return [
//               numericalQCode(country),
//               {
//                 type: "Point",
//                 geometry: {
//                   type: "Point",
//                   coordinates: [Number.parseFloat(lat), Number.parseFloat(lon)],
//                 },
//               },
//             ];
//           })
//         );
//       })
//     );
//   public bilateralRelations: Observable<BilateralRelation<CountryID>[]> =
//     this.countriesInSameTradeBloc.pipe(
//       map((objAdjMat) => {
//         const bilateralRelations: BilateralRelation<CountryID>[] = [];

//         Object.keys(objAdjMat).forEach((iiID) => {
//           const iiString = Number.parseInt(iiID) as CountryID;
//           Object.keys(objAdjMat[iiString]).forEach((jjID) => {
//             const jjString = Number.parseInt(jjID) as CountryID;
//             if (objAdjMat[iiString][jjString] === 1) {
//               bilateralRelations.push([iiString, jjString, 1]);
//             }
//           });
//         });
//         return bilateralRelations;
//       })
//     );
// }
