{
  "username": "githubuser",
  "password": "githubtoken",
  "url": "http://example.com:5000",
  "port": 5000,
  "secret": "randomWebHookSecret",
  "repositories": {
    "repoowner/reponame": {
      "hooks": {
        "issues": ["log", "jira"],
        "issue_comment": ["log", "jira"],
        "pull_request": ["log", "base-branch-label", "jira", "toxic"]
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