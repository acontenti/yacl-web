export default class Utils {
	private static weightReference = "g";
	private static volumeReference = "ml";
	private static metricWeights: { [key: string]: number } = {
		"kg": 1000, "hg": 100, "g": 1, "dg": 0.1, "cg": 0.01, "mg": 0.001
	};
	private static otherWeights: { [key: string]: number } = {
		"lb": 453.59237, "oz": 28.349523125, "dr": 1.7718451953125
	};
	private static metricVolumes: { [key: string]: number } = {
		"hl": 100000, "dal": 10000, "l": 1000, "dl": 100, "cl": 10, "ml": 1
	};
	private static otherVolumes: { [key: string]: number } = {
		"pinch": 0.31,
		"tsp": 4.92892159375,
		"tbsp": 14.78676478125,
		"fl oz": 29.5735295625,
		"jig": 44.36029434375,
		"gi": 118.29411825,
		"cp": 236.5882365,
		"cup": 236.5882365,
		"pt": 473.176473,
		"qt": 946.352946,
		"pot": 1892.70589,
		"gal": 3785.411784
	};
	private static metricUnits: { [key: string]: number } = {...Utils.metricWeights, ...Utils.metricVolumes};
	private static otherUnits: { [key: string]: number } = {...Utils.otherWeights, ...Utils.otherVolumes};
	private static weights: { [key: string]: number } = {...Utils.metricWeights, ...Utils.otherWeights};
	private static volumes: { [key: string]: number } = {...Utils.metricVolumes, ...Utils.otherVolumes};

	static round(n: number): number {
		return Math.round((n + Number.EPSILON) * 100) / 100;
	}

	static toMetricUnit(unit: string): string {
		if (this.isVolume(unit))
			return this.volumeReference;
		if (this.isWeight(unit))
			return this.weightReference;
		return unit;
	}

	static toMetricValue(unit: string, value: number): number {
		if (this.isVolume(unit)) {
			return value * this.volumes[unit];
		}
		if (this.isWeight(unit)) {
			return value * this.weights[unit];
		}
		return value;
	}

	static isMetric(unit: string): boolean {
		return unit in Utils.metricUnits;
	}

	static isVolume(unit: string): boolean {
		return unit in Utils.volumes;
	}

	static isWeight(unit: string): boolean {
		return unit in Utils.weights;
	}

	static getEmptyRecipe(name: string): string {
		return "name: " + name + "\n" +
			"description:\n" +
			"quantity:\n" +
			"category:\n" +
			"cuisine:\n" +
			"image:\n" +
			"tags:\n" +
			"ingredients:\n" +
			"instructions:\n";
	}
}
