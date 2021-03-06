/*
  A node.js IPFS node. This could represent a REST API server.
*/

const BCHJS = require('@psf/bch-js')
const bchjs = new BCHJS()

// Pubsub room.
const CHAT_ROOM_NAME = "psf-ipfs-chat-001";

// Set these constants for your own tests.
const ROOM_NAME = "customPubsubRoom123";
const PORT = 6002
const PEER1 = "/ip4/127.0.0.1/tcp/4002/p2p/QmRrUWLTxUt2HBBT4fCS4jCQAbKtekAtiMhHhtibQY6taB"


// Global npm libraries
const IPFS = require("ipfs");
const IpfsCoord = require("ipfs-coord")

let ipfsId; // Used to track the IPFS ID of this node.
let ipfs; // instance of IPFS for this node.

// Ipfs Options
const ipfsOptions = {
  repo: "./ipfs-data",
  start: true,
  EXPERIMENTAL: {
    pubsub: true
  },
  config: {
    relay: {
      enabled: true, // enable circuit relay dialer and listener
      hop: {
        enabled: true // enable circuit relay HOP (make this node a relay)
      }
    },
    pubsub: true, // enable pubsub
    Addresses: {
      Swarm: [`/ip4/0.0.0.0/tcp/${PORT}`],
      API: `/ip4/127.0.0.1/tcp/${PORT+1}`,
      Gateway: `/ip4/127.0.0.1/tcp/${PORT+2}`
    }
  }
};

async function startClientNode() {
  try {
    // Starting ipfs node
    console.log("Starting...");
    ipfs = await IPFS.create(ipfsOptions);
    console.log("... IPFS is ready.\n");

    // Instantiate the IPFS Coordination library.
    ipfsCoord = new IpfsCoord({ ipfs, bchjs, type: "node.js", isCircuitRelay: false });
    await ipfsCoord.isReady();
    console.log("IPFS coordination is ready.");

    // subscribe to the 'chat' chatroom.
    await ipfsCoord.ipfs.pubsub.subscribeToPubsubChannel(
      CHAT_ROOM_NAME,
      handleChat
    );

    // Send a chat message to the chat room.
    setInterval(async function() {
      const now = new Date();
      const msg = `Message from Mock Client at ${now.toLocaleString()}`;
      const handle = "mock client";
      const chatObj = {
        message: msg,
        handle: handle
      };

      // Add the chat data to the schema.
      const chatData = ipfsCoord.ipfs.schema.chat(chatObj);

      // Convert the chat JSON object into a string.
      const chatDataStr = JSON.stringify(chatData);

      // Publish the stringified chat object to the pubsub channel.
      await ipfsCoord.ipfs.pubsub.publishToPubsubChannel(
        CHAT_ROOM_NAME,
        chatDataStr
      );
    }, 60000 * 5); // five minutes

  } catch (err) {
    console.error("Error: ", err);
  }
}
startClientNode();

function handleChat(msgData) {
  // console.log('msgData: ', msgData)

  let from = msgData.from;
  if (msgData.data.data.handle) from = msgData.data.data.handle;

  console.log(`Peer ${from} says: ${msgData.data.data.message}`);
}

// Promise based sleep function:
function sleep(ms) {
  return new Promise(resolve => setTimeout(resolve, ms));
}
