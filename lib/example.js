var CronManager = require('./').CronManager;
var Job = require('./').Job;


var manager = new CronManager("myJobs")
manager.onServerStart()

var date = new Date();
date.setSeconds(date.getSeconds() + 5);

var job = new Job(date, () => {
  console.log("The job has been executed!");
}, "Asia/Tel_Aviv");

manager.registerJob(job);
