var JiraClient = require('jira-connector');

var user = process.argv[2];
var pass = process.argv[3];

var jira = new JiraClient( {
  host: 'toryburch.atlassian.net',
  basic_auth: {
    username: user,
    password: pass
  }
});

var getWorkLog = (issue) => {
  return new Promise((resolve, reject) => {
    jira.issue.getWorkLogs({
      issueKey: issue.key
    }, (err, res) => {
      if(err) {
        reject(err);
      } else {
        resolve(res)
      }
    })
  });
};

console.log('Reading worklogs for user ' + user + ' in active CCD sprint');

jira.search.search({
  jql: "filter='CCD: Current Sprint Scope'"
}, (err, res)=>{
  if(err) {
    console.log(err);
  } else {
    Promise.all(res.issues.map(getWorkLog)).then(
      (worklogs) => {
        worklogs.map((issueWorklog, index) => {
          var key = res.issues[index].key;
          return issueWorklog.worklogs.filter((logEntry) => logEntry.author.name === user)
            .map((entry) => {
              return {
                date: new Date(entry.created),
                timeSpent: entry.timeSpent,
                comment: entry.comment,
                key
              }
            })
        }).reduce((acc, arr) => [...acc, ...arr], [])
          .sort((a, b) => a.date.getTime()-b.date.getTime())
          .forEach(entry=> console.log(entry.key, entry.timeSpent, entry.comment, entry.date))
      }).catch(console.log);
  }
});
