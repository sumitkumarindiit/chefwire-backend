import Log from "../models/logModel.js";
import UAParser from "ua-parser-js";

export const Logs = async (req, message,next) => {
  try {
    const { method, url, ip } = req;
    const userAgent = req.headers["user-agent"];
    const parser = new UAParser();
    const uaResult = parser.setUA(userAgent).getResult();
    const browser = `${uaResult.browser.name} ${uaResult.browser.version}`;
    const os = `${uaResult.os.name} ${uaResult.os.version}`;
    const device = uaResult.device.type || "Desktop";

    return await Log.create({
      user_id: req.user._id,
      route: url,
      method,
      ip_address: ip,
      browser,
      device,
      os,
      message,
    });
  } catch (err) {
    console.log("err");
    return null
  }
};
