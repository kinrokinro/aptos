import {Account, Aptos} from "../../../src/index.js";
import {REST_URL} from "../../helpers/consts.js";

const rest = new Aptos(REST_URL)
const alice = Account.fromMnemonic("area field scatter industry apology control friend sail admit mask sell spread increase prepare virtual pulse pact hobby olympic uphold anger solid kick ship")
const bob = Account.fromMnemonic("present cage autumn crawl height giggle sorry fix inhale phrase wealth frequent myself protect quote sense stairs verify matrix manual spice silly annual field")

console.log("=== Account ===")
console.log("Alice address: ", alice.address())
console.log("Bob address: ", bob.address())

console.log("\n=== Get Gallery Alice ===")
console.log( await rest.getGallery(alice.address()) )

console.log("\n=== Get Gallery Bob ===")
console.log( await rest.getGallery(bob.address()) )

