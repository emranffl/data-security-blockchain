import { PrismaClient } from '@prisma/client'
import flatten from 'flat'
import { Chain, Wallet } from './index.js'

const prisma = new PrismaClient(),
    initiateBlockchain = async () => {

        const sat = await prisma.satellite_info.findMany({ take: 5 }),
            gs = await prisma.ground_station_info.findMany({ take: 5 }),
            dishy = await prisma.dishy_info.findMany({ take: 5 }),
            mobile = await prisma.mobile_info.findMany({})

        let nodes = [...sat, ...gs, ...dishy], blockchainDBFormat = []

        // sort nodes by date-time in ascending order
        nodes = nodes.sort((firstElem, secondElem) => {
            if (firstElem.launch_date && secondElem.launch_date) {
                return firstElem.launch_date - secondElem.launch_date
            } else if (firstElem.launch_date && secondElem.placement_date) {
                return firstElem.launch_date - secondElem.placement_date
            } else if (firstElem.placement_date && secondElem.launch_date) {
                return firstElem.placement_date - secondElem.launch_date
            } else if (firstElem.placement_date && secondElem.placement_date) {
                return firstElem.placement_date - secondElem.placement_date
            }
        })

        // create blocks from sorted nodes
        nodes.map(async (node, index) => {

            let networkNodePublicKey = Chain.instance.chain[0].transaction.networkNodePublicKey,
                nodeWallet = new Wallet(), t = 1

            if (node.device_type === 'Satellite') {
                await prisma.satellite_info.update({
                    where: {
                        NORAD: node.NORAD
                    },
                    data: {
                        private_key: nodeWallet.privateKey,
                        public_key: nodeWallet.publicKey
                    }
                })
            }

            if (node.device_type === 'Ground_Station') {
                await prisma.ground_station_info.update({
                    where: {
                        id: node.id
                    },
                    data: {
                        private_key: nodeWallet.privateKey,
                        public_key: nodeWallet.publicKey
                    }
                })
            }

            if (node.device_type === 'Phased_Array_Antenna') {
                await prisma.dishy_info.update({
                    where: {
                        id: node.id
                    },
                    data: {
                        private_key: nodeWallet.privateKey,
                        public_key: nodeWallet.publicKey
                    }
                })
            }

            for (let status of ['Positioned', 'Active', 'Inactive', 'Decommissioned']) {

                // network nodes public key randomization to connect to any node
                // let activeNodes = Chain.instance.chain.filter(
                //     (block, index) => index != 0 && block.transaction.transactionData.status == 'Active'
                // )

                // networkNodePublicKey =
                //     activeNodes.length == 0 ?
                //         Chain.instance.chain[Chain.instance.chain.length - 1].transaction.connectingNodePublicKey + t++
                //         : activeNodes[Math.floor(Math.random() * activeNodes.length)].transaction.connectingNodePublicKey



                nodeWallet.createORupdateLink({
                    name: node.name ?? node.id,
                    type: node.device_type.replace(/ /g, '_'),
                    uuid: node.NORAD && node.NORAD.toString() || node.id && node.id.toString() || "Unknown",
                    status: status
                }, networkNodePublicKey)

                if (node.status == status) break

            }

        })

        Chain.instance.chain.map((block, index) => {

            blockchainDBFormat.push(flatten(block, {
                transformKey: function (key) {
                    return key.replace(/transaction|data/gi, '').replace('Date', 'transactionDate')
                }
            }))
        })

        try {
            await prisma.blockchain.createMany({
                data: blockchainDBFormat
            })
        } catch (error) {
            console.log(error)
        }
    },
    resetBlockchain = async () => {
        Chain.instance.chain.length = 1

        if (await prisma.blockchain.count() != 0) {
            await prisma.blockchain.deleteMany()
        }
    }

await resetBlockchain()
await initiateBlockchain()

console.log('\n\n\nBlockchain initiated successfully!\n\n\n')