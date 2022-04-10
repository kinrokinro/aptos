import {Account} from "../../src/index.js";

const account = new Account()
const obj = account.toObject()
console.log(obj)
console.log(Account.fromMnemonic(obj.mnemonic).address())
console.log(new Account(obj.privateKey).address())