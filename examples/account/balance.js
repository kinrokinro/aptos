import {Account, sleep} from "../../src/index.js";
import {Aptos, FaucetClient} from "../../src/index.js";
import {FAUCET_URL, REST_URL} from "../helpers/consts.js";

const aptos = new Aptos(REST_URL)
const faucet = new FaucetClient(FAUCET_URL, aptos)

const oldAuth = "df1f220bc6d49959c84757ca6878be2dc1da31b963b024f158544dde7df35cb5"

const bob = new Account(
    "0e4ea8698b4ab13eae527cc436cfa1d8239c334a711826b6f66867f4c05e6e63",
    "0xdf1f220bc6d49959c84757ca6878be2dc1da31b963b024f158544dde7df35cb5"
)

console.log("0) Bob Account: ", await aptos.getAccount(bob.address()))

console.log("1) Bob address: ", bob.address())
console.log("2) Bob authkey: ", bob.authKey())

console.log("3) Bob balance: ", await aptos.getAccountBalance(bob.address()))

console.log("Fund for new auth", bob.authKey())
console.log("Fund hash", await faucet.fundAddress(bob.authKey(), 100))
console.log("4) Bob balance: ", await aptos.getAccountBalance(bob.address()))

console.log("Fund for old auth", oldAuth)
console.log("Fund hash", await faucet.fundAddress(oldAuth, 100))
console.log("5) Bob balance: ", await aptos.getAccountBalance(bob.address()))
