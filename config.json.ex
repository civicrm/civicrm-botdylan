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
    "projects": {
      "CRM": "https://issues.civicrm.org/jira",
      "HR": "https://issues.civicrm.org/jira",
      "INFRA": "https://issues.civicrm.org/jira",
      "VOL": "https://issues.civicrm.org/jira"
    }
  },
  "git-pool": "/var/cache/git-pool"
}