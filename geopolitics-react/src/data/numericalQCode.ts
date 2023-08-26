import { QCode } from "./data.store";

/**
 * @deprecated - @TODO change signature across app
 */
export function numericalQCode<TNum extends number>(country: {
  item: { value: `Q${TNum}` };
}): TNum {
  return Number.parseInt(country.item.value.replace("Q", "")) as TNum;
}

export function numericalQCodeDummy<TNum extends number>(
  value: QCode<TNum>
): TNum {
  return Number.parseInt(value.replace("Q", "")) as TNum;
}
