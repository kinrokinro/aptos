import fetch from "cross-fetch"
import assert from "assert"
import Nacl from "tweetnacl"
import {hexAddress} from "./HexString.js";
import {sleep} from "../helpers/sleep.js";
import {Account} from "./Account.js";

const {sign} = Nacl

export const COINS_SENT = 'sent_events'
export const COINS_RECEIVED = 'received_events'

export class RestClient {
    url = ""

    constructor(url = "") {
        this.url = url
    }

    async exec(link, query = null, options = {method: "GET"}){
        let queryArray = []
        if (query && typeof query === "object") {
            for (let key in query) {
                if (query[key] !== null) queryArray.push(`${key}=${query[key]}`)
            }
            link += `?${queryArray.join("&")}`
        }
        const response = await fetch(`${this.url}/${link}`, options)
        if (response.status !== 200) {
            assert(response.status === 200, await response.text())
        }
        return await response.json()
    }

    async getHealthy(){
        const response = await fetch(`${this.url}/-/healthy`, {method: "GET"})
        if (response.status !== 200) {
            assert(response.status === 200, await response.text())
        }
        return await response.text()
    }

    async getLedger(){
        return await this.exec(``)
    }

    async getAccount(addr){
        return await this.exec(`accounts/${this.address(addr)}`)
    }

    async getAccountResources(addr, query = {version: null}){
        return await this.exec(`accounts/${this.address(addr)}/resources`, query)
    }

    async getAccountResourcesObject(addr, query = {version: null}){
        const result = {}
        const resources = await this.exec(`accounts/${this.address(addr)}/resources`, query)
        for(let r of resources) {
            result[r.type] = r.data
        }
        return result
    }

    async getAccountResource(addr, res = null, query = {version: null}){
        const resources = await this.getAccountResourcesObject(this.address(addr), query)
        return res !== null && resources[res] ? resources[res] : null
    }

    async getAccountBalance(add, coin = 'TestCoin', query = {version: null}){
        const res = await this.getAccountResource(add, `0x1::${coin}::Balance`, query)
        return res ? res["coin"]["value"] : 0
    }

    async getAccountModules(addr, query = {version: null}){
        return await this.exec(`accounts/${this.address(addr)}/modules`, query)
    }

    async getAccountEvents(addr, eventStruct, fieldName, query){
        return await this.exec(`accounts/${this.address(addr)}/events/${eventStruct}/${fieldName}`, query)
    }

    async getAccountEventsCoins(address, type = COINS_SENT, coin = "TestCoin", query = {limit: 25, start: 0}){
        return await this.getAccountEvents(address, `0x1::${coin}::TransferEvents`, type, query)
    }

    async getAccountEventsSentCoins(address = "", coin = "TestCoin", query = {limit: 25, start: 0}){
        return await this.getAccountEventsCoins(address, COINS_SENT, coin, query)
    }

    async getAccountEventsReceivedCoins(address = "", coin = "TestCoin", query = {limit: 25, start: 0}){
        return await this.getAccountEventsCoins(address, COINS_RECEIVED,coin, query)
    }

    async getAccountEventsCoinsLast(address, type = COINS_SENT, limit = 25, coin = 'TestCoin'){
        const resources = await this.getAccountResource(address, `0x1::${coin}::TransferEvents`)
        const totalSent = +(resources[type].counter || 0)
        const start = limit > totalSent ? 0 : totalSent - limit

        return await this.getAccountEventsCoins(address, type, coin, {limit, start})
    }

    async getAccountEventsSentCoinsLast(address, limit = 25, coin = 'TestCoin'){
        return await this.getAccountEventsCoinsLast(address, COINS_SENT, limit, coin)
    }

    async getAccountEventsReceivedCoinsLast(address, limit = 25, coin = 'TestCoin'){
        return await this.getAccountEventsCoinsLast(address, COINS_RECEIVED, limit, coin)
    }

    async getAccountTransactions(addr, query = {limit: 25, start: 0}){
        return await this.exec(`accounts/${this.address(addr)}/transactions`, query)
    }

    async getAccountTransactionsLast(addr, limit = 25, coin = 'TestCoin'){
        const resources = await this.getAccountResource(addr, `0x1::${coin}::TransferEvents`)
        const totalSent = +(resources[COINS_SENT].counter || 0)
        const start = limit > totalSent ? 0 : totalSent - limit

        return await this.getAccountTransactions(addr, {limit, start})
    }

    async getEvents(eventKey){
        return await this.exec(`events/${hexAddress(eventKey)}`)
    }

    async getTransactions(query = {limit: 25, start: 0}){
        return await this.exec(`transactions`)
    }

