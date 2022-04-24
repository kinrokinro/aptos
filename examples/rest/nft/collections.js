import {Account, Aptos} from "../../../src/index.js";
import {REST_URL} from "../../helpers/consts.js";
import {log, logObject} from "../../helpers/log.js";

const rest = new Aptos(REST_URL)
const alice = Account.fromMnemonic("area field scatter industry apology control friend sail admit mask sell spread increase prepare virtual pulse pact hobby olympic uphold anger solid kick ship")
const bob = Account.fromMnemonic("present cage autumn crawl height giggle sorry fix inhale phrase wealth frequent myself protect quote sense stairs verify matrix manual spice silly annual field")

log("=== Account ===")
log("Alice address: ", alice.address())
log("Bob address: ", bob.address())

log("\n=== Alice Collections ===")
logObject( await rest.getCollections(alice.address()) )

log("\n=== Bob Collections ===")
logObject( await rest.getCollections(bob.address()) )

