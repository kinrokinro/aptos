import {Account, Aptos} from "../../../src/index.js";
import {REST_URL} from "../../helpers/consts.js";
import {logObject} from "../../helpers/log.js";

const rest = new Aptos(REST_URL)
const alice = Account.fromMnemonic("area field scatter industry apology control friend sail admit mask sell spread increase prepare virtual pulse pact hobby olympic uphold anger solid kick ship")
const bob = Account.fromMnemonic("present cage autumn crawl height giggle sorry fix inhale phrase wealth frequent myself protect quote sense stairs verify matrix manual spice silly annual field")

console.log("=== Account ===")
console.log("Alice address: ", alice.address())
console.log("Bob address: ", bob.address())

// const collectionName = "Third Collection"
// const collectionDesc = "Alice's simple collection"
const tokenName = "First Token"
const tokenDesc = "Create token example"
//
// console.log("\n=== Creating Collection and Token ===")
// // await rest.createUnlimitedCollection(alice, collectionDesc, collectionName, "https://pimenov.com.ua")
const result = await rest.createToken(
    bob,
    "Cars",
    tokenDesc,
    tokenName,
    1,
    "https://aptos.dev/img/nyan.jpeg",
    {
        max_gas_amount: 2000
    }
)
// console.log(`See ${rest.url}/accounts/${alice.address()}/resources`)
// console.log(`See ${rest.url}/transactions/${rest.getLastTransaction().hash}`)


const token_id = await rest.getTokenId(bob.address(), "Cars", "First Token")
console.log(`Bob's token's identifier: ${token_id}`)

// console.log("\n=== Transferring the token to Bob ===")
// await rest.offerToken(alice, bob.address(), alice.address(), token_id, 2);
// logObject(rest.lastTransaction)
// await rest.claimToken(bob, alice.address(), alice.address(), token_id);
// logObject(rest.lastTransaction)
//
// console.log(`See ${rest.url}/accounts/${alice.address()}/resources`)
// console.log(`See ${rest.url}/accounts/${bob.address()}/resources`);