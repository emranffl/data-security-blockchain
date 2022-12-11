"use strict";
var __assign = (this && this.__assign) || function () {
    __assign = Object.assign || function(t) {
        for (var s, i = 1, n = arguments.length; i < n; i++) {
            s = arguments[i];
            for (var p in s) if (Object.prototype.hasOwnProperty.call(s, p))
                t[p] = s[p];
        }
        return t;
    };
    return __assign.apply(this, arguments);
};
var __awaiter = (this && this.__awaiter) || function (thisArg, _arguments, P, generator) {
    function adopt(value) { return value instanceof P ? value : new P(function (resolve) { resolve(value); }); }
    return new (P || (P = Promise))(function (resolve, reject) {
        function fulfilled(value) { try { step(generator.next(value)); } catch (e) { reject(e); } }
        function rejected(value) { try { step(generator["throw"](value)); } catch (e) { reject(e); } }
        function step(result) { result.done ? resolve(result.value) : adopt(result.value).then(fulfilled, rejected); }
        step((generator = generator.apply(thisArg, _arguments || [])).next());
    });
};
var __generator = (this && this.__generator) || function (thisArg, body) {
    var _ = { label: 0, sent: function() { if (t[0] & 1) throw t[1]; return t[1]; }, trys: [], ops: [] }, f, y, t, g;
    return g = { next: verb(0), "throw": verb(1), "return": verb(2) }, typeof Symbol === "function" && (g[Symbol.iterator] = function() { return this; }), g;
    function verb(n) { return function (v) { return step([n, v]); }; }
    function step(op) {
        if (f) throw new TypeError("Generator is already executing.");
        while (_) try {
            if (f = 1, y && (t = op[0] & 2 ? y["return"] : op[0] ? y["throw"] || ((t = y["return"]) && t.call(y), 0) : y.next) && !(t = t.call(y, op[1])).done) return t;
            if (y = 0, t) op = [op[0] & 2, t.value];
            switch (op[0]) {
                case 0: case 1: t = op; break;
                case 4: _.label++; return { value: op[1], done: false };
                case 5: _.label++; y = op[1]; op = [0]; continue;
                case 7: op = _.ops.pop(); _.trys.pop(); continue;
                default:
                    if (!(t = _.trys, t = t.length > 0 && t[t.length - 1]) && (op[0] === 6 || op[0] === 2)) { _ = 0; continue; }
                    if (op[0] === 3 && (!t || (op[1] > t[0] && op[1] < t[3]))) { _.label = op[1]; break; }
                    if (op[0] === 6 && _.label < t[1]) { _.label = t[1]; t = op; break; }
                    if (t && _.label < t[2]) { _.label = t[2]; _.ops.push(op); break; }
                    if (t[2]) _.ops.pop();
                    _.trys.pop(); continue;
            }
            op = body.call(thisArg, _);
        } catch (e) { op = [6, e]; y = 0; } finally { f = t = 0; }
        if (op[0] & 5) throw op[1]; return { value: op[0] ? op[1] : void 0, done: true };
    }
};
exports.__esModule = true;
exports.Wallet = exports.Chain = void 0;
var crypto = require("crypto");
var BLOCK_MINING_DIFFICULTY = 0, prisma = require('@prisma/client');
/**
 * Data & connectivity details between two nodes.
 * @param transactionData JSON
 * @param connectingNodePublicKey linking node's public key
 * @param networkNodePublicKey receiving node's public key
 */
var Transaction = /** @class */ (function () {
    function Transaction(transactionData, connectingNodePublicKey, networkNodePublicKey) {
        this.transactionData = transactionData;
        this.connectingNodePublicKey = connectingNodePublicKey;
        this.networkNodePublicKey = networkNodePublicKey;
    }
    Transaction.prototype.toString = function () {
        return JSON.stringify(this);
    };
    return Transaction;
}());
/**
 * Individual block on the chain. Similar to an element on a linked list.
 * @param transaction an instance of Transaction class
 * @param precedingBlockHash hash string of previous block
 * @param blockDepth number of blocks preceding this block
 * @param currentHash hash string of current block
 * @param attempt iteration of mining to find hash with correct difficulty string
 * @param transactionDate timestamp of block creation
 */
