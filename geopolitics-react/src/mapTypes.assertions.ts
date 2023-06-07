import { CapitalCityCountryCodes, CountryCode } from "./mapTypes";

type IfEquals<T, U, Y = unknown, N = never> = (<G>() => G extends T
  ? 1
  : 2) extends <G>() => G extends U ? 1 : 2
  ? Y
  : N;
// type LogicalNot<TBool extends boolean> = TBool extends true ? false : true;
// semantic declarations to trigger a compiler error when a value is _not_ an exact type. */

declare const assertExactType: <T, U>(
  draft: T & IfEquals<T, U>,
  expected: U & IfEquals<T, U>
) => IfEquals<T, U>;
export declare const assertNotExactType: <T, U>(
  draft: T & IfEquals<T, U, never, unknown>,
  expected: U & IfEquals<T, U, never, unknown>
) => IfEquals<T, U, never, unknown>;
export declare let a: CapitalCityCountryCodes;
declare let b: CountryCode;
export declare let c: string;

assertExactType(a, b);
// make sure we're checking w literals instead of just string to string

assertNotExactType(a, c);
