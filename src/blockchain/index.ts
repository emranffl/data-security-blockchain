import * as crypto from "crypto"
import prisma from "@functionalities/DB/prismainstance"
import { blockchain_status, blockchain_type } from "@prisma/client"
import { initiateBlockchain } from "./blockchain-initiator"

export const BLOCK_MINING_DIFFICULTY = 1

interface TransactionDataType {
	name: string
	type: blockchain_type
	uuid: string // unique identifier for devices such as serial number/NORAD ID
	status: blockchain_status
}

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
		public networkNodePublicKey: string
	) {}

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
	constructor(
		// public transactionData: TransactionDataType | string,
		public name: TransactionDataType["name"],
		public status: TransactionDataType["status"],
		public type: TransactionDataType["type"],
		public uuid: TransactionDataType["uuid"],
		public connectingNodePublicKey: Transaction["connectingNodePublicKey"],
		public networkNodePublicKey: Transaction["networkNodePublicKey"],
		public precedingBlockHash: string,
		public blockDepth: number,
		public currentHash: string = "",
		public attempt: number = 0,
		public transactionDate: Date = new Date(),
		public nonce: number = Math.round(Math.random() * 999999999)
	) {}

	/**
	 * Hashes the block data and returns the hash.
	 */
	calculateHash() {
		const hash = crypto.createHash("MD5"),
			blockClone = { ...this }

		blockClone.currentHash = ""

		hash
			.update(
				blockClone.nonce + blockClone.attempt + JSON.stringify(blockClone)
			)
			.end()
		return hash.digest("hex")
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

	chain = [
		// prisma.blockchain.count() > 1
		// 	?
		//* genesis block generation
		(async () => {
			if ((await prisma.blockchain.count()) > 1) {
				return await prisma.blockchain.findMany()
			}

			const hash = crypto.createHash("MD5"),
				transaction = new Transaction(
					{
						name: "genesis",
						status: "Active",
						type: "genesis_block",
						uuid: "genesis_uuid",
					},
					"connecting_genesis_node_public_key_null",
					"network_genesis_node_public_key_null"
				),
				genesisBlock = new Block(
					transaction.transactionData.name,
					transaction.transactionData.status,
					transaction.transactionData.type,
					transaction.transactionData.uuid,
					transaction.connectingNodePublicKey,
					transaction.networkNodePublicKey,
					"genesis_preceding_block_hash_null",
					0,
					"genesis_current_block_hash_null"
				)

			hash.update(genesisBlock.toString()).end()

			genesisBlock.currentHash = hash.digest("hex")

			return genesisBlock
		})(),
		// : prisma.blockchain.findMany(),
	]

	constructor() {
		// this.chain = [
		//     //* genesis block generation
		//     (() => {
		//         const hash = crypto.createHash('MD5'),
		//             transaction = new Transaction(
		//                 { name: 'genesis', status: "Active", type: "genesis_block", uuid: "genesis_uuid" },
		//                 'connecting_genesis_node_public_key_null',
		//                 'network_genesis_node_public_key_null',
		//             ),
		//             genesisBlock = new Block(
		//                 transaction.transactionData.name,
		//                 transaction.transactionData.type,
		//                 transaction.transactionData.uuid,
		//                 transaction.transactionData.status,
		//                 transaction.connectingNodePublicKey,
		//                 transaction.networkNodePublicKey,
		//                 'genesis_preceding_block_hash_null',
		//                 0,
		//                 'genesis_current_block_hash_null'
		//             )

		//         hash.update(genesisBlock.toString()).end()

		//         genesisBlock.currentHash = hash.digest('hex')

		//         return genesisBlock
		//     })()
		// ]

		;(async () => {
			console.log("Initializing blockchain!")

			// await resetBlockchain()
			if ((await prisma.blockchain.count()) > 1) return

			await initiateBlockchain()
			// console.log('Blockchain initiated')

			return

			// validating with peer to peer network
			const DB_CHAIN = await prisma.blockchain.findMany()

			if (DB_CHAIN.length != this.chain.length) {
				console.log(
					"Chain length mismatch! Initializing chain on class instance initialization. DB chain: ",
					DB_CHAIN.length,
					"Chain instance: ",
					this.chain.length
				)

				return (this.chain = (() => {
					return JSON.parse(
						// workaround to convert bigint to number
						JSON.stringify(
							DB_CHAIN,
							(key, value) =>
								typeof value === "bigint" ? value.toString() : value // return everything else unchanged
						)
					)
				})())
			}

			this.chain = [
				//* genesis block generation
				(() => {
					const hash = crypto.createHash("MD5"),
						transaction = new Transaction(
							{
								name: "genesis",
								status: "Active",
								type: "genesis_block",
								uuid: "genesis_uuid",
							},
							"connecting_genesis_node_public_key_null",
							"network_genesis_node_public_key_null"
						),
						genesisBlock = new Block(
							transaction.transactionData.name,
							transaction.transactionData.status,
							transaction.transactionData.type,
							transaction.transactionData.uuid,
							transaction.connectingNodePublicKey,
							transaction.networkNodePublicKey,
							"genesis_preceding_block_hash_null",
							0,
							"genesis_current_block_hash_null"
						)

					hash.update(genesisBlock.toString()).end()

					genesisBlock.currentHash = hash.digest("hex")

					return genesisBlock
				})(),
			]

			// return this
		})()
	}

	// async init() {

	//     const hash = crypto.createHash('MD5'),
	//         transaction = new Transaction(
	//             { name: 'genesis', status: "Active", type: "genesis_block", uuid: "genesis_uuid" },
	//             'connecting_genesis_node_public_key_null',
	//             'network_genesis_node_public_key_null',
	//         ),
	//         genesisBlock = new Block(
	//             transaction.transactionData.name,
	//             transaction.transactionData.type,
	//             transaction.transactionData.uuid,
	//             transaction.transactionData.status,
	//             transaction.connectingNodePublicKey,
	//             transaction.networkNodePublicKey,
	//             'genesis_preceding_block_hash_null',
	//             0,
	//             'genesis_current_block_hash_null'
	//         )

	//     hash.update(genesisBlock.toString()).end()

	//     genesisBlock.currentHash = hash.digest('hex')

	//     const chain = await prisma.blockchain.findMany()
	//     if (chain.length != this.chain.length)
	//         this.chain = chain
	//     else
	//         this.chain = [genesisBlock]

	//     return this
	// }

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
			const currentBlock = this.chain[i] as Block,
				precedingBlock = this.chain[i - 1] as Block

			if (
				currentBlock.precedingBlockHash !== precedingBlock.calculateHash() &&
				currentBlock.hash !== currentBlock.calculateHash()
			)
				return false
		}

		return true
	}

	/**
	 * Implementation of proof-of-work.
	 * @param nonce a 9 digit random number
	 * @param blockData an object of Block class
	 * @returns hash string of block
	 */
	// mine(nonce: number, blockData: Block) {
	//     let attempt = 1,
	//         difficultyString = ''.padEnd(BLOCK_MINING_DIFFICULTY, '0')

	//     // console.log('mining - ⛏️  ⛏️  ⛏️')

	//     while (true) {
	//         const hash = crypto.createHash('MD5')

	//         blockData.attempt = attempt
	//         hash.update((nonce + attempt + blockData.toString()).toString()).end()

	//         const blockHash = hash.digest('hex')

	//         if (blockHash.substring(0, BLOCK_MINING_DIFFICULTY) === difficultyString) {
	//             // console.log(`Solved '${blockHash}' on ${attempt} attempt\n\n`)
	//             return blockHash
	//         }

	//         attempt++
	//     }
	// }

	mine(nonce: number, blockData: Block): Promise<string> {
		let attempt = 1
		const difficultyString = "".padEnd(BLOCK_MINING_DIFFICULTY, "0")

		return new Promise<string>((resolve, reject) => {
			while (true) {
				const hash = crypto.createHash("MD5")

				blockData.attempt = attempt
				hash.update((nonce + attempt + blockData.toString()).toString()).end()

				const blockHash = hash.digest("hex")

				if (
					blockHash.substring(0, BLOCK_MINING_DIFFICULTY) === difficultyString
				) {
					console.log(`Solved '${blockHash}' on ${attempt} attempt\n\n`)
					resolve(blockHash)
					break
				} else {
					attempt++
				}
			}
		})
	}

	/**
	 * Add a new block to the chain on valid signature & completing proof-of-work
	 * @param transaction an instance of Transaction class
	 * @param connectingNodePublicKey linking node's public key
	 * @param signature digital signature using linking node's key pairs
	 */
	async addBlock(
		transaction: Transaction,
		connectingNodePublicKey: string,
		signature: Buffer
	): Promise<Block> {
		const verifyTransaction = crypto
				.createVerify("SHA256")
				.update(transaction.toString()),
			isValid = verifyTransaction.verify(connectingNodePublicKey, signature)

		if (isValid) {
			const newBlock = new Block(
				transaction.transactionData.name,
				transaction.transactionData.status,
				transaction.transactionData.type,
				transaction.transactionData.uuid,
				transaction.connectingNodePublicKey,
				transaction.networkNodePublicKey,
				// transaction,
				(this.previousBlock as Block).hash,
				(this.previousBlock as Block).depth + 1
			)

			newBlock.currentHash = await this.mine(newBlock.nonce, newBlock)

			this.chain.push(newBlock)

			return newBlock
		} else throw new Error("Invalid signature!")
	}

	toString() {
		return JSON.stringify(this.chain)
	}
}