var Block = /** @class */ (function () {
    function Block(
    // public transactionData: TransactionDataType | string,
    name, type, uuid, status, connectingNodePublicKey, networkNodePublicKey, precedingBlockHash, blockDepth, currentHash, attempt, transactionDate) {
        if (currentHash === void 0) { currentHash = ''; }
        if (attempt === void 0) { attempt = 0; }
        if (transactionDate === void 0) { transactionDate = new Date(); }
        this.name = name;
        this.type = type;
        this.uuid = uuid;
        this.status = status;
        this.connectingNodePublicKey = connectingNodePublicKey;
        this.networkNodePublicKey = networkNodePublicKey;
        this.precedingBlockHash = precedingBlockHash;
        this.blockDepth = blockDepth;
        this.currentHash = currentHash;
        this.attempt = attempt;
        this.transactionDate = transactionDate;
        this.nonce = Math.round(Math.random() * 999999999);
    }
    /**
     * Hashes the block data and returns the hash.
    */
    Block.prototype.calculateHash = function () {
        var hash = crypto.createHash('MD5'), blockClone = __assign({}, this);
        blockClone.currentHash = '';
        hash.update((blockClone.nonce + blockClone.attempt) + JSON.stringify(blockClone)).end();
        return hash.digest('hex');
    };
    Object.defineProperty(Block.prototype, "hash", {
        get: function () {
            return this.currentHash;
        },
        enumerable: false,
        configurable: true
    });
    Object.defineProperty(Block.prototype, "depth", {
        get: function () {
            return this.blockDepth;
        },
        enumerable: false,
        configurable: true
    });
    Block.prototype.toString = function () {
        return JSON.stringify(this);
    };
    return Block;
}());
/**
 * The blockchain that holds all the blocks.
 */
