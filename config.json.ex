{
  "username": "myuser",
  "password": "mytoken",
  "url": "http://example.com:5000",
  "port": 5000,
  "repositories": {
    "repoowner/reponame": {
      "hooks": {
        "issue_comment": ["base-label", "advice"],
        "push": ["base-label", "advice"]
      }
    }
  },
  "jira": {
    "url": "https://user:pass@issues.civicrm.org/jira",
    "username": "fixme",
    "password": "fixme",
    "projects": ["CRM", "HR", "INFRA", "VOL"]
  },
  "git-pool": "/var/cache/git-pool"
}