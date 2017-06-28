# cron-durability
## Using
run `npm install cron-durability` on your public directory.

First, you'll need to create an instance from `CronManager` when you load the system.
```javascript
var CronManager = require('cron-durability');

module.global.jobsManager = CronManager('myJobsDatabase');
jobsManager.onServerStart();
```

Then, you can use the manager whenever you want. <br />
Let's create a job for example:

```javascript
var Job = require('cron-durability');

var oneMonthFromNow = new Date();
oneMonthFromNow.setDate(oneMonthFromNow.getDate() + 30);

var job = new Job(oneMonthFromNow, () => {
  console.log("Wow!!! It has been a month since you've created me!);
});
module.global.cronManager.registerJob(job);
```

### Good Luck!
