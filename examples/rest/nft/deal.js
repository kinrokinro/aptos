import {Account, Aptos} from "../../../src/index.js";
import {REST_URL} from "../../helpers/consts.js";
import {logObject} from "../../helpers/log.js";

const aptos = new Aptos(REST_URL)
const alice = Account.fromMnemonic("area field scatter industry apology control friend sail admit mask sell spread increase prepare virtual pulse pact hobby olympic uphold anger solid kick ship")
const bob = Account.fromMnemonic("present cage autumn crawl height giggle sorry fix inhale phrase wealth frequent myself protect quote sense stairs verify matrix manual spice silly annual field")

console.log("=== Account ===")
console.log("Alice address: ", alice.address())
console.log("Bob address: ", bob.address())

const creator = alice.address()
const tokenId = 3
const count = 1

await aptos.dealToken(alice, bob, {creator, tokenId}, count)