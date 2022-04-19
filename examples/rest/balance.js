import {RestClient} from "../../src/index.js";
import {REST_URL} from "../helpers/consts.js";

const rest = new RestClient(REST_URL)
const address = "6a564403b90e83e0ecd9ec59446e4eed644a71fdd50441dacdf21fc03c265347"

console.log("=== Balance ===")
console.log(await rest.getAccountBalance(address))
