import {Account, Aptos} from "../../../src/index.js";
import {REST_URL} from "../../helpers/consts.js";

const aptos = new Aptos(REST_URL)
const alice = Account.fromMnemonic("area field scatter industry apology control friend sail admit mask sell spread increase prepare virtual pulse pact hobby olympic uphold anger solid kick ship")
const bob = Account.fromMnemonic("present cage autumn crawl height giggle sorry fix inhale phrase wealth frequent myself protect quote sense stairs verify matrix manual spice silly annual field")

console.log("=== Account ===")
console.log("Alice address: ", alice.address())
console.log("Bob address: ", bob.address())

// console.log("Alice's tokens")
// console.log(JSON.stringify(await aptos.getTokenFromCreator(alice.address(), "Taxi"), null, 4))
const [num, addr] = `3::0x6a564403b90e83e0ecd9ec59446e4eed644a71fdd50441dacdf21fc03c265347`.split("::")
console.log("Bob's tokens")
console.log(JSON.stringify(await aptos.getTokenFromOwner(bob.address(), {addr, num}), null, 4))