    /**
     * Generates a transaction request that can be submitted to produce a raw transaction that
     *    can be signed, which upon being signed can be submitted to the blockchain
     * @param {String} sender
     * @param {Object} payload
     * @param {Integer} exp
     * @param {Object} gas
     * @returns {Promise<{sequence_number: string, gas_currency_code: string, sender: string, payload: {}, gas_unit_price: string, max_gas_amount: string, expiration_timestamp_secs: string}>}
     */
    async generateTransaction(sender = "", payload = {}, exp = 600, gas = {max: 1000, unitPrice: 1, currency: "XUS"}){
        const account = await this.getAccount(sender)
        const seqNum = parseInt(account["sequence_number"])
        return {
            "sender": `${hexAddress(sender)}`,
            "sequence_number": seqNum.toString(),
            "max_gas_amount": gas.max.toString(),
            "gas_unit_price": gas.unitPrice.toString(),
            "gas_currency_code": gas.currency,
            "expiration_timestamp_secs": (Math.floor(Date.now() / 1000) + exp).toString(), // Unix timestamp, in seconds + 10 minutes ???
            "payload": payload,
        }
    }

    /**
     * Converts a transaction request produced by `generate_transaction` into a properly signed
     *    transaction, which can then be submitted to the blockchain
     * @param {Account} accountFrom
     * @param {Object} txnRequest
     * @returns {Promise<{}>}
     */
    async signTransaction(/* Account */ accountFrom, txnRequest = {}){
        const response = await fetch(`${this.url}/transactions/signing_message`, {
            method: "POST",
            headers: {"Content-Type": "application/json"},
            body: JSON.stringify(txnRequest)
        })
        if (response.status !== 200) {
            assert(response.status === 200, (await response.text()) + " - " + JSON.stringify(txnRequest))
        }
        const result = await response.json()
        const toSign = Buffer.from(result["message"].substring(2), "hex")
        const signature = sign(toSign, accountFrom.signingKey.secretKey)
        const signatureHex = Buffer.from(signature).toString("hex").slice(0, 128)
        txnRequest["signature"] = {
            "type": "ed25519_signature",
            "public_key": `${hexAddress(accountFrom.pubKey())}`,
            "signature": `${hexAddress(signatureHex)}`,
        }
        return txnRequest
    }

    /**
     * Submits a signed transaction to the blockchain
     * @param {Object} txnRequest
     * @returns {Promise<unknown>}
     */
    async submitTransaction(txnRequest = {}){
        const response = await fetch(`${this.url}/transactions`, {
            method: "POST",
            headers: {"Content-Type": "application/json"},
            body: JSON.stringify(txnRequest)
        })
        if (response.status !== 202) {
            assert(response.status === 202, (await response.text()) + " - " + JSON.stringify(txnRequest))
        }
        return await response.json()
    }

    /**
     *
     * @param txnHash
     * @returns {Promise<boolean>}
     */
    async transactionPending(txnHash){
        const response = await fetch(`${this.url}/transactions/${txnHash}`, {method: "GET"})
        if (response.status === 404) {
            return true
        }
        if (response.status !== 200) {
            assert(response.status === 200, await response.text())
        }
        return (await response.json())["type"] === "pending_transaction"
    }

    /**
     * Waits up to 10 seconds for a transaction to move past pending state
     * @param txnHash
     * @returns {Promise<void>}
     */
    async waitForTransaction(txnHash) {
        let count = 0
        while (await this.transactionPending(txnHash)) {
            assert(count < 10)
            await sleep(1000)
            count += 1
            if (count >= 10) {
                throw new Error(`Waiting for transaction ${txnHash} timed out!`)
            }
        }
    }

    async submitTransactionHelper(account, payload){
        const txnRequest = await this.generateTransaction(account.address(), payload)
        const signedTxn = await this.signTransaction(account, txnRequest)
        const res = await this.submitTransaction(signedTxn)
        await this.waitForTransaction(res["hash"])
        return res["hash"].toString()
    }

    /**
     * Transfer a given coin amount from a given Account to the recipient's account address.
     *    Returns the sequence number of the transaction used to transfer
     * @param {Account} accountFrom
     * @param {Account || String} recipient
     * @param {Number} amount
     * @param {String} coin
     * @returns {Promise<string>}
     */
    async sendCoins(accountFrom, recipient, amount = 0, coin = 'TestCoin'){
        const payload = {
            type: "script_function_payload",
            function: `0x1::${coin}::transfer`,
            type_arguments: [],
            arguments: [
                this.address(recipient),
                amount.toString(),
            ]
        };
        return await this.submitTransactionHelper(accountFrom, payload)
    }

    /**
     * Create a new account in blockchain
     * @param {Account} accountFrom
     * @param {Account} accountNew
     * @returns {Promise<string>}
     */
    async createAccount(accountFrom, accountNew){
        const payload = {
            "type": "script_function_payload",
            "function": "0x1::AptosAccount::create_account",
            "type_arguments": [],
            "arguments": [
                accountNew.address(),
                hexAddress(accountNew.pubKey()), // ???
            ]
        }
        return await this.submitTransactionHelper(accountFrom, payload)
    }

    /**
     * Publish a new module to the blockchain within the specified account
     * @param accountFrom
     * @param moduleHex
     * @returns {Promise<string>}
     */
    async publishModule(accountFrom, moduleHex = ""){
        const payload = {
            "type": "module_bundle_payload",
            "modules": [
                {"bytecode": `${hexAddress(moduleHex)}`},
            ],
        }
        return await this.submitTransactionHelper(accountFrom, payload)
    }

