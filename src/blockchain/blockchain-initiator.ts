import {
    PrismaClient,
    blockchain_type,

    satellite_info,
    ground_station_info,
    phased_array_antenna_info,
    mobile_info,
    aircraft_info,
    vehicle_info,
    watercraft_info,

    satellite_info_status,
    ground_station_info_status,
    phased_array_antenna_info_status,
    mobile_info_status,
    aircraft_info_status,
    vehicle_info_status,
    watercraft_info_status,
    blockchain_status
} from '@prisma/client'
import { cpuUsage, memoryUsage } from 'process'
import { BLOCK_MINING_DIFFICULTY, Chain, Wallet } from './index'

const prisma = new PrismaClient(),
    createBlock = (
        {
            node,
            status,
            nodeWallet,
            networkNodePublicKey
        }: {
            node: any,
            status: keyof typeof blockchain_status,
            nodeWallet: Wallet,
            networkNodePublicKey: string
        }
    ) => {
        nodeWallet.createORupdateLink({
            name: node.name && node.name,
            type: node.device_type as keyof typeof blockchain_type,
            uuid: (node as satellite_info).NORAD && (node as satellite_info).NORAD.toString() ||
                (node as mobile_info).IMEI && (node as mobile_info).IMEI.toString() ||
                (node as vehicle_info).VIN && (node as vehicle_info).VIN.toString() ||
                (node as ground_station_info | phased_array_antenna_info | aircraft_info | watercraft_info).id.toString(),
            status: status,
        }, networkNodePublicKey)
    },
    updatePublicPrivateKey = async (
        node: satellite_info |
            ground_station_info |
            mobile_info |
            aircraft_info |
            vehicle_info |
            watercraft_info,
        nodeWallet: Wallet) => {
        if (node.device_type == blockchain_type.Satellite) {
            await prisma.satellite_info.update({
                where: {
                    NORAD: (node as satellite_info).NORAD
                },
                data: {
                    private_key: nodeWallet.privateKey,
                    public_key: nodeWallet.publicKey
                }
            })
        }

        if (node.device_type == blockchain_type.Ground_Station) {
            await prisma.ground_station_info.update({
                where: {
                    id: (node as ground_station_info).id
                },
                data: {
                    private_key: nodeWallet.privateKey,
                    public_key: nodeWallet.publicKey
                }
            })
        }

        if (node.device_type == blockchain_type.Phased_Array_Antenna) {
            await prisma.phased_array_antenna_info.update({
                where: {
                    id: (node as phased_array_antenna_info).id
                },
                data: {
                    private_key: nodeWallet.privateKey,
                    public_key: nodeWallet.publicKey
                }
            })
        }

        if (node.device_type == blockchain_type.Mobile) {
            await prisma.mobile_info.update({
                where: {
                    IMEI: (node as mobile_info).IMEI
                },
                data: {
                    private_key: nodeWallet.privateKey,
                    public_key: nodeWallet.publicKey
                }
            })
        }

        if (node.device_type == blockchain_type.Aircraft) {
            await prisma.aircraft_info.update({
                where: {
                    id: (node as aircraft_info).id
                },
                data: {
                    private_key: nodeWallet.privateKey,
                    public_key: nodeWallet.publicKey
                }
            })
        }

        if (node.device_type == blockchain_type.Vehicle) {
            await prisma.vehicle_info.update({
                where: {
                    VIN: (node as vehicle_info).VIN
                },
                data: {
                    private_key: nodeWallet.privateKey,
                    public_key: nodeWallet.publicKey
                }
            })
        }

        if (node.device_type == blockchain_type.Watercraft) {
            await prisma.watercraft_info.update({
                where: {
                    id: (node as watercraft_info).id
                },
                data: {
                    private_key: nodeWallet.privateKey,
                    public_key: nodeWallet.publicKey
                }
            })
        }
    },
    initiateBlockchain = async () => {

        const [sat, gs, paa, mobile, aircraft, vehicle, watercraft] = await prisma.$transaction([
            prisma.satellite_info.findMany({ orderBy: { launched_on: 'asc' }, take: 10 }),
            prisma.ground_station_info.findMany({ orderBy: { positioned_on: 'asc' }, take: 10 }),
            prisma.phased_array_antenna_info.findMany({ orderBy: { positioned_on: 'asc' }, take: 10 }),
            prisma.mobile_info.findMany({ orderBy: { registered_on: 'asc' }, take: 10 }),
            prisma.aircraft_info.findMany({ orderBy: { operating_from: 'asc' }, take: 10 }),
            prisma.vehicle_info.findMany({ orderBy: { purchased_on: 'asc' }, take: 10 }),
            prisma.watercraft_info.findMany({ orderBy: { operating_from: 'asc' }, take: 10 })
        ]), DEVICE_STATUS = {
            [blockchain_type.Satellite]: satellite_info_status,
            [blockchain_type.Ground_Station]: ground_station_info_status,
            [blockchain_type.Phased_Array_Antenna]: phased_array_antenna_info_status,
            [blockchain_type.Mobile]: mobile_info_status,
            [blockchain_type.Aircraft]: aircraft_info_status,
            [blockchain_type.Vehicle]: vehicle_info_status,
            [blockchain_type.Watercraft]: watercraft_info_status
        }

        let nodes = [
            ...sat,
            ...mobile,
            ...gs,
            ...paa,
            ...aircraft,
            ...vehicle,
            ...watercraft
        ],
            networkNodePublicKey = Chain.instance.chain[0].networkNodePublicKey

        //* sort nodes by date-time in ascending order
        nodes = nodes.sort((firstElem, secondElem) => {
            function getFirstLaunchDate(firstElem: any) {
                return firstElem[
                    firstElem['launched_on'] ? 'launched_on' :
                        firstElem['positioned_on'] ? 'positioned_on' :
                            firstElem['registered_on'] ? 'registered_on' :
                                firstElem['operating_from'] ? 'operating_from' :
                                    'purchased_on'
                ]
            }

            function getSecondLaunchDate(secondElem: any) {
                return secondElem[
                    secondElem['launched_on'] ? 'launched_on' :
                        secondElem['positioned_on'] ? 'positioned_on' :
                            secondElem['registered_on'] ? 'registered_on' :
                                secondElem['operating_from'] ? 'operating_from' :
                                    'purchased_on'
                ]
            }

            return getFirstLaunchDate(firstElem) - getSecondLaunchDate(secondElem)
        })


        nodes.map(async (node, index) => {

            let nodeWallet = new Wallet()

            // * updating device public-private keys
            await updatePublicPrivateKey(node, nodeWallet)

            //* create blocks from sorted nodes
            for (let status of Object.values(DEVICE_STATUS[node.device_type as keyof typeof DEVICE_STATUS])) {

                let timeStart = new Date(),
                    initializeCPUUsage = cpuUsage(),
                    initializeMemoryUsage = memoryUsage()

                createBlock({ node, status, nodeWallet, networkNodePublicKey })

                let timeEnd = new Date(),
                    timeConsumed = timeEnd.getTime() - timeStart.getTime(),
                    CPUUsage = cpuUsage(initializeCPUUsage),
                    memUsage = memoryUsage()

                console.log(`Block created in ${timeConsumed / 1000}s with difficulty ${BLOCK_MINING_DIFFICULTY}`)
                console.log('CPU usage: ', CPUUsage);
                console.log('Memory usage: ', memUsage);

                if (node.status == status) {
                    break
                }
            }
        })

        console.log('Chain length: ', Chain.instance.chain.length)

        //* store blockchain in DB
        try {
            await prisma.blockchain.deleteMany()
            await prisma.blockchain.createMany({
                data: Chain.instance.chain
            })
        } catch (error) {
            console.log(error)
        }

        console.log('\n\n\nBlockchain initiated successfully!\n\n\n')
    },
    resetBlockchain = async () => {
        Chain.instance.chain.length = 1

        if (await prisma.blockchain.count() != 0)
            await prisma.blockchain.deleteMany()

    }

export { initiateBlockchain, resetBlockchain }
