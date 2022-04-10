import fetch from "cross-fetch"
import assert from "assert"
import Nacl from "tweetnacl"
import {hexAddress} from "./HexString.js";
import {sleep} from "../helpers/sleep.js";

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

    async getAccount(address){
        return await this.exec(`accounts/${hexAddress(address)}`)
    }

    async getAccountResources(address, query = {version: null}){
        return await this.exec(`accounts/${address}/resources`, query)
    }

    async getAccountResourcesObject(address, query = {version: null}){
        const result = {}
        const resources = await this.exec(`accounts/${address}/resources`, query)
        for(let r of resources) {
            result[r.type] = r.data
        }
        return result
    }

    async getAccountResource(address, res = null, query = {version: null}){
        const resources = await this.getAccountResourcesObject(address, query)
        return res !== null && resources[res] ? resources[res] : null
    }

    async getAccountBalance(address, coin = 'TestCoin', query = {version: null}){
        const res = await this.getAccountResource(address, `0x1::${coin}::Balance`, query)
        return res ? res["coin"]["value"] : 0
    }

    async getAccountModules(address, query = {version: null}){
        return await this.exec(`accounts/${address}/modules`, query)
    }

    async getAccountEvents(address, eventStruct, fieldName, query){
        return await this.exec(`accounts/${address}/events/${eventStruct}/${fieldName}`, query)
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

    async accountTransactions(accountAddress, limit = 25, start = 0){
        const response = await fetch(`${this.url}/accounts/${accountAddress}/transactions?limit=${limit}&start=${start}`, {method: "GET"})
        if (response.status !== 200) {
            assert(response.status === 200, await response.text())
        }
        return await response.json()
    }

    async getAccountTransactions(address, query = {limit: 25, start: 0}){
        return await this.exec(`accounts/${address}/transactions`, query)
    }

    async getAccountTransactionsLast(address, limit = 25, coin = 'TestCoin'){
        const resources = await this.getAccountResource(address, `0x1::${coin}::TransferEvents`)
        const totalSent = +(resources[COINS_SENT].counter || 0)
        const start = limit > totalSent ? 0 : totalSent - limit

        return await this.exec(`accounts/${address}/transactions`, {limit, start})
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
     * @returns {Promise<{sequence_number: string, gas_currency_code: string, sender: string, payload: {}, gas_unit_price: string, max_gas_amount: string, expiration_timestamp_secs: string}>}
     */
    async generateTransaction(sender = "", payload = {}, exp = 600){
        const account = await this.getAccount(sender)
        const seqNum = parseInt(account["sequence_number"])
        return {
            "sender": `0x${sender}`,
            "sequence_number": seqNum.toString(),
            "max_gas_amount": "1000",
            "gas_unit_price": "1",
            "gas_currency_code": "XUS",
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
            "public_key": `0x${accountFrom.pubKey()}`,
            "signature": `0x${signatureHex}`,
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
     * @param {string} recipient
     * @param {number} amount
     * @returns {Promise<string>}
     */
    async sendCoins(accountFrom, recipient = "", amount = 0){
        const payload = {
            type: "script_function_payload",
            function: "0x1::TestCoin::transfer",
            type_arguments: [],
            arguments: [
                `0x${recipient}`,
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
     * @param accountFrom
     * @param accountNew
     * @returns {Promise<string>}
     */
    async createAccount(accountFrom, accountNew){
        const payload = {
            "type": "script_function_payload",
            "function": "0x1::AptosAccount::create_account",
            "type_arguments": [],
            "arguments": [
                "0x" + accountNew.address(),
                "0x" + accountNew.pubKey(), // ???
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
                {"bytecode": `0x${moduleHex}`},
            ],
        }
        const txnRequest = await this.generateTransaction(accountFrom.address(), payload)
        const signedTxn = await this.signTransaction(accountFrom, txnRequest)
        const res = await this.submitTransaction(signedTxn)
        return res["hash"].toString()
    }

    /**
     * Retrieve the resource Message
     * @param contractAddress
     * @param accountAddress
     * @returns {Promise<*>}
     */
    async getMessage(contractAddress, accountAddress){
        const resource = await this.getAccountResource(accountAddress, `0x${contractAddress}::Message::MessageHolder`);
        return resource["data"]["message"]
    }

    /**
     * Potentially initialize and set the resource Message
     * @returns {Promise<string>}
     * @param contractAddress
     * @param accountFrom
     * @param message
     */
    async setMessage(contractAddress, accountFrom, message){
        let payload = {
            "type": "script_function_payload",
            "function": `0x${contractAddress}::Message::set_message`,
            "type_arguments": [],
            "arguments": [
                Buffer.from(message, "utf-8").toString("hex")
            ]
        };

        const txnRequest = await this.generateTransaction(accountFrom.address(), payload)
        const signedTxn = await this.signTransaction(accountFrom, txnRequest)
        const res = await this.submitTransaction(signedTxn)
        return res["hash"].toString()
    }
}