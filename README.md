# Gitlab 2 mite

Sync your Issues from a gitlab project to your mite account.

## Installation

```bash
$ npm install gitlab2mite
$ npm install jake -g
```

## Usage

### on the CLI (using jake task runner)

```bash
$ cd gitlab2mite/
$ jake sync[project-path-with-namespace]
```

### or programatically

```javascript
var g2m = require('gitlab2mite');

g2m.getProjectByPath('namespace/project', function(err, project) {
  if (!err) {
    g2m.syncServicesWithProjectIssues(project.id, function(err) {
      if (!err) {
        console.log('Syncing done!');
      }
    });
  }
});
```
