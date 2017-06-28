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

    var jobs = this.getListedJobs()
    jobs.forEach((job) => {
      if (new Date(job.date).getTime() < new Date().getTime()) {
        console.log("Unregisteding Job");
        this.unregisterJob(job);
      }
    });

    // TODO - Don't call this function twice, now I'm calling it  because unregisterJob doesn't remove it from 'jobs'
    jobs = this.getListedJobs();

    jobs.forEach((job) => {
      // TODO - Register Cron Job
    });

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
    var jobs = this.getListedJobs()
    _.remove(jobs, (listedJob) => { return listedJob == job })
    this.setJobs(jobs);
  }
}

class Job {
  constructor(executionDate, onTick, timeZone) {
    let seconds = executionDate.getSeconds();
    let min = executionDate.getMinutes();
    let hours = executionDate.getHours();
    let day = executionDate.getDate();
    let month = executionDate.getMonth();

    let cronTime = `${seconds} ${min} ${hours} ${day} ${month} *`
    console.log(cronTime);
    this.cronJob = new CronJob(cronTime, onTick, null, true, timeZone);
    this.date = executionDate;
  }
}

// TODO - This is some boilerplate code just for the development
// Later I'm going to put some unittests, don't worry, I'm gonna kill this code.
var manager = new CronManager("myJobs")
manager.onServerStart()

var date = new Date();
date.setSeconds(date.getSeconds() + 10);

var job = new Job(date, () => {
  console.log("The job has been executed!");
}, "Asia/Tel_Aviv");

manager.registerJob(job);

module.exports = {
  Job,
  CronManager
}
