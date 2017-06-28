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
    var jobs = this.getListedJobs()

    if (jobs.length != 0) {
      console.log("There are some jobs in our database. Loading them...");
    }

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

    // Creating crons for the stored Jobs that are going to be executed
    // In the future
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
    /*
      Need to be called everytime you want to register a job for the durability
    */
    var jobs = this.getListedJobs();
    jobs.push(job);
    this.setJobs(jobs);

    job.setManager(this);
  }

  unregisterJob(job) {
    /*
      Removes the job from the database and stops it's cron.
    */

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
    // Generate and id for the job
    this.uuid = uuidv4();

    let cronTime = convertDateToCronFormat(executionDate);
    this.cronJob = new CronJob(cronTime, onTick, null, true, timeZone);

    this.date = executionDate;
    this.timeZone = timeZone;
    this.onTick = onTick

    // Saving the implementation of the `onTick` callback
    this.function = `${onTick.toString()}()`;
  }

  setManager(manager) {
    // Injecting the `unregisterJob` function into the cron's onTick
    this.cronJob.stop();
    this.cronJob = new CronJob(this.date, () => {
      this.onTick();
      manager.unregisterJob(this);
    }.bind(this), null, true, this.timeZone);
  }
}

function convertDateToCronFormat(date) {
  let seconds = date.getSeconds();
  let min = date.getMinutes();
  let hours = date.getHours();
  let day = date.getDate();
  let month = date.getMonth();

  return `${seconds} ${min} ${hours} ${day} ${month} *`;
}

module.exports = {
  Job,
  CronManager
}
