import axios from 'axios'


/**
 * Fetch a JSON document.
 * 
 * @param {string} url - URL to fetch
 * @param {string} method - 'get', 'post'
 * @param {string} type - 'text' and 'json' are supported
 * @param {Object} obj - request body. This is converted to JSON.
 * @param {string} authToken - JWT authentication token
 * @param {function} success - function(response) called on success
 * @param {function} error - function(message) called on error
 */

function fetchData(url, method, type, obj, authToken, success, error) {
  if (error == undefined) {
    alert(url + ": error handler must be specified")
    return
  }

  if (authToken === undefined) {
    console.log("Error: auth token missing.")
    return
  }

  if (method === undefined)
    method = 'get'

  const opts = {
    method: method,
    headers: {
      'Pragma': 'no-cache',
      'Cache-Control': 'no-cache'
    }
  }

  if (type == 'json') {
    opts.headers["Accept"] = 'application/json'
    opts.headers["Content-Type"] = 'application/json'
  }

  if (obj !== undefined && obj !== null) {
    opts.body = JSON.stringify(obj)
  }

  if (authToken !== undefined)
    opts.headers.Authorization = 'Bearer ' + authToken

  const pr = fetch(url, opts)

  pr.then(function (rs) {
    if (rs.status != 200) {
      rs.json().then(function (msg) {
        if (msg === "")
          msg = rs.statusText
        error(msg, rs.statusText)
      }).catch(function (err) {
        console.log("Error: ", err)
        if (error)
          error(err)
      })
    } else {
      rs[type]().then(function (data) {
        //rs.text().then(function (data) {
        if (success)
          success(data)
      })
    }
  })

  pr.catch(function (err) {
    console.log("Error: ", err)
    if (error)
      error(err)
  })
}

/**
 * Logins to the server.
 * 
 * @param {string} username  - username to login with
 * @param {string} password - password to login with
 * @param {function} success - function(response) called on success
 * @param {function} error - function(message) called on error
 */
function login(username, password, success, error) {
  fetchData('/user/login', 'post', 'json', {
    "Username": username,
    "Password": password
  }, "", success, error)
}


/**
 * Query information about a single node.
 *
 * @param {string} id - ID of the node
 * @param {string} authToken - JWT authentication token
 * @param {function} success - function(node) called on success
 * @param {function} error - function(message) called on error
 */
function queryNode(id, authToken, success, error) {
  fetchData('/node/info/' + id, 'get', 'json', null,
    authToken,
    (r) => {
      if (r === null)
        error("Failed to fetch node information")
      else {
        success(r)
      }
    }, error)
}


/**
 * List nodes in a directory.
 * @param {string} id - ID of the directory to list
 * @param {string} authToken - JWT authentication token
 * @param {function} success - function(api.ListDirReponse) called on success
 * @param {function} error - function(message) called on error
 */
function listDir(id, authToken, success, error) {
  fetchData('/node/ls', 'post', 'json', id,
    authToken,
    (r) => {
      if (r === null)
        error("Failed to fetch directory listing")
      else {
        if (r.Children === null)
          r.Children = []
        success(r)
      }
    }, error)
}


/**
 * Copies a node.
 *
 * @param {Node} node - the node to copy
 * @param {Node} dest - the destination node
 * @param {string} authToken - JWT authentication token
 * @param {function} success - function to call on success
 * @param {function} error - function(message) called on error
 */
function copyNode(node, dest, authToken, success, error) {
  fetchData('/node/copy', 'post', 'json', {
    SourceID: node.id,
    DestID: dest.id,
    NewName: node.name,
    Recursive: true
  }, authToken, success, error)
}

/**
 * Moves a node.
 *
 * @param {Node} node - the node to move
 * @param {Node} dest - the destination node
 * @param {string} authToken - JWT authentication token
 * @param {function} success - function to call on success
 * @param {function} error - function(message) called on error
 */
function moveNode(node, dest, authToken, success, error) {
  fetchData('/node/move', 'post', 'json', {
    SourceID: node.id,
    DestID: dest.id
  }, authToken, success, error)
}


/**
 * Renames a node (a directory or a file).
 *
 * @param {int} nodeID - ID of the node to delete
 * @param {string} name - a new name for the node
 * @param {string} authToken - JWT authentication token
 * @param {function} success - function to call on success
 * @param {function} error - function(message) called on error
 */
function renameNode(nodeID, name, authToken, success, error) {
  fetchData('/node/rename', 'post', 'json', {
    ID: nodeID,
    NewName: name,
  }, authToken, success, error)
}


/**
 * Delete an node (a directory or a file).
 *
 * @param {int} nodeID - ID of the node to delete
 * @param {string} authToken - JWT authentication token
 * @param {function} success - function to call on success
 * @param {function} error - function(message) called on error
 */
