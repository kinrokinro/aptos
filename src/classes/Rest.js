import fetch from "cross-fetch"
import assert from "assert"
import Nacl from "tweetnacl"
import {hexAddress} from "./HexString.js";
import {qunit} from "mocha/lib/interfaces/index.js";

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

    async getEvents(eventKey){
        return await this.exec(`events/${hexAddress(eventKey)}`)
    }

    // async getAccountTransactions(address, query = {
    //     limit: 25,
    //     start: 0
    // }){
    //
    // }
    //
    //

}