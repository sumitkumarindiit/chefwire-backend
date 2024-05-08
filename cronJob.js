import fs from 'fs';
import path from 'path';
import cron from "node-cron";
import moment from "moment";
import Log from "./models/logModel.js";
import { exec } from "child_process";
import Coupon from "./models/couponModel.js";
import { Constants } from "./services/Constants.js";
import Offer from "./models/offerModel.js";
import Quest from "./models/questModel.js";

// Schedule tasks
const futureTime = moment().add(0.1, "minutes").format("mm HH DD MM *");
cron.schedule("1 0 * * *", async () => {
  try {
    console.log(123)
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
      performDatabaseBackup(),
    ]);
    console.log("Logs older than 30 days have been deleted successfully.");
    // performDatabaseBackup();
  } catch (err) {
    console.error(err);
  }
});
export const performDatabaseBackup = ()=>{
  const date = new Date().toISOString().slice(0, 10);
  const backupFileName = `chefwire_${date}.dump`;
  const backupDirectory = 'databaseBackup';
  const command = `mongodump --uri ${process.env.MONGO_URI}chefwire --archive=${backupDirectory}/${backupFileName}`;
    exec(command, (err, stdout, stderr) => {
      if (err) {
        console.error("Backup failed:", err);
      } else {
        console.log("Backup successful!");
        fs.readdir(backupDirectory, (err, files) => {
          if (err) {
            console.error("Error reading backup directory:", err);
          } else {
            const threeDaysAgo = new Date();
            threeDaysAgo.setDate(threeDaysAgo.getDate() - 3);
            console.log(threeDaysAgo,files)
            files.forEach((file) => {
              const filePath = path.join(backupDirectory, file);
              console.log("filepath",filePath)
              fs.stat(filePath, (err, stats) => {
                if (err) {
                  console.error(`Error getting file stats: ${filePath}`, err);
                } else {
                  console.log(5555,stats)
                  if (stats.isFile() && stats.mtime < threeDaysAgo) {
                    deleteFile(filePath);
                  }
                }
              });
            });
          }
        });
      }
    });
}
function deleteFile(filePath) {
  fs.unlink(filePath, (err) => {
    if (err) {
      console.error(`Error deleting file: ${filePath}`, err);
    } else {
      console.log(`Deleted file: ${filePath}`);
    }
  });
}
export default cron;
