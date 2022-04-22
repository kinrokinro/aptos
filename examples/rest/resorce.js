import {RestClient} from "../../src/index.js";
import {REST_URL} from "../helpers/consts.js";

const aptos = new RestClient(REST_URL)
const address = "6a564403b90e83e0ecd9ec59446e4eed644a71fdd50441dacdf21fc03c265347"

const resources = await aptos.getAccountResources(address)
console.log(resources)

const balance = await aptos.getAccountResource(address, "0x1::TestCoin::Balance")
console.log(balance)
