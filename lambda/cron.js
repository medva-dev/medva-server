const timedoctor = require('./helpers/timedoctor');

(async () => {
  try {
    await timedoctor.saveAllUsers();
    await timedoctor.saveAllUsers(null, 0, true);
    await timedoctor.saveAllTags();
    await timedoctor.saveAllProjects();
    await timedoctor.saveAllProjects(null, 0, true);
    await timedoctor.saveAllTasks();
    await timedoctor.saveAllTasks(null, 0, true);
    await timedoctor.saveAllWorklogs();
    await timedoctor.worklogsToTimesheet();
    await timedoctor.generateInvoice();
    process.exit();
  } catch (e) {
    console.log(e);
    console.log(e.message);
  }
})();
