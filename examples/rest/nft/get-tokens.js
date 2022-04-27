import {Account, Aptos} from "../../../src/index.js";
import {REST_URL} from "../../helpers/consts.js";
import {log, logObject} from "../../helpers/log.js";

const aptos = new Aptos(REST_URL)
const alice = Account.fromMnemonic("area field scatter industry apology control friend sail admit mask sell spread increase prepare virtual pulse pact hobby olympic uphold anger solid kick ship")
const bob = Account.fromMnemonic("present cage autumn crawl height giggle sorry fix inhale phrase wealth frequent myself protect quote sense stairs verify matrix manual spice silly annual field")

log("=== Account ===")
log("Alice address: ", alice.address())
log("Bob address: ", bob.address())

log("\n=== Bob Tokens ===")
// logObject( await aptos.getTokenId(bob.address(), "Cars", "Taxi") )
logObject( await aptos.getTokenFromOwner(
    "0x69564cf6bdebf6a1c231f4d281e2658b6c2f02e5087589ee3e47334b56c3f669", "Cars", "Taxi")
)


