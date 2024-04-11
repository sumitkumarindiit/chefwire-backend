export const SocketEvent = {
  LIKE_POST_EVENT: "likePost",
  ACCEPT_REQUEST_EVENT: "acceptRequest",
  CONNECTED_EVENT: "connected",
  DISCONNECTED_EVENT: "disconnect",
  LIKE_COMMENT_EVENT: "likeComment",
  NEW_MESSAGE_EVENT: "newMessage",
  NEW_CHAT_EVENT: "newChat",
  COMMENT_POST_EVENT: "commentPost",
  GROUP_MEMBER_ADDED:"groupMemberAdded",
  ONLINE_USERS:"onlineUsers"
};
export const Constants = {
  DB_NAME:"chefwire",
  ACTIVE:"ACTIVE",
  INACTIVE:"INACTIVE",
  OTP_TYPE_SIGNUP:"SIGNUP",
  OTP_TYPE_FORGOT:"FORGOT",
  OTP_SENT_MOBILE:"Otp sent successfully to your mobile number",
  BLOCKED:"BLOCKED",
  LOGOUT:"Logout Successful",
  LOGIN:"Login Successful",
  SIGNUP:"Signup Successful",
  EMAIL_EXIST:"Email already axist",
  MOBILE_EXIST:"Mobile number already axist",
  WRONG_EMAIL:"Email not exist please signup",
  WRONG_PASSWORD:"Password is incorrect",
  DATA_FETCHED:"Data fetched successfully",
  DATA_CREATED:"Data added successfully",
  DATA_UPDATED:"Data updated successfully",
  DATA_DELETED:"Data deleted successfully",
  DATA_NOT_FETCHED:"Error while fetching data",
  DATA_NOT_CREATED:"Error while creating data",
  DATA_NOT_UPDATED:"Error while updating data",
  DATA_NOT_DELETED:"Error while deleting data",
  INACTIVE_SIGNUP:"You are blocked please contact your administrator",
  SOMETHING_WRONG:"Something went wrong!"
  };

export const ChatEventEnum = Object.freeze({
  // ? once user is ready to go
  CONNECTED_EVENT: "connected",
  // ? when user gets disconnected
  DISCONNECT_EVENT: "disconnect",
  // ? when user joins a socket room
  JOIN_CHAT_EVENT: "joinChat",
  // ? when participant gets removed from group, chat gets deleted or leaves a group
  LEAVE_CHAT_EVENT: "leaveChat",
  // ? when admin updates a group name
  UPDATE_GROUP_NAME_EVENT: "updateGroupName",
  // ? when new message is received
  MESSAGE_RECEIVED_EVENT: "messageReceived",
  // ? when there is new one on one chat, new group chat or user gets added in the group
  NEW_CHAT_EVENT: "newChat",
  // ? when there is an error in socket
  SOCKET_ERROR_EVENT: "socketError",
  // ? when participant stops typing
  STOP_TYPING_EVENT: "stopTyping",
  // ? when participant starts typing
  TYPING_EVENT: "typing",
});

export const AvailableChatEvents = Object.values(ChatEventEnum);
