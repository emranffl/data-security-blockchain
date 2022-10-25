import prisma from '@functionalities/DB/prismainstance'
import { satellite_info, ground_station_info } from '@prisma/client'
import type { NextApiRequest, NextApiResponse } from 'next'
import { Chain, Wallet } from '@blockchain/index'

type Data = {
  [key: string]: satellite_info | ground_station_info | unknown
}

export default async function handler(
  req: NextApiRequest,
  res: NextApiResponse<Data>
) {

  const { nodeCategory, nodeData } = req.body
  try {

    if (nodeCategory == 'satellite')
      if (!await prisma.satellite_info.findUnique({ where: { NORAD: nodeData.NORAD } })) {


        return res.status(200).json({ chain: Chain.instance.chain })

        // check if the connection request node is active

        // get active node public key of connection request node


        // connect and mine the block
        const nodeWallet = new Wallet()

        nodeWallet.createORupdateLink(nodeData.NORAD, '')

        return res.status(200).json({ data: await prisma.satellite_info.create({ data: nodeData }) })
      } else return res.status(400).json(
        { name: "NORAD", category: "satellite_info", error: 'satellite with same NORAD already exists' }
      )

    if (nodeCategory == 'ground_station')
      if (!await prisma.ground_station_info.findUnique({ where: { id: nodeData.id } })) {
        return res.status(200).json({ data: await prisma.ground_station_info.create({ data: nodeData }) })
      } else return res.status(400).json(
        { name: "id", category: "ground_station_info", error: 'ground station with same ID already exists' }
      )

  } catch (error) {
    return res.status(400).json({ foreground: true, error })
  }

}
