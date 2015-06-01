var config = require('./config');

config.github.version = '3.0.0';
config.github.headers = {
  'user-agent': 'git2mite'
};

var github = require('github');

var miteClient = require('./mite')(config.mite);
var githubClient = new github(config.github);
var utils = require('./utils');

function getProjectByPath(projectPath) {
  var parts = projectPath.split('/', 2);

  return new Promise(function (resolve, reject) {
    utils.promisify(githubClient.repos.get, githubClient.repos, {
      user: parts[0],
      repo: parts[1]
    })
      .then(function onProjectLoaded(project)
      {
        if (project) {
          resolve(project);
        }

        reject(new Error('Project not found.'));
      });
  });
}
module.exports.getProjectByPath = getProjectByPath;

function syncServicesWithProjectIssues(project)
{
  var parts = project.full_name.split('/', 2);

  return new Promise(function (resolve, reject) {
    var services, issues;
    var servicesToCreate = [];
    var servicesToUpdate = [];

    function getServiceForIssue(issue)
    {
      var i = 0;
      var service;
      while (i < services.length) {
        service = services[i];
        if (service.service.name.indexOf(project.name) !== -1 &&
            service.service.name.indexOf('#' + issue.number + ' ') !== -1) {
          return service.service;
        }
        i++;
      }

      return null;
    }

    function getServiceNameFromIssue(issue)
    {
      return project.full_name + ': #' + issue.number + ' ' + issue.title;
    }

    Promise.all([
      utils.promisify(githubClient.issues.repoIssues, githubClient.issues, {
        user: parts[0],
        repo: parts[1],
        state: 'all'
      }),
      utils.promisify(miteClient.getAllServices, miteClient),
      utils.promisify(miteClient.getAllArchivedServices, miteClient)
    ])
      .then(function (results) {
        issues = results[0];
        services = results[1].concat(results[2]);

        issues.forEach(function(issue, i) {
          var service = getServiceForIssue(issue);

          // service must be created
          if (!service) {
            servicesToCreate.push({
              billable: true,
              name: getServiceNameFromIssue(issue),
              archived: (issue.state === 'closed')
            });
          }
          // service exists, but might need to be archived
          else {
            var closed = (issue.state === 'closed');

            if (service.archived !== closed) {
              servicesToUpdate.push({
                id: service.id,
                name: service.name,
                archived: closed
              });
            }
          }
        });

        return Promise.series([
          Promise.series(servicesToCreate.map(function (service) {
            console.log('creating service: ' + service.name);
            if (process.env.dry) {
              return null;
            }
            else {
              return utils.promisify(miteClient.addService, miteClient, service);
            }
          })),
          Promise.series(servicesToUpdate.map(function (service) {
            console.log('updating service: ' + service.name);
            if (process.env.dry) {
              return null;
            }
            else {
              return utils.promisify(miteClient.updateService, miteClient, service.id, service);
            }
          }))
        ]);
      })
      .then(resolve)
      .catch(reject);
  });
}
module.exports.syncServicesWithProjectIssues = syncServicesWithProjectIssues;
