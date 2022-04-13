import {Account, RestClient} from "../../../src/index.js";
import {REST_URL} from "../../helpers/consts.js";

const rest = new RestClient(REST_URL)
const alice = Account.fromMnemonic("area field scatter industry apology control friend sail admit mask sell spread increase prepare virtual pulse pact hobby olympic uphold anger solid kick ship")
const bob = Account.fromMnemonic("present cage autumn crawl height giggle sorry fix inhale phrase wealth frequent myself protect quote sense stairs verify matrix manual spice silly annual field")

console.log("=== Account ===")
console.log("Alice address: ", alice.address())
console.log("Bob address: ", bob.address())

const collectionName = "TestCollection"
const tokenName = "FirstToken"

console.log("\n=== Get Collection ===")
const collection = await rest.getCollection(alice.address(), collectionName)
console.log(JSON.stringify(collection, null, 4))

console.log("\n=== Get Tokens ===")
const tokens = await rest.getTokens(alice.address(), collectionName)
console.log(JSON.stringify(tokens, null, 4))

console.log("\n=== Get Token ===")
const token = await rest.getToken(alice.address(), collectionName, tokenName)
console.log(JSON.stringify(token, null, 4))

console.log("\n=== Get Token ID ===")
const tokenId = await rest.getTokenId(alice.address(), collectionName, tokenName)
console.log(JSON.stringify(tokenId, null, 4))

console.log("\n=== Available Tokens ===")
const available = await rest.availableTokens(alice.address())
console.log(JSON.stringify(available, null, 4))

console.log("\n=== Pending Claimed Tokens ===")
const pending = await rest.getPendingClaims(alice.address())
console.log(JSON.stringify(pending, null, 4))
