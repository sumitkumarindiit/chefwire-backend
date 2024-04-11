import Notification from "../models/notificationModel.js";
import { emitSocketEvent } from "../socket.js";

export const Notifications = async (req,sender, receiver,Event,message,type,payload) => {
  try {
    // console.log({sender, receiver,Event,message,type,payload})
    await Notification.create({
      sender:sender._id,
      receiver,
      message,
      payload,
      ...(type && ({type:type}))
    });
    payload.message=message
    emitSocketEvent(req,receiver.toString(),Event,payload,sender);
    return;
  } catch (err) {
    console.error("Error",err);
    return;
  }
};
