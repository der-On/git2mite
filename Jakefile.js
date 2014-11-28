var api = require('./index');

function isNumeric(idOrString)
{
  return (typeof idOrString === 'number' || NaN === parseInt(idOrString));
}

desc('Syncs project issues with your mite services. Usage jake sync[project_id_or_path]');
task('sync', {async: true}, function(projectIdOrPath) {
  if (!projectIdOrPath) fail('Missing project id/path');

  if (isNumeric(projectIdOrPath)) {
    api.syncServicesWithProjectIssues(projectIdOrPath, onDone);
  }
  else {
    api.getProjectByPath(projectIdOrPath, function(err, project) {
      if (err) {
        console.error(err);
        fail('Cannot resolve project path.');
      }

      if (!project) fail('Project not found.');

      api.syncServicesWithProjectIssues(project.id, onDone);
    });
  }

  function onDone(err)
  {
    if (err) {
      console.error(err);
      fail('Something went wrong');
    }

    console.log('Syncing done.');
    complete();
  }
});
