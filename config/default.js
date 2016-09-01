module.exports = {
  "gateway" : {
    "url_pattern" : {
      "github" : (obj) => `https://github.run/${obj.username}/${obj.repository}/blob/${obj.branch}/${obj.filename}`
    }
  }
};