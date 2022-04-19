import {Account, RestClient} from "../../../src/index.js";
import {REST_URL} from "../../helpers/consts.js";

const rest = new RestClient(REST_URL)
const alice = Account.fromMnemonic("area field scatter industry apology control friend sail admit mask sell spread increase prepare virtual pulse pact hobby olympic uphold anger solid kick ship")
const bob = Account.fromMnemonic("present cage autumn crawl height giggle sorry fix inhale phrase wealth frequent myself protect quote sense stairs verify matrix manual spice silly annual field")

console.log("=== Account ===")
console.log("Alice address: ", alice.address())
console.log("Bob address: ", bob.address())

console.log("\n=== Alice Collections ===")
console.log( await rest.getCollections(alice.address()) )

console.log("\n=== Bob Collections ===")
console.log( await rest.getCollections(bob.address()) )

