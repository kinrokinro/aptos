import {COINS_RECEIVED, RestClient} from "../../src/index.js";
import {REST_URL} from "../helpers/consts.js";
import {COINS_SENT} from "../../src/index.js";

const rest = new RestClient(REST_URL)
const address = "6a564403b90e83e0ecd9ec59446e4eed644a71fdd50441dacdf21fc03c265347"
const hexAddress = "0x6a564403b90e83e0ecd9ec59446e4eed644a71fdd50441dacdf21fc03c265347"

// console.log("=== Account ===")
// console.log(await rest.getAccount(address))
// console.log(await rest.getAccount(hexAddress))
//
// console.log("=== Resources ===")
// console.log(await rest.getAccountResources(address))
// console.log(await rest.getAccountResourcesObject(address))

// console.log("=== Balance ===")
// console.log(await rest.getAccountBalance(address))
// console.log(await rest.getAccountBalance(address, 'bitcoin'))

// console.log("=== Modules ===")
// console.log(await rest.getAccountModules(address))

// console.log("=== Events ===")
// console.log(await rest.getEvents("0x01000000000000006a564403b90e83e0ecd9ec59446e4eed644a71fdd50441dacdf21fc03c265347"))

// console.log("=== Coins ===")
// console.log(await rest.getAccountEventsCoins(address, COINS_SENT, undefined, {limit: 1}))
// console.log(await rest.getAccountEventsCoins(address, COINS_RECEIVED, undefined, {limit: 1}))
// console.log(await rest.getAccountEventsSentCoins(address, undefined, {limit: 1}))
// console.log(await rest.getAccountEventsReceivedCoins(address, undefined, {limit: 1}))
// console.log(await rest.getAccountEventsCoinsLast(address, COINS_SENT, 2))
// console.log(await rest.getAccountEventsCoinsLast(address, COINS_RECEIVED, 2))
// console.log(await rest.getAccountEventsSentCoinsLast(address, 10))
// console.log(await rest.getAccountEventsReceivedCoinsLast(address, 1))


// console.log("=== Transactions ===")
// console.log(await rest.getAccountTransactions(address, {limit: 1}))
const tr = await rest.getAccountTransactionsLast(address, 25)
for(let t of tr.reverse()) {
    console.log(JSON.stringify(t, null, 4))
}

