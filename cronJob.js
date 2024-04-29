import cron from "node-cron";
import moment from "moment";
import Log from "./models/logModel.js";
import { exec } from "child_process";
import Coupon from "./models/couponModel.js";
import { Constants } from "./services/Constants.js";
import Offer from "./models/offerModel.js";
import Quest from "./models/questModel.js";

// Schedule tasks
const futureTime = moment().add(1, "minutes").format("mm HH DD MM *");
cron.schedule("1 0 * * *", async () => {
  try {
    const thirtyDaysAgo = moment().subtract(30, "days").toDate();
    await Promise.all([
      Log.deleteMany({ createdAt: { $lt: thirtyDaysAgo } }),
      Coupon.updateMany(
        { validTill: { $lte: new Date() } },
        { status: Constants.INACTIVE }
      ),
      Offer.updateMany(
        { validTill: { $lte: new Date() } },
        { status: Constants.INACTIVE }
      ),
      Quest.updateMany(
        { validTill: { $lte: new Date() } },
        { status: Constants.INACTIVE }
      ),
    ]);
    console.log("Logs older than 30 days have been deleted successfully.");
    // performDatabaseBackup();
  } catch (err) {
    console.error(err);
  }
});

export default cron;
