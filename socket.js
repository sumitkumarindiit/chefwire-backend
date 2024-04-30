import cookie from "cookie";
import jwt from "jsonwebtoken";
import { AvailableChatEvents, ChatEventEnum,SocketEvent } from "./services/Constants.js";
import User from "./models/userModel.js";
import { sendPushNotification } from "./services/firebaseService.js";
export const onlineUsers = new Set();
const mountJoinChatEvent = (socket) => {
  socket.on(ChatEventEnum.JOIN_CHAT_EVENT, (chatId) => {
    console.log(`User joined the chat 🤝. chatId: `, chatId);
    socket.join(chatId);
  });
};
const mountParticipantTypingEvent = (socket) => {
  socket.on(ChatEventEnum.TYPING_EVENT, (chatId) => {
    socket.in(chatId).emit(ChatEventEnum.TYPING_EVENT, chatId);
  });
};
const mountParticipantStoppedTypingEvent = (socket) => {
  socket.on(ChatEventEnum.STOP_TYPING_EVENT, (chatId) => {
    socket.in(chatId).emit(ChatEventEnum.STOP_TYPING_EVENT, chatId);
  });
};
const initializeSocketIO = (io) => {
  return io.on("connection", async (socket) => {
    try {
      const cookies = cookie.parse(socket.handshake.headers?.cookie || "");
      let token = cookies?.accessToken;
      if (!token) {
        token = socket.handshake.auth?.token;
      }
      if (!token) {
        console.log("Token Empty socket")
      }
      // console.log(token)
      const decodedToken = jwt.verify(token, process.env.JWT_SECRET); // decode the token
      if(!decodedToken){
        console.log("Invalid jwt token")
      }
      const user = await User.findById(decodedToken?._id).select(
        "-password -__v"
      );
      if (!user) {
        console.log(56)
      }
      // const user = req.user; 
      socket.user = user;
      socket.join(user._id.toString());
      socket.emit(SocketEvent.CONNECTED_EVENT);
      User.findByIdAndUpdate(user._id,{isOnline:true});
      console.log("User connected 🗼. userId: ", user._id.toString());
      onlineUsers.add(user._id.toString());
      io.emit(SocketEvent.ONLINE_USERS, Array.from(onlineUsers));
      mountJoinChatEvent(socket);
      mountParticipantTypingEvent(socket);
      mountParticipantStoppedTypingEvent(socket);

      socket.on(SocketEvent.DISCONNECTED_EVENT, () => {
        User.findByIdAndUpdate(user._id,{isOnline:false});
        console.log("user has disconnected 🚫. userId: " + socket.user?._id);
        onlineUsers.delete(socket.user?._id.toString());
        io.emit(SocketEvent.ONLINE_USERS, Array.from(onlineUsers));
        if (socket.user?._id) {
          socket.leave(socket.user._id);
        }
      });
    } catch (error) {
      console.log("Error",error)
      socket.emit(
        ChatEventEnum.SOCKET_ERROR_EVENT,
        error?.message || "Something went wrong while connecting to the socket."
      );
    }
  });
};
const emitSocketEvent = async(req, roomId, event, payload,sender) => {
  req.app.get("io").in(roomId).emit(event, {payload,sender});
};

export { initializeSocketIO, emitSocketEvent };
