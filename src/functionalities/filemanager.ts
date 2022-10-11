import fs from 'fs'

export const write = (path: string, data: object) => {
    fs.writeFile('', JSON.stringify(data, null, 4), 'utf8', err => {
        console.error(err)
        return false
    })

    return true
}