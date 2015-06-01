# Gitlab 2 mite

Sync your Issues from a gitlab project to your mite account.

## Installation

```bash
$ npm install git2mite
```

create a config.json under ~/.git2mite/config.json

```json
{
  "mite": {
    "account": "account",
    "apiKey": "apiKey"
  },
  "gitlab": {
    "api": "https://gitlab.com/api/v3",
    "privateToken": "your private token"
  },
  "github": {
    "privateToken": "a personal access token"
  }
}
  "acceptCerts": false
}
```

## Usage

### on the CLI

**GitLab**

```bash
$ git2mite sync-gitlab[project-path-with-namespace]
```

**GitHub**

```bash
$ git2mite sync-github[project-path-with-namespace]
```


### or programatically

```javascript
var g2m = require('git2mite');

g2m.gitlab.getProjectByPath('namespace/project', function(err, project) {
  if (!err) {
    g2m.gitlab.syncServicesWithProjectIssues(project, function(err) {
      if (!err) {
        console.log('Syncing done!');
      }
    });
  }
});

g2m.github.getProjectByPath('namespace/project', function(err, project) {
  if (!err) {
    g2m.github.syncServicesWithProjectIssues(project function(err) {
      if (!err) {
        console.log('Syncing done!');
      }
    });
  }
});
```
