/**
 * In HTTP, clients must initiate requests, and the server 
 * can’t initiate requests independently. Because of this, the only way for 
 * clients to get updated information is to send a new request to the server. 
 * For example, if you’re chatting with a friend in a messaging app, you might 
 * send a message to the server, but then
 *  your computer must send further 
 * requests to the server to check for responses.
 * Making a WebSocket connection starts with an HTTP request. The client starts by sending a “handshake” request, 
 * specifying that it wants to open up a WebSocket connection. 
 * If the server is capable of starting a WebSocket connection, 
 * it sends a successful handshake response, 
 * and the protocol switches from HTTP to WebSockets.
Once the connection is established, WebSockets sends messages using 
a TCP connection to ensure that packets of information are reliably 
delivered from one computer to another.
 * 
Unlike WebSockets, WebRTC is a peer-to-peer protocol which enables direct communication 
between browsers. Typically, individual computers sit on private 
networks that don’t have a public-facing IP address. Private networks rely on 
network access transversal (NAT) 
devices to translate private IP addresses into public IP addresses. 
WebRTC negotiates direct connections between computers using STUN (Session Traversal Utilities for NAT) 
and TURN (Traversal Using Relays around NAT) servers. 
By making a request to a STUN or TURN server, 
your computer can determine your public-facing 
IP address and let other computers know how to contact you. Other computers 
can do the same by making STUN or TURN requests.
Once WebRTC knows your IP address, the next step is for your 
computer to initiate a connection with another computer. 
This process is known as “signaling.” WebRTC is flexible and allows 
for a number of protocols to be used for session negotiation, 
including Session Initiation Protocol (SIP) and COMET.
WebSocket connections run through a central server, 
making them better suited for situations in which more than two users 
will be involved in a conversation. But since WebSocket connections aren’t direct, 
they allow for less efficient streaming — which can negatively affect 
audio and video quality. 
For one-on-one use cases, WebRTC is preferable.
 */


const authSocket = require("./middleware/authSocket");
const newConnectionHandler = require("./socketHandlers/newConnectionHandler");
const disconnectHandler = require("./socketHandlers/disconnectHandler");
const directMessageHandler = require("./socketHandlers/directMessageHandler");
const directChatHistoryHandler = require("./socketHandlers/directChatHistoryHandler");
const roomCreateHandler = require("./socketHandlers/roomCreateHandler");
const roomJoinHandler = require("./socketHandlers/roomJoinHandler");
const roomLeaveHandler = require("./socketHandlers/roomLeaveHandler");
const roomInitializeConnectionHandler = require("./socketHandlers/roomInitializeConnectionHandler");
const roomSignalingDataHandler = require("./socketHandlers/roomSignalingDataHandler");

const serverStore = require("./serverStore");

// método que será importado no server
const registerSocketServer = (server) => {
  const io = require("socket.io")(server, {
    cors: {
      origin: "*",
      methods: ["GET", "POST"],
    },
  });

  serverStore.setSocketServerInstance(io);

  io.use((socket, next) => {
    authSocket(socket, next);
  });

  const emitOnlineUsers = () => {
    const onlineUsers = serverStore.getOnlineUsers();
    io.emit("online-users", { onlineUsers });
  };

  io.on("connection", (socket) => {
    console.log("user connected");
    console.log(socket.id);

    newConnectionHandler(socket, io);
    emitOnlineUsers();

    socket.on("direct-message", (data) => {
      directMessageHandler(socket, data);
    });

    socket.on("direct-chat-history", (data) => {
      directChatHistoryHandler(socket, data);
    });

    socket.on("room-create", () => {
      roomCreateHandler(socket);
    });

    socket.on("room-join", (data) => {
      roomJoinHandler(socket, data);
    });

    socket.on("room-leave", (data) => {
      roomLeaveHandler(socket, data);
    });

    socket.on("conn-init", (data) => {
      roomInitializeConnectionHandler(socket, data);
    });

    socket.on("conn-signal", (data) => {
      roomSignalingDataHandler(socket, data);
    });

    socket.on("disconnect", () => {
      disconnectHandler(socket);
    });
  });

  setInterval(() => {
    emitOnlineUsers();
  }, [1000 * 8]);
};

module.exports = {
  registerSocketServer,
};
