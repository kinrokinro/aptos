import {Account} from "../../src/index.js";
import {Buffer} from "buffer";

const account = Account.fromSeed(`aa04043e9956aac3f3dac073b47be0ae5925596c061ed45e5624c3bd1991425a`)
const str = `рускій корабель - йди нахуй!`
const str2 = `Слава Україні! Героям слава!`
const obj = {
    target: 'рускій корабель',
    direction: `нахуй!`
}

console.log("Address: ", account.address())
console.log("Sign Addr: ", account.sign())
console.log("Sign Addr: ", account.sign().length)
console.log("Sing str", account.signString(str))
console.log("Sing str2", account.signString(str2))
console.log("Sing obj", account.signObject(obj))