interface RegressionScore {
  r: number;
  r2: number;
  chi2: number;
  rmsd: number;
}

class BaseRegression {
  predict(x: number): number;
  predict(x: number[]): number[];
  toString(precision?: number): string;
  toLaTeX(precision?: number): string;
  score(x: number[], y: number[]): RegressionScore;
}
type JSONType<TName extends string = string> = {
  name: TName;
  degree: number;
  powers: number;
  coefficients: number[];
};

declare module "ml-regression-polynomial" {
  class PolynomialRegression extends BaseRegression {
    constructor(x: number[], y: number[], degree: number);

    _predict(x: number): number;

    toJSON(): JSONType<"polynomialRegression">;

    toString(precision: number): string;

    toLaTeX(precision): string;

    _toFormula(precision: number, isLaTeX: boolean): `f(x) = ${fn}`;

    static load(json): PolynomialRegression;
  }
  export = PolynomialRegression;
}
