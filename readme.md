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
+ **Rest** - main API class

### Account

This class is intended to work with Aptos address. With this class you can create an Aptos address or import one from mnemonic. 

**Class methods:**
+ `privateKey()` - return an address private key
+ `address()` - return an Aptos address
+ `authKey()` - return an auth key for the address
+ `pubKey()` - return a public key for the address
+ `signBuffer()` - signing byte buffer
+ `signHexString()` - signing string
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
import {FaucetClient} from "@olton/aptos"

const rest = new RestClient('https://fullnode.devnet.aptoslabs.com')
const faucet = new FaucetClient('https://faucet.devnet.aptoslabs.com', rest)

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
import {RestClient} from "@olton/aptos"

const NODE_URL = 'https://......'
const rest = new RestClient(NODE_URL)
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
+ `cancelTokenOffer()`
+ `getTokenId()`
+ `collectionExists()`
+ `getCollection()`
+ `getTokens()`
+ `getToken()`
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
import {Account, RestClient, FauceClient} from "@olton/aptos"

const APTOS_URL = "https://fullnode.devnet.aptoslabs.com"
const FAUCET_URL = "https://faucet.devnet.aptoslabs.com"

const rest = new RestClient(APTOS_URL)
const faucet = new FaucetClient(FAUCET_URL, rest)

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
