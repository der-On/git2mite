var api = require('./index');

// include flags in process.env
process.argv.forEach(function (arg) {
  if (arg.indexOf('--') === 0) {
    process.env[arg.substr(2).split('=')[0]] = arg.split('=', 2)[1] || true;
  }
});

function isNumeric(idOrString)
{
  return (typeof idOrString === 'number' || NaN === parseInt(idOrString));
}

function sync(api, projectPath) {
  if (!projectPath) fail('Missing project path');

  api.getProjectByPath(projectPath)
    .catch(function (err) {
      console.error(err);
      if (process.env.trace) console.log(err.stack);
      fail('Cannot resolve project path.');
    })
    .then(function (project) {
      if (!project) fail('Project not found.');

      return api.syncServicesWithProjectIssues(project);
    })
    .catch(function (err) {
      console.error(err);
      if (process.env.trace) console.log(err.stack);
      fail('Something went wrong');
    })
    .then(function () {
      console.log('Syncing done.');
      complete();
    });
}

desc('Syncs GitLab project issues with your mite services. Usage jake sync-gitlab[project_path]');
task('sync-gitlab', {async: true}, function(projectPath) {
  sync(api.gitlab, projectPath);
});

desc('Syncs GitHub project issues with your mite services. Usage jake sync-github[project_path]');
task('sync-github', {async: true}, function(projectPath) {
  sync(api.github, projectPath);
});
