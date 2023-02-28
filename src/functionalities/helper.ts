export const randomInRange = (min: number, max: number) => {
	if (min == max) return min
	return Math.floor(Math.random() * (max - min + 1) + min)
}

export const toString = () => {
	console.log("toString" + this)

	return JSON.stringify(this, (key, value) =>
		typeof value === "bigint" ? value.toString() : value
	)
}

export const toObject = (obj: Array<any> | Object) => {
	return JSON.parse(
		JSON.stringify(obj, (key, value) =>
			typeof value === "bigint" ? value.toString() : value
		)
	)
}
