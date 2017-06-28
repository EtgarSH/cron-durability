"use strict";

var _ = require('lodash');
var fs = require('fs');
var cron = require('cron');

var stringify = require('json-stringify-safe');
var uuidv4 = require('uuid/v4');

var CronJob = cron.CronJob;

class CronManager {
  constructor(dbDir) {
    this.dbDir = dbDir;

    if (!fs.existsSync(dbDir)) {
      fs.writeFileSync(dbDir, stringify({jobs: []}));
    }
  }

  onServerStart() {
    /*
      You should call this function whenever the server starts
      in order to load the Jobs that are in the database
    */
    console.log(`Dir: ${this.dbDir}`)

    var jobs = this.getListedJobs()
    jobs.forEach((job) => {
      if (new Date(job.date).getTime() < new Date().getTime()) {
        // The date has passed, so we execute the job and unregistering it
        var code = new Function(job.function);
        code();

        this.unregisterJob(job);
      }
    });

    // TODO - Don't call this function twice, now I'm calling it because unregisterJob doesn't remove it from 'jobs'
    jobs = this.getListedJobs();

    jobs.forEach((job) => {
      var onTick = new Function(job.function);
      var uuid = job.uuid;

      job = new Job(new Date(job.date), onTick, job.timeZone);
      job.uuid = uuid;
      job.setManager(this);
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

    job.setManager(this);
  }

  unregisterJob(job) {
    console.log(`Unregistering ${job.uuid}`)
    var jobs = this.getListedJobs()
    _.remove(jobs, (listedJob) => { return listedJob.uuid == job.uuid })
    this.setJobs(jobs);

    if (job.cronJob.stop) {
      // Will reach this block only if there is a cron job for this job
      job.cronJob.stop();
    }
  }
}

class Job {
  constructor(executionDate, onTick, timeZone) {
    this.uuid = uuidv4();

    let seconds = executionDate.getSeconds();
    let min = executionDate.getMinutes();
    let hours = executionDate.getHours();
    let day = executionDate.getDate();
    let month = executionDate.getMonth();

    let cronTime = `${seconds} ${min} ${hours} ${day} ${month} *`
    console.log(cronTime);
    this.cronJob = new CronJob(cronTime, onTick, null, true, timeZone);

    this.date = executionDate;
    this.timeZone = timeZone;
    this.onTick = onTick
    this.function = `${onTick.toString()}()`;
  }

  setManager(manager) {
    // Setting the onComplete of the cronJob
    this.cronJob.stop();
    this.cronJob = new CronJob(this.date, () => {
      this.onTick();
      manager.unregisterJob(this);
    }.bind(this), null, true, this.timeZone);
  }
}

// TODO - This is some boilerplate code just for the development
// Later I'm going to put some unittests, don't worry, I'm gonna kill this code.
var manager = new CronManager("myJobs")
manager.onServerStart()

var date = new Date();
date.setSeconds(date.getSeconds() + 5);

var job = new Job(date, () => {
  console.log("The job has been executed!");
}, "Asia/Tel_Aviv");

manager.registerJob(job);

module.exports = {
  Job,
  CronManager
}
