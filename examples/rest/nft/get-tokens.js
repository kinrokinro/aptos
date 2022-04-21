import {Account, RestClient} from "../../../src/index.js";
import {REST_URL} from "../../helpers/consts.js";
import {log, logObject} from "../../helpers/log.js";

const rest = new RestClient(REST_URL)
const alice = Account.fromMnemonic("area field scatter industry apology control friend sail admit mask sell spread increase prepare virtual pulse pact hobby olympic uphold anger solid kick ship")

log("=== Account ===")
log("Alice address: ", alice.address())

log("\n=== Alice Tokens ===")
logObject( await rest.getTokensAll(alice.address()) )


