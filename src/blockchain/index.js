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
exports.__esModule = true;
exports.Wallet = exports.Chain = void 0;
var crypto = require("crypto");
var BLOCK_MINING_DIFFICULTY = 0;
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
    function Block(transaction, precedingBlockHash, blockDepth, currentHash, attempt, transactionDate) {
        if (currentHash === void 0) { currentHash = ''; }
        if (attempt === void 0) { attempt = 0; }
        if (transactionDate === void 0) { transactionDate = new Date(); }
        this.transaction = transaction;
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
        this.chain = [
            //* genesis block generation
            (function () {
                var hash = crypto.createHash('MD5'), genesisBlock = new Block(new Transaction({ name: 'genesis', status: "Active", type: "genesis_block", uuid: "genesis_uuid" }, 'connecting_genesis_node_public_key_null', 'network_genesis_node_public_key_null'), 'preceding_genesis_block_hash_null', 0, 'current_genesis_block_hash_null');
                hash.update(genesisBlock.toString()).end();
                genesisBlock.currentHash = hash.digest('hex');
                return genesisBlock;
            })()
        ];
    }
    Object.defineProperty(Chain.prototype, "previousBlock", {
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
            var newBlock = new Block(transaction, this.previousBlock.hash, this.previousBlock.blockDepth + 1);
            newBlock.currentHash = this.mine(newBlock.nonce, newBlock);
            this.chain.push(newBlock);
        }
    };
    Chain.prototype.toString = function () {
        return JSON.stringify(this);
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
    function Wallet(private_key, public_key) {
        if (private_key === void 0) { private_key = null; }
        if (public_key === void 0) { public_key = null; }
        var keyPair = crypto.generateKeyPairSync('rsa', {
            modulusLength: 2048,
            publicKeyEncoding: { type: 'spki', format: 'pem' },
            privateKeyEncoding: { type: 'pkcs8', format: 'pem' }
        });
        this.privateKey = private_key !== null && private_key !== void 0 ? private_key : keyPair.privateKey;
        this.publicKey = public_key !== null && public_key !== void 0 ? public_key : keyPair.publicKey;
    }
    Wallet.prototype.createORupdateLink = function (linkData, networkNodePublicKey) {
        // throw error if linking to itself
        if (networkNodePublicKey == this.publicKey)
            throw new Error('Cannot link to self');
        var transaction = new Transaction(linkData, this.publicKey, networkNodePublicKey), signature = crypto.createSign('SHA256');
        signature.update(transaction.toString()).end();
        Chain.instance.addBlock(transaction, this.publicKey, signature.sign(this.privateKey));
    };
    return Wallet;
}());
exports.Wallet = Wallet;