function deleteNode(nodeID, authToken, success, error) {
  fetchData('/node/delete', 'post', 'json', {
    ID: nodeID,
    Recursive: true
  }, authToken, success, error)
}


/**
 * Creates a new directory.
 *
 * @param {int} parentID - ID of the node in where to create the directory
 * @param {string}} name - name of the directory to create
 * @param {string} authToken - JWT authentication token
 * @param {function} success - function to call on success
 * @param {function} error - function(message) called on error
 */
function makeDir(parentID, name, authToken, success, error) {
  fetchData('/node/mkdir', 'post', 'json', {
    ParentID: parentID,
    Name: name
  }, authToken, success, error)
}

/**
 * Searches for nodes in the database.
 * 
 * @param {string) text - the search text
 * @param {*} authToken 
 * @param {*} success 
 * @param {*} error 
 */
function searchNodes(text, authToken, success, error) {
  fetchData('/node/search', 'post', 'json', {
    Text: text
  }, authToken, success, error)
}

/**
 * Creates or updates user-specific metadata on a node.
 * 
 * @param {int} nodeID - ID of the node
 * @param {type} type - metadata type
 * @param {object} meta - metadata
 * @param {string} authToken - JWT authentication token
 * @param {function} success - function to call on success
 * @param {function} error - function(message) called on error
 */
function updateMeta(nodeID, type, metadata, authToken, success, error) {
  fetchData('/meta/update', 'post', 'json',
    {
      NodeID: nodeID,
      Type: type,
      Data: metadata
    }, authToken, success, error)
}

/**
 * Changes password of a user.
 *
 * @param {string} username - name of the user
 * @param {string} oldPassword - old password
 * @param {string} newPassword - new password
 * @param {string} authToken - JWT authentication token
 * @param {function} success - function to call on success
 * @param {function} error - function(message) called on error
 */
function setPassword(username, oldPassword, newPassword, authToken, success, error) {
  fetchData('/user/setpassword', 'post', 'json', {
    Username: username,
    OldPassword: oldPassword,
    NewPassword: newPassword
  }, authToken, success, error)
}

/**
 * Queries all settings pertinent to the currect user.
 * 
 * @param {string} authToken - JWT authentication token
 * @param {function} success - function(settings : Object) to call on success
 * @param {function} error - function(message) called on error
 */
function querySettings(authToken, success, error) {
  fetchData('/user/settings', 'post', 'json', null, authToken, success, error)
}

/**
 * runNamedCommand a named command on the server.
 * 
 * @param {Command} command - the command to execute
 * @param {Node} node - the target node
 * @param {string} authToken - JWT authentication token
 * @param {function} success - function()) to call on success
 * @param {function} error - function(message) called on error
 */
function runNamedCommand(command, node, authToken, success, error) {
  console.log("command:", command.ID, "node:", node.id)
  fetchData('/cmd/run', 'post', 'json', {
    CommandID: command.ID,
    NodeID: node.id
  }, authToken, success, error)
}

/**
 * Uploader for files. Uses axios for now.
 * 
 * @param {string} props.url - upload url
 * @param {Node} props.parentID - optional ID of the target directory
 * @param {string} props.authToken - authentication token
 * @param {function(progress))} props.progress - progerss handler
 * @param {function(Node)} props.done - file done handler, called after uploading one file
 * @param {function(err)} props.error - error handler
 */
class Uploader {
  constructor(props) {
    this.props = props || {}
    this.axios = axios.default
  }

  upload(file, { filename, nodeID }) {
    let fd = new FormData()
    fd.append("file", file)

    if (this.props.parentID !== null)
      fd.append("parentID", this.props.parentID)

    if (filename !== undefined)
      fd.append("filename", filename)
    if (nodeID !== undefined)
      fd.append("nodeID", nodeID)

    return axios.post(this.props.url, fd, {
      headers: {
        "Content-Type": "multipart/form-data",
        "Authorization": "Bearer " + this.props.authToken,
      },
      onUploadProgress: (p) => {
        if (this.props.progress)
          this.props.progress(p)
      }
    }).then((r) => {
      this.props.done(r.data[0])
    }).catch((err) => {
      console.log("Error:", err)
      if (this.props.error)
        this.props.error(err)
    })
  }
}

// The public API
const api = {
  fetchData: fetchData,

  copyNode: copyNode,
  deleteNode: deleteNode,
  runNamedCommand: runNamedCommand,
  listDir: listDir,
  login: login,
  makeDir: makeDir,
  moveNode: moveNode,
  queryNode: queryNode,
  querySettings: querySettings,
  renameNode: renameNode,
  searchNodes: searchNodes,
  setPassword: setPassword,
  updateMeta: updateMeta,
  Uploader: Uploader
}

export default api
