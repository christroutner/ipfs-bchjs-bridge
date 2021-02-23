/*
  A node.js IPFS node. This could represent a REST API server.
*/

// Relay nodes.
const CHAT_ADDR =
  "/ip4/138.68.212.34/tcp/4002/ipfs/QmaUW4oCVPUFLRqeSjvhHwGFJHGWrYWLBEt7WxnexDm3Xa";
const BOOTSTRAP_ADDR =
  "/ip4/116.203.193.74/tcp/4001/ipfs/QmNZktxkfScScnHCFSGKELH3YRqdxHQ3Le9rAoRLhZ6vgL";

// Set these constants for your own tests.
const ROOM_NAME = "customPubsubRoom123";
const PORT = 6002
const PEER1 = "/ip4/127.0.0.1/tcp/4002/p2p/QmRrUWLTxUt2HBBT4fCS4jCQAbKtekAtiMhHhtibQY6taB"


// Global npm libraries
const IPFS = require("ipfs");
const OrbitDB = require("orbit-db");

let ipfsId; // Used to track the IPFS ID of this node.
let ipfs; // instance of IPFS for this node.

// Ipfs Options
const ipfsOptions = {
  repo: "./chatdata",
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
    console.log("1. IPFS node created.");

    // Get the IPFS ID for this node.
    ipfsId = await ipfs.config.get("Identity");
    ipfsId = ipfsId.PeerID;
    console.log(`This nodes peer ID: ${ipfsId}`);

    // const allConfig = await ipfs.config.getAll();
    // console.log(`allConfig: ${JSON.stringify(allConfig, null, 2)}`);

    // Get the local addresses this node is listening to.
    const localAddrs = await ipfs.swarm.localAddrs();
    console.log(
      `listening on these addresses: ${JSON.stringify(localAddrs, null, 2)}\n`
    );

    // Connect to the first bootstrap server
    try {
      console.log(`Attemping connection to Relay node: ${CHAT_ADDR}`);
      await ipfs.swarm.connect(CHAT_ADDR);
      console.log("2. Connected to first relay server.\n");
    } catch (err) {
      console.log("2. Could not connect to first relay server.\n");
    }

    // Connect to the second bootstrap server
    try {
      console.log(`Attemping connection to Relay node: ${BOOTSTRAP_ADDR}`);
      await ipfs.swarm.connect(BOOTSTRAP_ADDR);
      console.log("3. Connected to second relay server.\n");
    } catch (err) {
      console.log("3. Could not connect to second bootstrap server.\n");
    }

    // Connect to the node1 peer
    try {
      console.log(`Attemping connection to local peer: ${PEER1}`);
      await ipfs.swarm.connect(PEER1);
      console.log("3b. Connected to PEER1.\n");
    } catch (err) {
      console.log("3b. Could not connect to PEER1.\n");
    }

    // Subscribe to the pubsub room.
    await ipfs.pubsub.subscribe(ROOM_NAME, msg => {
      // print out any messages recieved.
      console.log(msg.data.toString());
    });
    console.log(`4. Subscribed to pubsub room ${ROOM_NAME}`);

    // Periodically publish connection information to the pubsub channel.
    setInterval(async function() {
      const now = new Date();

      // Date-stamped connection information.
      const connectionInfo = {
        date: now.toLocaleString(),
        ipfsId: ipfsId,
        message: `Message from node.js app @ ${now.toLocaleString()}`
      };

      const msgBuf = Buffer.from(JSON.stringify(connectionInfo));

      // Publish the message to the pubsub channel.
      await ipfs.pubsub.publish(ROOM_NAME, msgBuf);

      console.log(`5. Published message to ${ROOM_NAME}\n`);
    }, 60000);

    // Periodically refresh the connection to the Relay servers.
    setInterval(async function() {
      await ipfs.swarm.connect(CHAT_ADDR);
      await ipfs.swarm.connect(BOOTSTRAP_ADDR);

      // const connectStr = `${BOOTSTRAP_ADDR}/p2p-circuit/p2p/QmUqWUQrPHJtu9YKGuuvgJEuAjb4RcZo5ysymppRsxGzu1`
      // const connectStr = `${BOOTSTRAP_ADDR}/p2p-circuit/ipfs/QmUqWUQrPHJtu9YKGuuvgJEuAjb4RcZo5ysymppRsxGzu1`
      // await ipfs.swarm.connect(connectStr)

      console.log("Reconnected to Relay servers\n");
    }, 30000);

    // Create the OrbitDB.
    await createOrbitDB();
  } catch (err) {
    console.error("Error: ", err);
  }
}
startClientNode();

async function createOrbitDB() {
  try {
    const orbitdb = await OrbitDB.createInstance(ipfs, {
      directory: "./orbitdb/examples/eventlog"
    });

    const options = {
      accessController: {
        write: ["*"]
      }
    };

    const DB_NAME = "test001";
    db = await orbitdb.eventlog(DB_NAME, options);
    await db.load();

    console.log(`db id: ${db.id}`);

    setInterval(query, 1000 * 30);
  } catch (err) {
    console.error("Error in createOrbitDB: ", err);
  }
}

const query = async () => {
  const index = Math.floor(Math.random() * 10);
  const userId = Math.floor(Math.random() * 900 + 100);

  try {
    const entry = { avatar: index, userId: userId };
    console.log(`Adding ${entry.avatar} ${entry.userId} to DB.`);
    await db.add(entry);
    const latest = db.iterator({ limit: 5 }).collect();
    let output = ``;
    output += `[Latest Visitors]\n`;
    output += `--------------------\n`;
    output += `ID  | Visitor\n`;
    output += `--------------------\n`;
    output +=
      latest
        .reverse()
        .map(e => e.payload.value.userId + " | " + e.payload.value.avatar + ")")
        .join("\n") + `\n`;
    console.log(output);
  } catch (e) {
    console.error(e);
    process.exit(1);
  }
};

// Promise based sleep function:
function sleep(ms) {
  return new Promise(resolve => setTimeout(resolve, ms));
}
