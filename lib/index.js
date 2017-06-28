"use strict";

var _ = require('lodash');
var fs = require('fs');
var cron = require('cron');

var stringify = require('json-stringify-safe');

var CronJob = cron.CronJob;

class CronManager {
  constructor(dbDir) {
    this.dbDir = dbDir;

    if (!fs.existsSync(dbDir)) {
      fs.writeFileSync(dbDir, stringify({jobs: []}));
    }
  }

  onServerStart() {
    console.log(`Dir: ${this.dbDir}`)
  }

  getListedJobs() {
    var jobsJson = JSON.parse(fs.readFileSync(this.dbDir));
    return jobsJson.jobs;
  }

  setJobs(jobs) {
    var jobsJson = JSON.parse(fs.readFileSync(this.dbDir));
    jobsJson.jobs = jobs;

    fs.writeFileSync(this.dbDir, stringify(jobsJson));
  }

  registerJob(job) {
    var jobs = this.getListedJobs();
    jobs.push(job);
    this.setJobs(jobs);
  }

  unregisterJob(job) {
    var jobs = 
    _.remove(this.getListedJobs(),)
  }
}

class Job {
  constructor(executionDate, onTick, timeZone) {
    let min = executionDate.getMinutes();
    let hours = executionDate.getHours();
    let day = executionDate.getDate();
    let month = executionDate.getMonth();

    let cronTime = `${min} ${hours} ${day} ${month} *`
    console.log(cronTime);
    this.cronJob = new CronJob(cronTime, onTick, null, true, timeZone);
    this.date = executionDate;
  }
}

var manager = new CronManager("myJobs")
manager.onServerStart()

var date = new Date();
date.setMinutes(date.getMinutes() + 1);

var job = new Job(date, () => {
  console.log("The job has been executed!");
}, "Asia/Tel_Aviv");

manager.registerJob(job);

module.exports = {
  Job,
  CronManager
}
