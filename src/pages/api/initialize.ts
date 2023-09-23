import { satellite_info, ground_station_info } from "@prisma/client"
import type { NextApiRequest, NextApiResponse } from "next"
import { Chain } from "@blockchain/index"
import { toObject } from "@functionalities/helpers"

type Data = {
	[key: string]: satellite_info | ground_station_info | unknown
}

// Initialize the Chain instance when the module is loaded
const chain = Chain.instance
// await chain.initialize()

export default async function handler(
	req: NextApiRequest,
	res: NextApiResponse<Data>
) {
	try {
		return res.status(200).json({ data: toObject(Chain.instance.chain) })
	} catch (error) {
		console.error(error)
		return res.status(400).json({ foreground: true, error })
	}
}
