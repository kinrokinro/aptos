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
        const txnRequest = await this.generateTransaction(accountFrom.address(), payload)
        const signedTxn = await this.signTransaction(accountFrom, txnRequest)
        const res = await this.submitTransaction(signedTxn)
        return res["hash"].toString()
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
        const txnRequest = await this.generateTransaction(accountFrom.address(), payload)
        const signedTxn = await this.signTransaction(accountFrom, txnRequest)
        const res = await this.submitTransaction(signedTxn)
        return res["hash"].toString()
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
        const txnRequest = await this.generateTransaction(accountFrom.address(), payload)
        const signedTxn = await this.signTransaction(accountFrom, txnRequest)
        const res = await this.submitTransaction(signedTxn)
        return res["hash"].toString()
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
}