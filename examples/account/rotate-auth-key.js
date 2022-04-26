import {Account} from "../../src/index.js";
import {Aptos, FaucetClient} from "../../src/index.js";
import {FAUCET_URL, REST_URL} from "../helpers/consts.js";
import {logObject} from "../helpers/log.js";

//Address: 0xdf1f220bc6d49959c84757ca6878be2dc1da31b963b024f158544dde7df35cb5
//PublicKey: 0x8c6a96a499b6782ff94892395efa95f4eed4a16698a12aedf86547c1067db94b
//AuthKey: df1f220bc6d49959c84757ca6878be2dc1da31b963b024f158544dde7df35cb5
//PrivateKey: 8beb6130baaccaf80f9495eb84800137c48be8749e0ee7f823c8ee0350a2f511

const aptos = new Aptos(REST_URL)
const faucet = new FaucetClient(FAUCET_URL, aptos)

const Bob = Account.fromSeed("8beb6130baaccaf80f9495eb84800137c48be8749e0ee7f823c8ee0350a2f511")
const bobAddress = Bob.address()
const bobAuthKey = Bob.authKey()

console.log("--------- Bob ----------")
console.log("Address: ", bobAddress)
console.log("AuthKey: ", bobAuthKey)

console.log("--------- Donate Bob ----------")
await faucet.fundAddress(bobAuthKey, 1000)
console.log("Bob balance: ", await aptos.getAccountBalance(bobAddress))

console.log("--------- Generate new keys ----------")
const acc = new Account()
const newAuthKey = acc.authKey()
const newPrivateKey = acc.privateKey()
const newPubKey = acc.pubKey()
console.log("New authKey:", newAuthKey)
console.log("New privateKey:", newPrivateKey)
console.log("New pubKey:", newPubKey)

console.log("--------- Rotate auth key ----------")
const result = await aptos.rotateAccountAuthKey(Bob, newAuthKey)
logObject(aptos.getLastTransaction())

if (!result) process.exit(1)

console.log("--------- Donate Bob For old AuthKey ----------")
await faucet.fundAddress(bobAuthKey, 1000)
console.log("Bob balance: ", await aptos.getAccountBalance(bobAddress))

console.log("--------- Donate Bob For new AuthKey ----------")
await faucet.fundAddress(newAuthKey, 1000)
console.log("Bob balance: ", await aptos.getAccountBalance(bobAddress))

console.log("--------- Check Bob Account For new AuthKey ----------")
const newBob = new Account(newPrivateKey, bobAddress)
console.log("Bob Address: ", newBob.address())
console.log("Bob PrivateKey: ", newBob.privateKey())
console.log("Bob AuthKey: ", newBob.authKey())
console.log("Bob PublicKey: ", newBob.pubKey())
console.log("Bob balance: ", await aptos.getAccountBalance(newBob.address()))

/* *
Bob Address:  0xdf1f220bc6d49959c84757ca6878be2dc1da31b963b024f158544dde7df35cb5
Bob PrivateKey:  0e4ea8698b4ab13eae527cc436cfa1d8239c334a711826b6f66867f4c05e6e63
Bob AuthKey:  2c6c14f7c23cda5eea025207b41fc0b66f7711c10e8e26a53c5c1aa876f59e56
Bob PublicKey:  0xd277ddaac49583d8e76324d73c32c236a356a279230389c628607b53deb46de1
* */