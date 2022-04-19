import {RestClient, FaucetClient} from "../../src/index.js";
import {REST_URL, FAUCET_URL} from "../helpers/consts.js";

const client = new RestClient(REST_URL)
const faucet = new FaucetClient(FAUCET_URL, client)
const address = "6a564403b90e83e0ecd9ec59446e4eed644a71fdd50441dacdf21fc03c265347"

console.log("=== Fund Account ===")
await faucet.fundAddress(address, 1000)
console.log("=== Balance ===")
console.log(await client.getAccountBalance(address))