/**
 * Wallet gives a linking & receiving nodes a public-private key pair.
 * It acts as a digital address for the nodes.
 */
class Wallet {
	public publicKey: string
	public privateKey: string

	constructor(
		public_key: string | null = null,
		private_key: string | null = null
	) {
		const keyPair = crypto.generateKeyPairSync("rsa", {
			modulusLength: 2048,
			publicKeyEncoding: { type: "spki", format: "pem" },
			privateKeyEncoding: { type: "pkcs8", format: "pem" },
		})

		this.privateKey = private_key ?? keyPair.privateKey
		this.publicKey = public_key ?? keyPair.publicKey
	}

	createORupdateLink(
		linkData: TransactionDataType,
		networkNodePublicKey: typeof Wallet.prototype.publicKey
	) {
		//* throw error if linking to itself
		if (networkNodePublicKey == this.publicKey)
			throw new Error(
				"Cannot link to self! Provided public key is of the same node."
			)

		const transaction = new Transaction(
				linkData,
				this.publicKey,
				networkNodePublicKey
			),
			signature = crypto.createSign("SHA256")

		signature.update(transaction.toString()).end()

		return Chain.instance.addBlock(
			transaction,
			this.publicKey,
			signature.sign(this.privateKey)
		)
	}
}

export { Chain, Wallet }
export type { TransactionDataType }
