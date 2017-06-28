# cron-durability
## Description
Have you ever try using crone in Node?<br />
There is a known problem with this module - the jobs are not durable.<br />
When you register a job and shut-down your system, the job will just be wiped from the RAM.

This is why I've created `cron-durability`, a library that defends your jobs from a system shutdown.

## Using
run `npm install cron-durability` on your public directory.

First, you'll need to create an instance from `CronManager` when you load the system.
```javascript
var CronManager = require('cron-durability').CronManager;

module.global.jobsManager = CronManager('myJobsDatabase');
jobsManager.onServerStart();
```

Then, you can use the manager whenever you want.<br />
Let's create a job for example:

```javascript
var Job = require('cron-durability').Job;

var oneMonthFromNow = new Date();
oneMonthFromNow.setDate(oneMonthFromNow.getDate() + 30);

var job = new Job(oneMonthFromNow, () => {
  console.log("Wow!!! It has been a month since you've created me!");
}, "Asia/Tel_Aviv");
module.global.jobsManager.registerJob(job);
```

### Good Luck!
