import cron from 'node-cron';
import moment from "moment";
import Log from "./models/logModel.js";
import {exec} from "child_process"

// Schedule tasks
const futureTime = moment().add(1, 'minutes').format('mm HH DD MM *');
cron.schedule('0 12 * * *', async() => {
  try{
    const thirtyDaysAgo = moment().subtract(30, 'days').toDate();
    await Log.deleteMany({ createdAt: { $lt: thirtyDaysAgo } });
    console.log('Logs older than 30 days have been deleted successfully.');
    // performDatabaseBackup();
  }catch(err){
    console.error(err)
  }
});
const performDatabaseBackup = () => {
    const backupDir = './databaseBackup'; // Specify the directory where backups will be stored
    const backupFileName = `backup_${moment().format('YYYY-MM-DD-HH-mm-ss')}.dump`; // Generate backup file name
  
    // Execute mongodump command to create a backup
    exec(`mongodump --out=${backupDir}/${backupFileName}`, (error, stdout, stderr) => {
      if (error) {
        console.error(`Database backup failed: ${error.message}`);
        return;
      }
      if (stderr) {
        console.error(`Database backup failed: ${stderr}`);
        return;
      }
      console.log('Database backup completed successfully.');
    });
  };

export default cron; // Export cron instance for use in other files