    address(a){
        if (a instanceof Account) {
            return a.address()
        } else if (typeof a === "string") {
            return hexAddress(a)
        } else if (typeof a === "object" && a.address) {
            return hexAddress(a.address)
        } else {
            throw new Error("Value is not an Aptos address or compatible object!")
        }
    }

    /* ===================================== NFT ====================================== */

    /**
     * Create Unlimited NFT collection
     * @param {Account} account
     * @param {String} description
     * @param {String} name
     * @param {String} uri
     * @param {String} uri
     * @returns {Promise<*>}
     */
    async createUnlimitedCollection(account, description, name, uri){
        const payload = {
            type: "script_function_payload",
            function: `0x1::Token::create_unlimited_collection_script`,
            type_arguments: [],
            arguments: [
                Buffer.from(description).toString("hex"),
                Buffer.from(name).toString("hex"),
                Buffer.from(uri).toString("hex"),
            ]
        };
        return await this.submitTransactionHelper(account, payload)
    }

    /**
     * Create Limited NFT collection
     * @param {Account} account
     * @param {String} description
     * @param {String} name
     * @param {String} uri
     * @param {String} uri
     * @param {Integer} maximum
     * @returns {Promise<*>}
     */
    async createCollection(account, description, name, uri, maximum){
        const payload = {
            type: "script_function_payload",
            function: `0x1::Token::create_finite_collection_script`,
            type_arguments: [],
            arguments: [
                Buffer.from(description).toString("hex"),
                Buffer.from(name).toString("hex"),
                Buffer.from(uri).toString("hex"),
                maximum.toString()
            ]
        };
        return await this.submitTransactionHelper(account, payload)
    }

    /**
     * Create token in specified collection in quantity defined in supply parameter
     * @param {Account} account
     * @param {String} collectionName
     * @param {String} description
     * @param {String} name
     * @param {Number} supply
     * @param {String} uri
     * @returns {Promise<*>}
     */
    async createToken(account, collectionName, description, name, supply, uri){
        const payload = {
            type: "script_function_payload",
            function: `0x1::Token::create_token_script`,
            type_arguments: [],
            arguments: [
                Buffer.from(collectionName).toString("hex"),
                Buffer.from(description).toString("hex"),
                Buffer.from(name).toString("hex"),
                supply.toString(),
                Buffer.from(uri).toString("hex")
            ]
        };
        return await this.submitTransactionHelper(account, payload)
    }

    /**
     *
     * @param {Account} account
     * @param {String} receiver
     * @param {String} creator
     * @param {Number} tokenId
     * @param {Number} amount
     * @returns {Promise<*>}
     */
    async offerToken(account, receiver, creator, tokenId, amount){
        const payload = {
            type: "script_function_payload",
            function: `0x1::TokenTransfers::offer_script`,
            type_arguments: [],
            arguments: [
                this.address(receiver),
                this.address(creator),
                tokenId.toString(),
                amount.toString()
            ]
        };
        return await this.submitTransactionHelper(account, payload)
    }

    /**
     *
     * @param {Account} account
     * @param {String} sender
     * @param {String} creator
     * @param {Number} tokenId
     * @returns {Promise<*>}
     */
    async claimToken(account, sender, creator, tokenId){
        const payload = {
            type: "script_function_payload",
            function: `0x1::TokenTransfers::claim_script`,
            type_arguments: [],
            arguments: [
                this.address(sender),
                this.address(creator),
                tokenId.toString(),
            ]
        };
        return await this.submitTransactionHelper(account, payload)
    }

    /**
     *
     * @param {Account} account
     * @param {String} receiver
     * @param {String} creator
     * @param {Number} tokenId
     * @returns {Promise<*>}
     */
    async cancelTokenOffer(account, receiver, creator, tokenId){
        const payload = {
            type: "script_function_payload",
            function: `0x1::TokenTransfers::cancel_offer_script`,
            type_arguments: [],
            arguments: [
                this.address(receiver),
                this.address(creator),
                tokenId.toString(),
            ]
        };
        return await this.submitTransactionHelper(account, payload)
    }

    /**
     *
     * @param {String} creator
     * @param {String} collectionName
     * @param {String} tokenName
     * @returns {Promise<number>}
     */
    async getTokenId(creator, collectionName, tokenName){
        const resources = this.getAccountResourcesObject(creator)
        let collections = []
        let tokens = []

        if (resources["0x1::Token::Collections"]) {
            collections = resources["0x1::Token::Collections"]["collections"]["data"]
        }

        for (let collection in collections) {
            if (collections[collection]["key"] === collectionName) {
                tokens = collections[collection]["value"]["tokens"]["data"];
            }
        }
        for (let token in tokens) {
            if (tokens[token]["key"] === tokenName) {
                return parseInt(tokens[token]["value"]["id"]["creation_num"]);
            }
        }
        assert(false, "No token IDs for your request!");
    }
}