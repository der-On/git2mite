# Gitlab 2 mite

Sync your Issues from a gitlab project to your mite account.

## Installation

```bash
$ npm install gitlab2mite
```

create a config.json under ~/.gitlab2mite/config.json

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
  "acceptCerts": false
}
```

## Usage

### on the CLI

```bash
$ gitlab2mite sync[project-path-with-namespace]
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
