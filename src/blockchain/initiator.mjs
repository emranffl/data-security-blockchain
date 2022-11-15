import { PrismaClient, satellite_info_status, mobile_info_status } from '@prisma/client'
import flatten from 'flat'
import { Chain, Wallet } from './index.js'

const prisma = new PrismaClient(),
    initiateBlockchain = async () => {

        const sat = await prisma.satellite_info.findMany({ orderBy: { launch_date: 'asc' }, /*take:5*/ }),
            gs = await prisma.ground_station_info.findMany({ orderBy: { placement_date: 'asc' }, /*take:5*/ }),
            paa = await prisma.phased_array_antenna_info.findMany({ orderBy: { placement_date: 'asc' }, /*take:5*/ }),
            mobile = await prisma.mobile_info.findMany({ orderBy: { registration_date: 'asc' }, /*take:5*/ })

        let nodes = [
            // ...sat,
            // ...mobile,
            ...gs, 
            ...paa
        ],
            blockchainDBFormat = [],
            formatBlockToDBFormat = block => {
                return flatten(block, {
                    transformKey: function (key) {
                        return key.replace(/transaction|data/gi, '').replace('Date', 'transactionDate')
                    }
                })
            },
            networkNodePublicKey = Chain.instance.chain[0].transaction.networkNodePublicKey

        //* sort nodes by date-time in ascending order
        nodes = nodes.sort((firstElem, secondElem) => {
            return firstElem[firstElem['launch_date'] ? 'launch_date' :
                firstElem['placement_date'] ? 'placement_date' :
                    'registration_date'] -
                secondElem[secondElem['launch_date'] ? 'launch_date' :
                    secondElem['placement_date'] ? 'placement_date' :
                        'registration_date']
        })

        //*
        nodes.map(async (node, index) => {

            let nodeWallet = new Wallet()

            // updating public-private keys
            if (node.device_type == 'Satellite') {
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

            if (node.device_type == 'Ground_Station') {
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

            if (node.device_type == 'Phased_Array_Antenna') {
                await prisma.phased_array_antenna_info.update({
                    where: {
                        id: node.id
                    },
                    data: {
                        private_key: nodeWallet.privateKey,
                        public_key: nodeWallet.publicKey
                    }
                })
            }

            if (node.device_type == 'Mobile') {
                await prisma.mobile_info.update({
                    where: {
                        IMEI: node.IMEI
                    },
                    data: {
                        private_key: nodeWallet.privateKey,
                        public_key: nodeWallet.publicKey
                    }
                })
            }

            //* create blocks from sorted nodes
            for (let status of Object.values(node.device_type != 'Mobile' ? satellite_info_status : mobile_info_status)) {

                blockchainDBFormat.push(
                    formatBlockToDBFormat(
                        nodeWallet.createORupdateLink({
                            name: node.name && node.name || node.id && `PAA-${node.id.toString()}` /* for phased array antenna */,
                            type: node.device_type.replace(/ /g, '_'),
                            uuid: node.NORAD && node.NORAD.toString() || node.IMEI && node.IMEI.toString() || node.id && node.id.toString(),
                            status: status
                        }, networkNodePublicKey)
                    )
                )

                if (node.status == status) break
            }
        })
        // console.log(Chain.instance.chain.length)

        blockchainDBFormat.unshift(formatBlockToDBFormat(Chain.instance.chain[0]))
        console.log(Chain.instance.chain.length, blockchainDBFormat.length)

        //* store blockchain in DB
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

        if (await prisma.blockchain.count() != 0)
            await prisma.blockchain.deleteMany()

    }

await resetBlockchain()
await initiateBlockchain()

console.log('\n\n\nBlockchain initiated successfully!\n\n\n')