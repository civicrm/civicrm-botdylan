{
  "username": "githubuser",
  "password": "githubtoken",
  "url": "http://example.com:5000",
  "port": 5000,
  "repositories": {
    "repoowner/reponame": {
      "hooks": {
        "issues": ["log"],
        "issue_comment": ["log"],
        "pull_request": ["log", "jira", "toxic"]
      }
    }
  },
  "jira": {
    "url": "https://jira.example.com",
    "username": "jirauser",
    "password": "jirapass",
    "projects": ["CRM", "HR", "INFRA", "VOL"]
  },
  "git-pool": "/var/cache/git-pool"
}