var Chain = /** @class */ (function () {
    function Chain() {
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
        //                 'preceding_genesis_block_hash_null',
        //                 0,
        //                 'current_genesis_block_hash_null'
        //             )
        var _this = this;
        //         hash.update(genesisBlock.toString()).end()
        //         genesisBlock.currentHash = hash.digest('hex')
        //         return genesisBlock
        //     })()
        // ]
        return (function () { return __awaiter(_this, void 0, void 0, function () {
            var chain;
            return __generator(this, function (_a) {
                switch (_a.label) {
                    case 0: return [4 /*yield*/, prisma.blockchain.findMany()];
                    case 1:
                        chain = _a.sent();
                        if (chain.length != Chain.instance.chain.length) {
                            console.log('chain length mismatch');
                            return [2 /*return*/, this.chain = chain];
                        }
                        else
                            this.chain = [
                                //* genesis block generation
                                (function () {
                                    var hash = crypto.createHash('MD5'), transaction = new Transaction({ name: 'genesis', status: "Active", type: "genesis_block", uuid: "genesis_uuid" }, 'connecting_genesis_node_public_key_null', 'network_genesis_node_public_key_null'), genesisBlock = new Block(transaction.transactionData.name, transaction.transactionData.type, transaction.transactionData.uuid, transaction.transactionData.status, transaction.connectingNodePublicKey, transaction.networkNodePublicKey, 'preceding_genesis_block_hash_null', 0, 'current_genesis_block_hash_null');
                                    hash.update(genesisBlock.toString()).end();
                                    genesisBlock.currentHash = hash.digest('hex');
                                    return genesisBlock;
                                })()
                            ];
                        return [2 /*return*/, this];
                }
            });
        }); })();
    }
    Object.defineProperty(Chain.prototype, "previousBlock", {
        // static async init() {
        //     const chain = await prisma.blockchain.findMany()
        //     if (chain.length != Chain.instance.chain.length)
        //         return this.instance.setChain = chain
        // const hash = crypto.createHash('MD5'),
        //     transaction = new Transaction(
        //         { name: 'genesis', status: "Active", type: "genesis_block", uuid: "genesis_uuid" },
        //         'connecting_genesis_node_public_key_null',
        //         'network_genesis_node_public_key_null',
        //     ),
        //     genesisBlock = new Block(
        //         transaction.transactionData.name,
        //         transaction.transactionData.type,
        //         transaction.transactionData.uuid,
        //         transaction.transactionData.status,
        //         transaction.connectingNodePublicKey,
        //         transaction.networkNodePublicKey,
        //         'preceding_genesis_block_hash_null',
        //         0,
        //         'current_genesis_block_hash_null'
        //     )
        // hash.update(genesisBlock.toString()).end()
        // genesisBlock.currentHash = hash.digest('hex')
        // return [genesisBlock]
        // }
        // private set setChain(chain: blockchain[]) {
        //     this.chain = chain
        // }
        /**
         * Retrieves the previous block of the chain.
         */
        get: function () {
            return this.chain[this.chain.length - 1];
        },
        enumerable: false,
        configurable: true
    });
    Object.defineProperty(Chain.prototype, "chainIsValid", {
        /**
         * Validate the chain by checking the hash of each block.
         */
        get: function () {
            for (var i = 1; i < this.chain.length; i++) {
                var currentBlock = this.chain[i], precedingBlock = this.chain[i - 1];
                if (currentBlock.precedingBlockHash !== precedingBlock.calculateHash() &&
                    currentBlock.hash !== currentBlock.calculateHash())
                    return false;
            }
            return true;
        },
        enumerable: false,
        configurable: true
    });
    /**
     * Implementation of proof-of-work.
     * @param nonce a 9 digit random number
     * @param blockData an object of Block class
     * @returns hash string of block
     */
    Chain.prototype.mine = function (nonce, blockData) {
        var attempt = 1, difficultyString = ''.padEnd(BLOCK_MINING_DIFFICULTY, '0');
        console.log('mining - ⛏️  ⛏️  ⛏️');
        while (true) {
            var hash = crypto.createHash('MD5');
            blockData.attempt = attempt;
            hash.update((nonce + attempt + blockData.toString()).toString()).end();
            var blockHash = hash.digest('hex');
            if (blockHash.substring(0, BLOCK_MINING_DIFFICULTY) === difficultyString) {
                console.log("Solved '".concat(blockHash, "' on ").concat(attempt, " attempt\n\n"));
                return blockHash;
            }
            attempt++;
        }
    };
    /**
     * Add a new block to the chain on valid signature & completing proof-of-work
     * @param transaction an instance of Transaction class
     * @param connectingNodePublicKey linking node's public key
     * @param signature digital signature using linking node's key pairs
     */
    Chain.prototype.addBlock = function (transaction, connectingNodePublicKey, signature) {
        var verifyTransaction = crypto.createVerify('SHA256').update(transaction.toString()), isValid = verifyTransaction.verify(connectingNodePublicKey, signature);
        if (isValid) {
            var newBlock = new Block(transaction.transactionData.name, transaction.transactionData.type, transaction.transactionData.uuid, transaction.transactionData.status, transaction.connectingNodePublicKey, transaction.networkNodePublicKey, 
            // transaction,
            this.previousBlock.hash, this.previousBlock.blockDepth + 1);
            newBlock.currentHash = this.mine(newBlock.nonce, newBlock);
            this.chain.push(newBlock);
            return newBlock;
        }
        else
            throw new Error('Invalid signature!');
    };
    Chain.prototype.toString = function () {
        return JSON.stringify(this.chain);
    };
    //* singleton instance
    Chain.instance = new Chain();
    return Chain;
}());
exports.Chain = Chain;
/**
 * Wallet gives a linking & receiving nodes a public-private key pair.
 * It acts as a digital address for the nodes.
 */
var Wallet = /** @class */ (function () {
    function Wallet(public_key, private_key) {
        if (public_key === void 0) { public_key = null; }
        if (private_key === void 0) { private_key = null; }
        var keyPair = crypto.generateKeyPairSync('rsa', {
            modulusLength: 2048,
            publicKeyEncoding: { type: 'spki', format: 'pem' },
            privateKeyEncoding: { type: 'pkcs8', format: 'pem' }
        });
        this.privateKey = private_key !== null && private_key !== void 0 ? private_key : keyPair.privateKey;
        this.publicKey = public_key !== null && public_key !== void 0 ? public_key : keyPair.publicKey;
    }
    Wallet.prototype.createORupdateLink = function (linkData, networkNodePublicKey) {
        //* throw error if linking to itself
        if (networkNodePublicKey == this.publicKey)
            throw new Error('Cannot link to self! Provided public key is of the same node.');
        var transaction = new Transaction(linkData, this.publicKey, networkNodePublicKey), signature = crypto.createSign('SHA256');
        signature.update(transaction.toString()).end();
        return Chain.instance.addBlock(transaction, this.publicKey, signature.sign(this.privateKey));
    };
    return Wallet;
}());
exports.Wallet = Wallet;
