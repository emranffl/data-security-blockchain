import { PrismaClient } from "@prisma/client"
import crypto from 'crypto'

const prisma = new PrismaClient()

const
    dishy = await prisma.phased_array_antenna_info.findMany()

let vehicle = []

dishy.map(dish => {
    vehicle.push({
        VIN: crypto.randomBytes(9).toString('hex').toUpperCase().substring(1),
        model: [
            // 'Model X', 'Model Y', 'Model 3', 'Model S',
            'Tesla Semi'
        ][(() => {
            return Math.floor(Math.random() * 1)
        })()],
        brand: "Tesla",
        make_year: (() => {
            return Math.floor(Math.random() * 20) + 2009
        })(),
        color: ['red', 'blue', 'green', 'yellow', 'black', 'white', 'silver', 'gold'][(() => {
            return Math.floor(Math.random() * 8)
        })()],
        status: ['Active', 'Inactive'][(() => {
            return Math.floor(Math.random() * 2)
        })()],
        device_type: 'Vehicle',
        vehicle_type: [
            // 'sedan',
            'truck',
        ][(() => {
            return Math.floor(Math.random() * 1)
        })()],
        purchase_date: (() => {
            return new Date(new Date().setFullYear(new Date().getFullYear() - Math.floor(Math.random() * 12))).toISOString()
        })(),
        public_key: null,
        private_key: null,
    })
})

console.log(vehicle.splice(55, 95))

// await prisma.vehicle_info.upsert({
//     data: vehicle.splice(55, 95)
// })

console.log('done')