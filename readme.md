# Aptos Core Client

Welcome to Aptos Core Client by Serhii Pimenov. This library contains core client classes to interact with Aptos Blockchain.

## Using
To install Aptos Core Client
```shell
npm install --save @olton/aptos
```

## Classes

Aptos Core Client implements next classes:
+ **Account** - class for work with Aptos account (create, keys)
+ **Faucet** - client to Aptos faucet
+ **Aptos** - main API class
+ **HexString** - address string routines

### Account

This class is intended to work with Aptos address. With this class you can create an Aptos address or import one from mnemonic. 

**Class methods:**
+ `privateKey()` - return an address private key
+ `address()` - return an Aptos address
+ `authKey()` - return an auth key for the address
+ `pubKey()` - return a public key for the address
+ `signBuffer()` - signing byte buffer
+ `signString()` - signing string
+ `signObject()` - signing object
+ `sign()` - signing account address
+ `mnemonic()` - generate a address mnemonic
+ `toObject()` - export address to specified AccountObject

**Class static methods:**
+ `Account.fromMenmonic(...)` - import account from mnemonic
+ `Account.fromObject(...)` - import account from AccountObject
+ `Account.fromSeed(...)` - import account from account private key (seed)

**Using:**
```javascript
import {Accout} from "@olton/aptos"

// Create new account
const account = new Accout()
console.log(account.toObject())

// Restore account from Menmonic
const account = Accout.fromMnemonic("word1 word2 word3 ...")

// Restore account from Seed (private key)
const account = Accout.fromSeed("1234567890")

```
Output:
```javascript
{
    address: "0x1234567890",
    publicKey: "0x1234567890",
    privateKey: "1234567890",
    mnemonic: "word1 word2 word3 ..."
}
```

### Faucet
**FaucetClient** represents one public method `fundAddress(address, amount)` to funding (sponsoring) address from Aptos Faucet.

Using
```javascript
import {Aptos, FaucetClient} from "@olton/aptos"

const aptos = new Aptos('https://fullnode.devnet.aptoslabs.com')
const faucet = new FaucetClient('https://faucet.devnet.aptoslabs.com', aptos)

const alice = new Account()

await faucet.fundAddress(alice.authKey(), 1_000_000)
```

### Rest

The Rest client represents methods to interact with Aptos API. The methods relate to working with:
+ Accounts
+ Events
+ Transactions

Using
```javascript
import {Aptos} from "@olton/aptos"

const NODE_URL = 'https://......'
const aptos = new Aptos(NODE_URL)
```

#### Interact with Accounts

The next methods provide work with Aptos account:
+ `getAccount()`
+ `getAccountResources()`
+ `getAccountResourcesObject()`
+ `getAccountResource()`
+ `getAccountBalance()`
+ `getAccountModules()`
+ `getAccountEvents()`
+ `getAccountEventsCoins()`
+ `getAccountEventsSentCoins()`
+ `getAccountEventsReceivedCoins()`
+ `getAccountEventsCoinsLast()`
+ `getAccountEventsSentCoinsLast()`
+ `getAccountEventsReceivedCoinsLast()`
+ `getAccountTransactions()`
+ `getAccountTransactionsLast()`

General purpose methods:
+ `setGasValue()`
+ `getHealthy()`
+ `getLedger()`
+ `getEvents()`
+ `getTransactions()`
+ `createAccount()`

Coins:
+ `sendCoins()`

Modules:
+ `publishModule()`

NFT:
+ `createUnlimitedCollection()`
+ `createCollection()`
+ `createToken()`
+ `offerToken()`
+ `claimToken()`
+ `dealToken()`
+ `cancelTokenOffer()`
+ `getTokenId()`
+ `collectionExists()`
+ `getCollection()`
+ `getTokens()`
+ `getTokensAll()`
+ `getToken()`
+ `getTokenById()`
+ `getGallery()`
+ `availableTokens()`

Methods to work with transactions
+ `generateTransaction()`
+ `signTransaction()`
+ `submitTransaction()`
+ `transactionPending()`
+ `waitForTransaction()`
+ `submitTransactionHelper()`
+ `getLastTransaction()`

### Using
1. Sending coins from one account to other
```javascript
import {Account, Aptos, FauceClient} from "@olton/aptos"

const APTOS_URL = "https://fullnode.devnet.aptoslabs.com"
const FAUCET_URL = "https://faucet.devnet.aptoslabs.com"

const aptos = new Aptos(APTOS_URL)
const faucet = new FaucetClient(FAUCET_URL, aptos)

const alice = new Account()
const bob = new Account()

await faucet.fundAddress(alice.address(), 1_000)

const result = await rest.sendCoins(alice, bob.address(), 100)
if (!result) {
    console.log("Error")
} else {
    console.log("Success")
}
console.log(rest.getLastTransaction())
```

### NFT Example
```javascript
import {Aptos} from "@olton/aptos"

const aptos = new Aptos(REST_URL)
const alice = new Account()
const bob = new Account()

console.log("=== Account ===")
console.log("Alice address: ", alice.address())
console.log("Bob address: ", bob.address())

const collectionName = "First Collection"
const collectionDesc = "Alice's simple collection"
const tokenName = "First Token"
const tokenDesc = "Simple token example"

console.log("\n=== Creating Collection and Token ===")
const createCollectionResult = await aptos.createUnlimitedCollection(alice, collectionDesc, collectionName, "https://aptos.dev")
if (!createCollectionResult) {
    throw new Error(aptos.getLastTransaction().vm_status)
}
const createTokenResult = await rest.createToken(
    alice,
    collectionName,
    tokenDesc,
    tokenName,
    1,
    "https://aptos.dev/img/nyan.jpeg",
    {
        max_gas_amount: 2000
    }
)
if (!createTokenResult) {
    throw new Error(aptos.getLastTransaction().vm_status)
}

console.log(`See ${aptos.url}/accounts/${alice.address()}/resources`)
console.log(`See ${aptos.url}/transactions/${aptos.getLastTransaction().hash}`)

console.log("\n=== Get Token ID ===")
const token_id = await aptos.getTokenId(alice.address(), "First Collection", "First Token")
console.log(`Alice's token's identifier: ${token_id}`)

console.log("\n=== Transferring the token to Bob ===")
const offer = await aptos.offerToken(alice, bob.address(), alice.address(), token_id, 2);
if (!offer) {
    throw new Error(aptos.getLastTransaction().vm_status)
}
const claim = await aptos.claimToken(bob, alice.address(), alice.address(), token_id);
if (!claim) {
    throw new Error(aptos.getLastTransaction().vm_status)
}

console.log(`See ${aptos.url}/accounts/${alice.address()}/resources`)
console.log(`See ${aptos.url}/accounts/${bob.address()}/resources`);
```