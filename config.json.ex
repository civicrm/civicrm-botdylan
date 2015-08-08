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
  "git-pool": "/var/cache/git-pool"
}