import * as crypto from 'crypto'


const BLOCK_MINING_DIFFICULTY = 3


type TransactionDataType = {
    name: string,
    type: 'Satellite' | 'Ground Station' | 'Phased Array Antenna' | string,
    uuid: string, // unique identifier for devices such as serial number/NORAD ID
    status: 'Positioned' | 'Active' | 'Inactive' | 'Decommissioned'
} | string

/**
 * Data & connectivity details between two nodes.
 * @param transactionData JSON
 * @param connectingNodePublicKey linking node's public key
 * @param networkNodePublicKey receiving node's public key
 */
class Transaction {
    constructor(
        public transactionData: TransactionDataType,
        public connectingNodePublicKey: string,
        public networkNodePublicKey: string,
    ) { }

    toString() {
        return JSON.stringify(this)
    }
}


/**
 * Individual block on the chain. Similar to an element on a linked list.
 * @param transaction an instance of Transaction class
 * @param precedingBlockHash hash string of previous block
 * @param blockDepth number of blocks preceding this block
 * @param currentHash hash string of current block
 * @param attempt iteration of mining to find hash with correct difficulty string
 * @param transactionDate timestamp of block creation
 */
class Block {
    public nonce = Math.round(Math.random() * 999999999)

    constructor(
        public transaction: Transaction,
        public precedingBlockHash: string,
        public blockDepth: number,
        public currentHash: string = '',
        public attempt: number = 0,
        public transactionDate: Date = new Date(),
    ) { }

    /**
     * Hashes the block data and returns the hash.
    */
    calculateHash() {
        const hash = crypto.createHash('MD5'),
            blockClone = { ...this }

        blockClone.currentHash = ''

        hash.update((blockClone.nonce + blockClone.attempt) + JSON.stringify(blockClone)).end()
        return hash.digest('hex')
    }

    get hash() {
        return this.currentHash
    }

    get depth() {
        return this.blockDepth
    }

    toString() {
        return JSON.stringify(this)
    }
}


/**
 * The blockchain that holds all the blocks.
 */
class Chain {
    //* singleton instance
    public static instance = new Chain()

    chain: Block[]

    constructor() {
        this.chain = [
            //* genesis block generation
            (() => {
                const hash = crypto.createHash('MD5'),
                    genesisBlock = new Block(
                        new Transaction(
                            { name: 'genesis', status: "Active", type: "genesis_block", uuid: "genesis_uuid" },
                            'connecting_genesis_node_public_key_null',
                            'network_genesis_node_public_key_null',
                        ),
                        'proceeding_genesis_block_hash_null',
                        0,
                        'current_genesis_block_hash_null'
                    )

                hash.update(genesisBlock.toString()).end()

                genesisBlock.currentHash = hash.digest('hex')

                return genesisBlock
            })()
        ]   
    }

    /**
     * Retrieves the previous block of the chain.
     */
    get previousBlock() {
        return this.chain[this.chain.length - 1]
    }

    /**
     * Validate the chain by checking the hash of each block.
     */
    get chainIsValid() {
        for (let i = 1; i < this.chain.length; i++) {
            const currentBlock = this.chain[i],
                precedingBlock = this.chain[i - 1]

            if (currentBlock.precedingBlockHash !== precedingBlock.calculateHash() &&
                currentBlock.hash !== currentBlock.calculateHash()) return false
        }

        return true
    }

    /**
     * Implementation of proof-of-work.
     * @param nonce a 9 digit random number
     * @param blockData an object of Block class
     * @returns hash string of block
     */
    mine(nonce: number, blockData: Block) {
        let attempt = 1,
            difficultyString = ''.padEnd(BLOCK_MINING_DIFFICULTY, '0')

        console.log('mining - ⛏️  ⛏️  ⛏️')

        while (true) {
            const hash = crypto.createHash('MD5')

            blockData.attempt = attempt
            hash.update((nonce + attempt + blockData.toString()).toString()).end()

            const blockHash = hash.digest('hex')

            if (blockHash.substring(0, BLOCK_MINING_DIFFICULTY) === difficultyString) {
                console.log(`Solved '${blockHash}' on ${attempt} attempt\n\n`)
                return blockHash
            }

            attempt++
        }
    }

    /**
     * Add a new block to the chain on valid signature & completing proof-of-work
     * @param transaction an instance of Transaction class
     * @param connectingNodePublicKey linking node's public key
     * @param signature digital signature using linking node's key pairs
     */
    addBlock(
        transaction: Transaction,
        connectingNodePublicKey: string,
        signature: Buffer,
    ) {
        const verifyTransaction = crypto.createVerify('SHA256').update(transaction.toString()),
            isValid = verifyTransaction.verify(connectingNodePublicKey, signature)

        if (isValid) {
            const newBlock = new Block(transaction, this.previousBlock.hash, this.previousBlock.blockDepth + 1)

            newBlock.currentHash = this.mine(newBlock.nonce, newBlock)

            this.chain.push(newBlock)
        }
    }

    toString() {
        return JSON.stringify(this)
    }
}

/**
 * Wallet gives a linking & receiving nodes a public-private key pair.
 * It acts as a digital address for the nodes.
 */
class Wallet {
    public publicKey: string
    public privateKey: string

    constructor() {
        const keyPair = crypto.generateKeyPairSync('rsa', {
            modulusLength: 2048,
            publicKeyEncoding: { type: 'spki', format: 'pem' },
            privateKeyEncoding: { type: 'pkcs8', format: 'pem' },
        })

        this.privateKey = keyPair.privateKey
        this.publicKey = keyPair.publicKey
    }

    createORupdateLink(linkData: TransactionDataType, networkNodePublicKey: typeof Wallet.prototype.publicKey) {
        // throw error if linking to itself
        if (networkNodePublicKey == this.publicKey) throw new Error('Cannot link to self')

        const transaction = new Transaction(linkData, this.publicKey, networkNodePublicKey),
            signature = crypto.createSign('SHA256')

        signature.update(transaction.toString()).end()

        Chain.instance.addBlock(transaction, this.publicKey, signature.sign(this.privateKey))
    }
}


export { Chain, Wallet }
export type { TransactionDataType }

// //* example usage

// const john = new Wallet()
// const wick = new Wallet()
// const bob = new Wallet()
// const alice = new Wallet()

// try {

//     john.createORupdateLink({ name: 'STARLINK-4586', status: 'Active', type: 'Satellite', uuid: '2022-104BA' }, bob.publicKey)
//     bob.createORupdateLink({ name: 'STARLINK-4587', status: 'Active', type: 'Satellite', uuid: '2022-104AZ' }, alice.publicKey)
//     alice.createORupdateLink({ name: 'STARLINK-4592', status: 'Active', type: 'Satellite', uuid: '2022-104AY' }, wick.publicKey)
//     // wick.createORupdateLink({ name: 'STARLINK-4599', status: 'Active', type: 'Satellite', uuid: '2022-104AV' }, wick.publicKey)
// } catch (error) {
//     console.error(error)
// }
