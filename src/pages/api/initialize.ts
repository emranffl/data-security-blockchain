import { satellite_info, ground_station_info } from '@prisma/client'
import type { NextApiRequest, NextApiResponse } from 'next'
import { Chain } from '@blockchain/index'

type Data = {
	[key: string]: satellite_info | ground_station_info | unknown
}

export default async function handler(
	req: NextApiRequest,
	res: NextApiResponse<Data>
) {
	try {
		return res.status(200).json({ data: Chain.instance.chain })
	} catch (error) {
		console.error(error)
		return res.status(400).json({ foreground: true, error })
	}
}
