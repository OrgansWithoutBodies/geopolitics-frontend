import { BrandedNumber } from "type-library/src";
import { QCode } from "./wd.types";

export type MembershipStatusID = BrandedNumber<"MembershipStatusID">;
export type GroupID = BrandedNumber<"GroupID">;

export const WDQCode = {
  APPLICANT: "Q54875338" as QCode<MembershipStatusID>,
  MEMBER: "Q1646605" as QCode<MembershipStatusID>,
  OBSERVER: "Q818553" as QCode<MembershipStatusID>,
  SUSPENDED: "Q115754746" as QCode<MembershipStatusID>,
  TRADE_BLOCS: "Q1129645" as QCode<GroupID>,
  GEOPOLITICAL_GROUPS: "Q52110228" as QCode<GroupID>,
  INTERGOVERNMENTAL_ORGANIZATIONS: "Q245065" as QCode<GroupID>,
  INTERNATIONAL_ORGANIZATIONS: "Q484652" as QCode<GroupID>,
};
