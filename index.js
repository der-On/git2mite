var home = require('home');
var mite = require('mite-api');
var gitlab = require('node-gitlab');
var async = require('async');

var pkg = require('./package.json');
var configPath = home.resolve('~/.gitlab2mite/config.json');

try {
  var config = require(configPath);
}
catch (err) {
  if (!config) {
    throw new Error('Configuration file ' + configPath + ' does not exist or is unreadable.');
  }
}

// accept any ssl certificates
if (config.acceptCerts) process.env.NODE_TLS_REJECT_UNAUTHORIZED = '0';

config.mite.applicationName = pkg.name + 'v' + pkg.version + '(' + pkg.author + ')';

var miteClient = mite(config.mite);
var gitlabClient = gitlab.create(config.gitlab);

function getProjectByPath(projectPath, callback)
{
  gitlabClient.projects.list({per_page: 1000}, onProjectsLoaded);

  function onProjectsLoaded(err, projects)
  {
    if (err) {
      callback(err);
      return;
    }

    if (projects) {
      var i = 0;
      while(i < projects.length) {
        if (projects[i].path_with_namespace === projectPath) {
          callback(null, projects[i]);
          return;
        }
        i++;
      }
    }

    callback(new Error('Project not found.'));
  }
}
module.exports.getProjectByPath = getProjectByPath;

function syncServicesWithProjectIssues(projectId, callback)
{
  var services, issues, project;
  var servicesToCreate = [];
  var servicesToUpdate = [];

  gitlabClient.projects.get({ id: projectId }, onProjectLoaded);

  function onProjectLoaded(err, _project)
  {
    if (err) {
      callback(err);
      return;
    }

    if (!_project) {
      callback(new Error('Project not found.'));
      return;
    }

    project = _project;

    async.parallel([
      gitlabClient.issues.list.bind(gitlabClient.issues, {
        id: projectId,
        per_page: 1000,
        state: 'opened'
      }),
      gitlabClient.issues.list.bind(gitlabClient.issues, {
        id: projectId,
        per_page: 1000,
        state: 'closed'
      }),
      miteClient.getServices.bind(miteClient, {
        limit: 1000
      }),
      miteClient.getArchivedServices.bind(miteClient, {
        limit: 1000
      })
    ], onLoaded);
  }

  function onLoaded(err, results)
  {
    if (err) {
      callback(err);
      return;
    }

    issues = results[0].concat(results[1]);
    services = results[2].concat(results[3]);

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

    async.series([
      async.mapSeries.bind(async, servicesToCreate, function(service, cb) {
        console.log('creating service: ' + service.name);
        if (process.env.dry) {
          cb(null)
        }
        else {
          miteClient.addService(service, cb);
        }
      }),
      async.mapSeries.bind(async, servicesToUpdate, function(service, cb) {
        console.log('updating service: ' + service.name);
        if (process.env.dry) {
          cb(null);
        }
        else {
          miteClient.updateService(service.id, service, cb);
        }
      })
    ], callback);
  }

  function getServiceForIssue(issue)
  {
    var i = 0;
    var service;
    while (i < services.length) {
      service = services[i];
      if (service.service.name.indexOf(project.name) !== -1 &&
          service.service.name.indexOf('#' + issue.iid + ' ') !== -1) {
        return service.service;
      }
      i++;
    }

    return null;
  }

  function getServiceNameFromIssue(issue)
  {
    return project.name_with_namespace + ': #' + issue.iid + ' ' + issue.title;
  }
}
module.exports.syncServicesWithProjectIssues = syncServicesWithProjectIssues;
