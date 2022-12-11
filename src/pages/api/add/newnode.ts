import prisma from '@functionalities/DB/prismainstance'
import { satellite_info, ground_station_info } from '@prisma/client'
import type { NextApiRequest, NextApiResponse } from 'next'
import { Chain, TransactionDataType, Wallet } from '@blockchain/index'
import { Device } from '@pages/_app'

type Data = {
  [key: string]: satellite_info | ground_station_info | unknown
}

export default async function handler(
  req: NextApiRequest,
  res: NextApiResponse<Data>
) {

  const { deviceType, deviceData, connectToNode } = req.body
  try {
    // console.log(req.body, Device.Type.GroundStation == deviceType)
    // return res.status(400).json({ foreground: true, error: 'Not implemented' })

    if (deviceType == Device.Type.Satellite)
      if (!await prisma.satellite_info.findUnique({ where: { NORAD: deviceData.NORAD } })) {

        // check if the connection request node is active
        return res.status(200).json({
          chain:
            await prisma.blockchain.findFirst({ where: { uuid: connectToNode['device_id'], status: 'Active' }, orderBy: { transactionDate: 'desc' } })
        })

        if ((await prisma.blockchain.findFirst({
          where: {
            uuid: connectToNode['device_id'],
          }, orderBy: { transactionDate: 'desc' }
        }))?.status == 'Active') {
          // get active node public & private key of connection request node
          const networkSatellite = await prisma.satellite_info.findUnique({
            where: {
              NORAD: connectToNode['device_id']
            }
          }),
            publicKey = networkSatellite!.public_key as string,

            // mine the block
            nodeWallet = new Wallet()

          nodeWallet.createORupdateLink(deviceData.NORAD, publicKey)
        } else
          return res.status(400).json(
            { name: "NORAD", category: "satellite_info", error: 'satellite status not active, refused to connect' }
          )

        return res.status(200).json({ data: await prisma.satellite_info.create({ data: deviceData }) })
      } else return res.status(400).json(
        { name: "NORAD", category: "satellite_info", error: 'satellite with same NORAD already exists' }
      )

    // * Ground Station
    if (deviceType == Device.Type.GroundStation) {
      // check if node already exists
      if (await prisma.ground_station_info.findUnique({ where: { id: deviceData.id } }))
        return res.status(400).json({
          name: "id", category: "ground_station_info", error: 'ground station with same ID already exists'
        })

      // * device connection policy checker
      // if (await validateNetworkNode(deviceType, connectToNode)) {
      //   await createNodeAndMineBlock(deviceData, connectToNode)
      // }

    }
    return res.status(200).json({ data: Chain.  instance.chain })
  }

  catch (error) {
    return res.status(400).json({ foreground: true, error })
  }

}

async function validateNetworkNode(deviceType: string, connectToDevice: any) {

  // TODO: implement device connection policy checker

  // check if the connection request node is active
  if ((await prisma.blockchain.findFirst({
    where: {
      uuid: connectToDevice['device_id'],
    }, orderBy: { transactionDate: 'desc' }
  }))?.status == 'Active')
    return true
  else
    return false

}

async function createNodeAndMineBlock(nodeData: any, connectToDevice: any) {
  // throw new Error('Function not implemented.')

  const nodeWallet = new Wallet(),
  // get active node public & private key of connection request node
  networkNodePublicKey = (await prisma.ground_station_info.findUnique({
      where: { id: connectToDevice['device_id'] }
    }))!.public_key as string,
    // mine & add the block
    newBlock = nodeWallet.createORupdateLink(
      nodeData,
      networkNodePublicKey
    )

  return await prisma.$transaction([
    // connectToDevice.device_type == Device.Type.GroundStation && 
    prisma.ground_station_info.create({
      data: {
        ...nodeData,
        device_type: nodeData.device_type,
        placement_date: nodeData.placement_date,
        public_key: nodeWallet.publicKey,
        private_key: nodeWallet.privateKey
      }
    }),
    prisma.blockchain.create({
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
        uuid: nodeData.uuid,
        status: nodeData.status,
        type: 'Ground_Station',
      }
    })
  ])
}