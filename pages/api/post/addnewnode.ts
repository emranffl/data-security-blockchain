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

  const { nodeCategory, nodeData, connectToDevice } = req.body
  try {
    console.log(req.body)

    if (nodeCategory == 'satellite')
      if (!await prisma.satellite_info.findUnique({ where: { NORAD: nodeData.NORAD } })) {

        // check if the connection request node is active
        return res.status(200).json({
          chain:
            await prisma.blockchain.findFirst({ where: { uuid: connectToDevice['device_id'], status: 'Active' }, orderBy: { transactionDate: 'desc' } })
        })

        if ((await prisma.blockchain.findFirst({
          where: {
            uuid: connectToDevice['device_id'],
          }, orderBy: { transactionDate: 'desc' }
        }))?.status == 'Active') {
          // get active node public & private key of connection request node
          const networkSatellite = await prisma.satellite_info.findUnique({
            where: {
              NORAD: connectToDevice['device_id']
            }
          }),
            publicKey = networkSatellite!.public_key as string,

            // mine the block
            nodeWallet = new Wallet()

          nodeWallet.createORupdateLink(nodeData.NORAD, publicKey)
        } else
          return res.status(400).json(
            { name: "NORAD", category: "satellite_info", error: 'satellite status not active, refused to connect' }
          )

        return res.status(200).json({ data: await prisma.satellite_info.create({ data: nodeData }) })
      } else return res.status(400).json(
        { name: "NORAD", category: "satellite_info", error: 'satellite with same NORAD already exists' }
      )

    if (nodeCategory == 'ground_station')
      if (!await prisma.ground_station_info.findUnique({ where: { id: nodeData.id } })) {
        const nodeWallet = new Wallet(),
          networkNodePublicKey = (await prisma.ground_station_info.findUnique({ where: { id: connectToDevice['device_id'] } }))!.public_key as string,
          newBlock = nodeWallet.createORupdateLink(
            nodeCategory,
            networkNodePublicKey
          )

        await prisma.ground_station_info.create({ data: { ...nodeData, public_key: nodeWallet.publicKey, private_key: nodeWallet.privateKey } })

        await prisma.blockchain.create({
          data: {
            attempt: newBlock.attempt,
            blockDepth: newBlock.depth,
            nonce: newBlock.nonce,
            transactionDate: newBlock.transactionDate,
            currentHash: newBlock.hash,
            precedingBlockHash: newBlock.precedingBlockHash,
            connectingNodePublicKey: nodeWallet.publicKey,
            networkNodePublicKey,
            name: nodeData.name,
            uuid: nodeData.id,
            status: nodeData.status,
            type: 'Ground_Station',
          }
        })


        return res.status(200).json({ data: Chain.instance.chain })
      } else return res.status(400).json(
        { name: "id", category: "ground_station_info", error: 'ground station with same ID already exists' }
      )

  } catch (error) {
    return res.status(400).json({ foreground: true, error })
  }

}
