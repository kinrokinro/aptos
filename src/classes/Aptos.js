import fetch from "cross-fetch"
import assert from "assert"
import Nacl from "tweetnacl"
import {hexAddress} from "./HexString.js";
import {sleep} from "../helpers/sleep.js";
import {Account} from "./Account.js";

const {sign} = Nacl

export const COINS_SENT = 'sent_events'
export const COINS_RECEIVED = 'received_events'
export const GALLERY_RETURN_DEFAULT = 'default'
export const GALLERY_RETURN_OBJECT = 'object'

export class Aptos {
    url = ""
    gas = {
        "max_gas_amount": "1000",
        "gas_unit_price": "1",
        "gas_currency_code": "XUS",
    }
    lastTransaction = null

    constructor(url = "", gas) {
        this.url = url
        this.setGasValue(gas)
    }

    _0x(a){
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

    /**
     * Set gas values
     * @param gas
     * gas = {
     *     "max_gas_amount",
     *     "gas_unit_price",
     *     "gas_currency_code",
     * }
     */
    setGasValue(gas){
        if (gas) {
            for(let key in gas) {
                if (this.gas.hasOwnProperty(key)) {
                    this.gas[key] = ""+gas[key]
                }
            }
        }
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

    /* ====================== Account ==================================== */

    async getAccount(addr){
        return await this.exec(`accounts/${this._0x(addr)}`)
    }

    async getAccountResources(addr, query = {version: null}){
        return await this.exec(`accounts/${this._0x(addr)}/resources`, query)
    }

    async getAccountResourcesObject(addr, query = {version: null}){
        const result = {}
        const resources = await this.exec(`accounts/${this._0x(addr)}/resources`, query)
        for(let r of resources) {
            result[r.type] = r.data
        }
        return result
    }

    async getAccountResource(addr, res = null, query = {version: null}){
        try {
            const resource = await this.exec(`accounts/${this._0x(addr)}/resource/${res}`, query)
            return res !== null && resource.data ? resource.data : null
        } catch (e) {
            return null
        }
    }

    async getAccountBalance(addr, coin = 'TestCoin', query = {version: null}){
        const res = await this.getAccountResource(addr, `0x1::${coin}::Balance`, query)
        return res ? res["coin"]["value"] : 0
    }

    async getAccountModules(addr, query = {version: null}){
        return await this.exec(`accounts/${this._0x(addr)}/modules`, query)
    }

    async getAccountModule(addr, module, query = {version: null}){
        return await this.exec(`accounts/${this._0x(addr)}/module/${module}`, query)
    }

    async getAccountEvents(addr, eventStruct, fieldName, query){
        return await this.exec(`accounts/${this._0x(addr)}/events/${eventStruct}/${fieldName}`, query)
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
        return await this.exec(`accounts/${this._0x(addr)}/transactions`, query)
    }

    async getAccountTransactionsLast(addr, limit = 25, coin = 'TestCoin'){
        const resources = await this.getAccountResource(addr, `0x1::${coin}::TransferEvents`)
        const totalSent = +(resources[COINS_SENT].counter || 0)
        const start = limit > totalSent ? 0 : totalSent - limit

        return await this.getAccountTransactions(addr, {limit, start})
    }

    /**
     * Rotate account auth key
     * @param {Account} account
     * @param {String} newAuthKey
     * @param gas
     * @returns {Promise<string|Event|*>}
     */
    async rotateAccountAuthKey(account, newAuthKey, gas = null){
        assert(newAuthKey, "Value for new auth key required!")

        const payload = {
            type: "script_function_payload",
            function: "0x1::Account::rotate_authentication_key",
            type_arguments: [],
            arguments: [
                newAuthKey,
            ]
        }

        await this.submitTransactionHelper(account, payload, gas)
        return this.lastTransaction.success
    }

    /* ======================== General =================================*/

    async getEvents(eventKey){
        return await this.exec(`events/${hexAddress(eventKey)}`)
    }

    async getTransactions(query = {limit: 25, start: 0}){
        return await this.exec(`transactions`)
    }

    async getTransaction(hash, query = {limit: 25, start: 0}){
        return await this.exec(`transactions/${hash}`)
    }

    /* ===================== Transaction routines =========================== */

    /**
     * Generates a transaction request that can be submitted to produce a raw transaction that
     *    can be signed, which upon being signed can be submitted to the blockchain
     * @param {String} sender
     * @param {Object} payload
     * @param {Integer} exp
     * @param {Object} gas
     * @returns {Promise<{sequence_number: string, gas_currency_code: string, sender: string, payload: {}, gas_unit_price: string, max_gas_amount: string, expiration_timestamp_secs: string}>}
     */
    async generateTransaction(sender = "", payload = {}, {max_gas_amount = 1000, gas_unit_price = 1, gas_currency_code = "XUS"} = {}, exp = 600){
        const account = await this.getAccount(sender)
        const seqNum = parseInt(account["sequence_number"])
        return {
            "sender": `${hexAddress(sender)}`,
            "sequence_number": ""+seqNum,
            "max_gas_amount": ""+max_gas_amount,
            "gas_unit_price": ""+gas_unit_price,
            "gas_currency_code": gas_currency_code,
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

    async submitTransactionHelper(account, payload, gas = null){
        const txnRequest = await this.generateTransaction(account.address(), payload, gas || this.gas)
        const signedTxn = await this.signTransaction(account, txnRequest)
        const res = await this.submitTransaction(signedTxn)
        await this.waitForTransaction(res["hash"])
        this.lastTransaction = await this.getTransaction(res["hash"])
        return res["hash"].toString()
    }

    getLastTransaction(){
        return this.lastTransaction
    }

    /* =============================== Coins =====================================*/

    /**
     * Transfer a given coin amount from a given Account to the recipient's account address.
     *    Returns the sequence number of the transaction used to transfer
     * @param {Account} accountFrom
     * @param {Account || String} recipient
     * @param {Number} amount
     * @param {String} coin
     * @param gas
     * @returns {Promise<boolean>}
     */
    async sendCoins(accountFrom, recipient, amount = 0, coin = 'TestCoin', gas){
        const payload = {
            type: "script_function_payload",
            function: `0x1::${coin}::transfer`,
            type_arguments: [],
            arguments: [
                this._0x(recipient),
                amount.toString()
            ]
        };
        await this.submitTransactionHelper(accountFrom, payload, gas)
        return this.lastTransaction.success
    }

    /**
     * Create a new account in blockchain
     * @param {Account} accountFrom
     * @param {Account} accountNew
     * @param gas
     * @returns {Promise<boolean>}
     */
    async createAccount(accountFrom, accountNew, gas){
        const payload = {
            "type": "script_function_payload",
            "function": "0x1::AptosAccount::create_account",
            "type_arguments": [],
            "arguments": [
                accountNew.address(),
                hexAddress(accountNew.pubKey()), // ???
            ]
        }
        await this.submitTransactionHelper(accountFrom, payload, gas)
        return this.lastTransaction.success
    }

    /**
     * Publish a new module to the blockchain within the specified account
     * @param accountFrom
     * @param moduleHex
     * @param gas
     * @returns {Promise<boolean>}
     */
    async publishModule(accountFrom, moduleHex = "", gas){
        const payload = {
            "type": "module_bundle_payload",
            "modules": [
                {"bytecode": `${hexAddress(moduleHex)}`},
            ],
        }
        await this.submitTransactionHelper(accountFrom, payload, gas)
        return this.lastTransaction.success
    }

    /* ===================================== NFT ====================================== */

    /**
     * Create Unlimited NFT collection
     * @param {Account} account
     * @param {String} description
     * @param {String} name
     * @param {String} uri
     * @param gas
     * @param {String} uri
     * @returns {Promise<boolean>}
     */
    async createUnlimitedCollection(account, description, name, uri, gas = null){
        const payload = {
            type: "script_function_payload",
            function: `0x1::Token::create_unlimited_collection_script`,
            type_arguments: [],
            arguments: [
                Buffer.from(description).toString("hex"),
                Buffer.from(name).toString("hex"),
                Buffer.from(uri).toString("hex"),
            ]
        }
        await this.submitTransactionHelper(account, payload, gas)
        return this.lastTransaction.success
    }

    /**
     * Create Limited NFT collection
     * @param {Account} account
     * @param {String} description
     * @param {String} name
     * @param {String} uri
     * @param {String} uri
     * @param {Integer} maximum
     * @param gas
     * @returns {Promise<boolean>}
     */
    async createCollection(account, description, name, uri, maximum, gas = null){
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
        }
        await this.submitTransactionHelper(account, payload, gas)
        return this.lastTransaction.success
    }

    /**
     * Create token in specified collection in quantity defined in supply parameter
     * @param {Account} account
     * @param {String} collectionName
     * @param {String} description
     * @param {String} name
     * @param {Number} supply
     * @param {String} uri
     * @param {Object} gas
     * @returns {Promise<boolean>}
     */
    async createToken(account, collectionName, description, name, supply, uri, gas = null){
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
        }
        await this.submitTransactionHelper(account, payload, gas)
        return this.lastTransaction.success
    }

    /**
     *
     * @param {Account} account
     * @param {String} receiver
     * @param {String} creator
     * @param {Number} tokenId
     * @param {Number} amount
     * @param gas
     * @returns {Promise<boolean>}
     */
    async offerToken(account, receiver, creator, tokenId, amount = 1, gas = null){
        const payload = {
            type: "script_function_payload",
            function: `0x1::TokenTransfers::offer_script`,
            type_arguments: [],
            arguments: [
                this._0x(receiver),
                this._0x(creator),
                tokenId.toString(),
                amount.toString()
            ]
        }
        await this.submitTransactionHelper(account, payload, gas)
        return this.lastTransaction.success
    }

    /**
     *
     * @param {Account} account
     * @param {String} sender
     * @param {String} creator
     * @param {Number} tokenId
     * @param gas
     * @returns {Promise<boolean>}
     */
    async claimToken(account, sender, creator, tokenId, gas = null){
        const payload = {
            type: "script_function_payload",
            function: `0x1::TokenTransfers::claim_script`,
            type_arguments: [],
            arguments: [
                this._0x(sender),
                this._0x(creator),
                tokenId.toString(),
            ]
        }
        await this.submitTransactionHelper(account, payload, gas)
        return this.lastTransaction.success
    }

    /**
     *
     * @param {Account} seller
     * @param {Account} buyer
     * @param {Object} id = {creator, tokenId}
     * @param {Number} amount
     * @param {Object} gas
     * @returns {Boolean}
     */
    async dealToken(seller, buyer, {creator, tokenId}, amount = 1, gas = null){
        try {
            const offer = await this.offerToken(seller, buyer.address(), creator, tokenId, amount)
            const claim = await this.claimToken(buyer, seller.address(), creator, tokenId)
            return offer && claim
        } catch (e) {
            return false
        }
    }

    /**
     *
     * @param {Account} account
     * @param {String} receiver
     * @param {String} creator
     * @param {Number} tokenId
     * @param gas
     * @returns {Promise<boolean>}
     */
    async cancelTokenOffer(account, receiver, creator, tokenId, gas = null){
        const payload = {
            type: "script_function_payload",
            function: `0x1::TokenTransfers::cancel_offer_script`,
            type_arguments: [],
            arguments: [
                this._0x(receiver),
                this._0x(creator),
                tokenId.toString(),
            ]
        }
        await this.submitTransactionHelper(account, payload, gas)
        return this.lastTransaction.success
    }

    /**
     * Get token ID, return token ID or -1
     * @param {String} creator
     * @param {String} collectionName
     * @param {String} tokenName
     * @returns {Promise<number>}
     */
    async getTokenId(creator, collectionName, tokenName){
        const tokens = await this.getTokens(creator, collectionName)

        if (tokens.length) {
            for (let token of tokens) {
                if (token["key"] === tokenName) {
                    return parseInt(token["value"]["id"]["creation_num"])
                }
            }
        }

        return -1
    }

    /**
     * Get token by token ID
     * @param {String} creator
     * @param {Integer} id
     * @returns {Promise<null|{}>}
     */
    async getTokenById(creator, id){
        const all = await this.getTokensAll(creator)
        for(let c in all) {
            if (!all[c].length) continue
            for(let t of all[c]) {
                if (parseInt(t.value.id.creation_num) === +id) {
                    t.collection = c
                    return t
                }
            }
        }
        return null
    }

    /**
     * Get collections
     * @param creator
     * @returns {Promise<*[]|*>}
     */
    async getCollections(creator){
        const resource = await this.getAccountResource(creator, "0x1::Token::Collections")

        if (!resource) {
            return []
        }

        return resource["collections"]["data"]
    }

    /**
     * Check if collection exists and return it if found, otherwise return false
     * @param creator
     * @param collectionName
     * @returns {Promise<boolean|*>}
     */
    async collectionExists(creator, collectionName){
        const resource = await this.getCollections(creator)
        if (resource) {
            for(let c of resource){
                if (c.key === collectionName) {
                    return c.value
                }
            }
        }
        return false
    }

    /**
     * Get collection by name, return collection array or null
     * @param creator
     * @param collectionName
     * @returns {Promise<[]|*>}
     */
    async getCollection(creator, collectionName){
        const collection = await this.collectionExists(creator, collectionName)
        return collection === false ? null : collection
    }

    /**
     * Get token from collection by token name or token creation num
     * @param creator
     * @param collectionName
     * @param token
     * @returns {Promise<null|*|any>}
     */
    async getTokenFromCollection(creator, collectionName, tokenId){
        let token = null
        const collection = await this.getCollection(creator, collectionName)
        if (!collection) {
            return token
        }
        for(let t of collection.tokens.data){
            if (isNaN(tokenId)) {
                // Token Name
                if (t.value.name === tokenId) {
                    token = t
                }
            } else {
                // Token id
                if (+(t.value.id.creation_num) === +(tokenId)) {
                    token = t
                }
            }
            if (token) token["collection"] = {
                name: collectionName,
                description: collection.description
            }
        }
        return token
    }

    /**
     * Get token from creator
     * @param {String} owner
     * @param {Object} tokenId = {addr, num}
     * @param {Boolean} checkCreator
     * @returns {Promise<null>}
     */
    async getTokenFromOwner(owner, {addr, num}, checkCreator = false){
        const collections = await this.getOwnedTokens(owner)
        let token = null
        for (let col of Object.values(collections)) {
            for(let tok of col.tokens) {
                if (checkCreator) {
                    if (!tok.isCreator) continue
                }
                const tokenNum = +(tok.value.id.creation_num)
                const tokenAddr = tok.value.id.addr

                if (tokenNum === +num && tokenAddr === addr) {
                    token = tok
                }
            }
        }
        return token
    }

    /**
     * Get token from creator
     * @param {String} creator
     * @param {Object} tokenId = {addr, num}
     * @returns {Promise<null>}
     */
    async getTokenFromCreator(creator, tokenId){
        return await this.getTokenFromOwner(creator, tokenId, true)
    }

    /**
     * Get Owned tokens in token structure with additional props (0x1::Token::Gallery and 0x1::Token::Collections)
     * @param owner
     * @returns {Promise<{}>}
     */
    async getOwnedTokens(owner){
        const gallery = await this.getGallery(owner)
        const collections = await this.getCollections(owner)
        const result = {}
        const temp = []

        for(let c of collections) {
            const _t = c.value
            result[`1::${_t.name}`] = {
                name: _t.name,
                description: _t.description,
                isOwner: true,
                uri: _t.uri,
                maximum: _t.maximum.vec.length ? +(_t.maximum.vec[0]) : 0,
                tokens: []
            }
        }

        for(let t of gallery) {
            const _t = t.value

            temp.push(`${_t.id.creation_num}::${_t.id.addr}`)
            const token = await this.getTokenFromCollection(_t.id.addr, _t.collection, _t.name)
            token.balance = _t.balance
            token.isCreator = _t.id.addr === owner

            if (!token.isCreator && !result[`0::${_t.collection}`]) {
                result[`0::${_t.collection}`] = {
                    name: "",
                    description: "",
                    isOwner: false,
                    uri: "",
                    maximum: -1,
                    tokens: []
                }
            }

            const collection = (token.isCreator ? "1::" : "0::") + _t.collection

            result[collection].name = token.collection.name
            result[collection].description = token.collection.description
            result[collection].tokens.push(token)
        }

        for(let c of collections) {
            const _t = c.value
            for (let t of _t.tokens.data) {
                if (!temp.includes(`${t.value.id.creation_num}::${t.value.id.addr}`)) {
                    result[`1::${_t.name}`].tokens.push({
                        ...t,
                        balance: 0,
                        isCreator: true,
                        collection: {
                            name: _t.name,
                            description: _t.description
                        }
                    })
                }
            }
        }

        for(let c in result) {
            result[c]["length"] = result[c]["tokens"].length
        }
        return result
    }

    /**
     * Get tokens from collection (used resource 0x1::Token::Collections)
     * @param creator
     * @param collectionName
     * @returns {Promise<*[]|*>}
     */
    async getTokens(creator, collectionName){
        const collection = await this.getCollection(creator, collectionName)
        if (collection === false) {
            return []
        }
        return collection["tokens"]["data"]
    }

    /**
     * Get All Tokens (used resource 0x1::Token::Collections)
     * @param creator
     * @returns {Promise<{}>}
     */
    async getTokensAll(creator){
        const collections = await this.getCollections(creator)
        let result = {}
        if (collections === false) {
            return result
        }
        for(let c of collections) {
            result[c.key] = await this.getTokens(creator, c.key)
        }
        return result
    }

    /**
     * Get token from collection, return token or false (used resource 0x1::Token::Collections)
     * @param address
     * @param collectionName
     * @param tokenName
     * @returns {Promise<boolean|*>}
     */
    async getToken(address, collectionName, tokenName){
        const tokens = await this.getTokens(address, collectionName)
        if (tokens.length) {
            for(let t of tokens) {
                if (t.key === tokenName) {
                    return t.value
                }
            }
        }
        return false
    }

    /**
     * Get Gallery, return array of elements
     * @param address
     * @param ret
     * @returns {Promise<*[]>}
     */
    async getGallery(address, ret = GALLERY_RETURN_DEFAULT){
        const resource = await this.getAccountResource(address, `0x1::Token::Gallery`)

        if (!resource) {
            return ret === GALLERY_RETURN_DEFAULT ? [] : {}
        }

        const data = resource["gallery"]["data"]
        if (ret === GALLERY_RETURN_DEFAULT) {
            return data
        }
        const tokens = {}
        for (let t of data) {
            tokens[`${t.key.creation_num}::${t.key.addr}`] = t.value
        }
        return tokens
    }

    /**
     * Get tokens who offered and wait claim
     * @param address
     * @returns {Promise<*|null>}
     */
    async getPendingClaims(address){
        const resource = await this.getAccountResource(address, `0x1::TokenTransfers::TokenTransfers`)
        return resource ? resource["pending_claims"]["data"] : null
    }
}