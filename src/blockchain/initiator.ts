import prisma from '@functionalities/DB/prismainstance'

const sat = await prisma.satellite_info.findMany(),
    gs = await prisma.ground_station_info.findMany()

let nodes = [...sat, ...gs]

// sort nodes by date in ascending order
// nodes = nodes.map((node) => {
//     console.log(node)

//     return node
// })

console.log(nodes.sort())

// if (await prisma.blockchain.count() == 0) {
    // await prisma.blockchain.createMany({
    //     data: []
    // })
// }