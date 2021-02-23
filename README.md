# ipfs-bchjs-bridge
This app demonstrates the use of the [ipfs-coord](https://www.npmjs.com/package/ipfs-coord) library by instantiating bch-js and giving access to it over IPFS. This simulates a user in China that would otherwise be blocked from making calls to the FullStack.cash REST API, but can use this bridge to tunnel through the IPFS network and access it that way. This is a general approach that would work for any web service.

There are two directories:
- bchjs-bridge is a node.js app that gives access to bch-js network calls.
- mock-client is another node.js app that simulates a user by finding the bchjs-bridge and makes a series of calls to it.


## Installation
Enter each directory and run `npm install` to install dependencies. Both apps can be started with `npm start`.

## License
[MIT](./LICENSE.md)
