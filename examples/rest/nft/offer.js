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


const token_id = await rest.getTokenId(alice.address(), collectionName, tokenName)
console.log(`Alice's token's identifier: ${token_id}`)
console.log(`See ${rest.url}/accounts/${alice.address()}/resources`)

console.log("\n=== Transferring the token to Bob ===")
await rest.offerToken(alice, bob.address(), alice.address(), token_id, 1);
await rest.claimToken(bob, alice.address(), alice.address(), token_id);

console.log(`See ${rest.url}/accounts/${bob.address()}/resources`);