import {Account, Aptos} from "../../../src/index.js";
import {REST_URL} from "../../helpers/consts.js";

const aptos = new Aptos(REST_URL)
const alice = Account.fromMnemonic("area field scatter industry apology control friend sail admit mask sell spread increase prepare virtual pulse pact hobby olympic uphold anger solid kick ship")

console.log("=== Account ===")
console.log("Alice address: ", alice.address())

const token = await aptos.getTokenById(alice.address(), 2)
console.log(JSON.stringify(token, null, 4))
console.log(JSON.stringify(await aptos.getTokenFromCollection('0x6a564403b90e83e0ecd9ec59446e4eed644a71fdd50441dacdf21fc03c265347', 'Cars', "Taxi"), null, 4))
console.log(JSON.stringify(await aptos.getTokenFromCollection('0x6a564403b90e83e0ecd9ec59446e4eed644a71fdd50441dacdf21fc03c265347', 'Cars', 2), null, 4))
