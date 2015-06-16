var config = require('./config');

config.gitlab.token = config.gitlab.privateToken || null;

var miteClient = require('./mite')(config.mite);
var gitlabClient = require('gitlab')(config.gitlab);
var utils = require('./utils');

// extend projectIssues with the all method
gitlabClient.projects.issues.all = function (projectId, params, fn) {
  var cb, data;
  if (params == null) {
    params = {};
  }
  if (fn == null) {
    fn = null;
  }
  if ('function' === typeof params) {
    fn = params;
    params = {};
  }
  this.debug("ProjectIssues::all()");
  if (params.page == null) {
    params.page = 1;
  }
  if (params.per_page == null) {
    params.per_page = 100;
  }
  data = [];
  cb = (function(_this) {
    return function(retData) {
      data = data.concat(retData);

      if (retData.length === params.per_page) {
        _this.debug("Recurse ProjectIssues::all()");
        params.page++;
        return _this.list(projectId, params, cb);
      } else {
        if (fn) {
          return fn(data);
        }
      }
    };
  })(this);
  return this.list(projectId, params, cb);
};

function getProjectByPath(projectPath)
{
  return new Promise(function (resolve, reject) {
    utils.promisifyWithoutError(gitlabClient.projects.all, gitlabClient.projects)
      .then(function onProjectsLoaded(projects)
      {
        if (projects) {
          var i = 0;
          while(i < projects.length) {
            if (projects[i].path_with_namespace === projectPath) {
              return resolve(projects[i]);
            }
            i++;
          }
        }

        reject(new Error('Project not found.'));
      });
  });
}
module.exports.getProjectByPath = getProjectByPath;

function syncServicesWithProjectIssues(project)
{
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

    Promise.series([
      utils.promisifyWithoutError(gitlabClient.projects.issues.all, gitlabClient.projects.issues, project.id, {
        state: 'opened'
      }),
      utils.promisifyWithoutError(gitlabClient.projects.issues.all, gitlabClient.projects.issues, project.id, {
        state: 'closed'
      }),
      utils.promisify(miteClient.getAllServices, miteClient),
      utils.promisify(miteClient.getAllArchivedServices, miteClient)
    ])
      .then(function (results) {
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
