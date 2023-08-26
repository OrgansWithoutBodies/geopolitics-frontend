export function numericalQCode<TNum extends number>(country: {
  item: { value: `Q${TNum}` };
}): TNum {
  return Number.parseInt(country.item.value.replace("Q", "")) as TNum;
}
