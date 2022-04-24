/* global Alpine, Peer */

(function() {
  function setupAlpine () {
    Alpine.store('me', {
      name: ''
    })
    Alpine.store('messages', [])
    Alpine.store('conn', false)
    Alpine.store('status', 'AlpineJS ready.')
    console.log('Alpine ready')
  }

  function sendMessage ($store, text, isStatus) {
    // send message
    var data = {}
    var msgType = isStatus ? 'status' : 'text'
    data[msgType] = text
    $store.conn.send(data)

    // add to own messages
    var message = {
      from: isStatus ? {system: true} : {me: true},
      text: text,
      timestamp: Date.now(),
    }
    $store.messages.push(message)
  }
  
  function receiveMessage ($store, data) {
    var message = {
      from: data.status ? {system: true} : {peer: true},
      text: data.text || data.status,
      timestamp: Date.now()
    }
    $store.messages.push(message)
  }
  
  function hostPrivateConn ($store, tempPeer, tempConn) {
    // create new peer connection
    var peer = new Peer()
    peer.on('open', function () {
      $store.status = 'Waiting for handshake on private line'
      // share new connection id on old connection
      tempConn.send({privateID: peer.id})
    })
    
    peer.on('connection', function(conn) {
      conn.on('open', function() {
        $store.conn = conn
        sendMessage($store, $store.me.name + ' joined', true)
      })
      
      // handle messages received from peer
      conn.on('data', function(data) {
        receiveMessage($store, data)
      })
      
      // free-up old connection
      tempPeer.destroy()
    })
  }
  
  function hostCommonRoom ($store) {
    $store.status = 'Hosting room...'
    var roomID = 'host-common-room'
    var peer = new Peer(roomID)
    
    peer.on('open', function () {
      $store.status = 'Waiting for someone to join...'
    })
    peer.on('error', function (err) {
      if (err.type === 'unavailable-id') {
        $store.status = 'Common room already hosted. Joining it.'
        return joinCommonRoom($store, roomID)
      }
    })
    
    peer.on('connection', function(conn) {
      $store.status = 'Found someone. Creating a new private line.'
      hostPrivateConn($store, peer, conn)
    })
  }
  
  function joinPrivateLine ($store, peer, privateID) {
    $store.status = 'Joining private line...'
    var conn = peer.connect(privateID)
    
    conn.on('open', function() {
      $store.conn = conn
      sendMessage($store, $store.me.name + ' joined', true)
    })
    
    // handle messages received from peer
    conn.on('data', function(data) {
      receiveMessage($store, data)
    })
  }
  
  function joinCommonRoom ($store, roomID) {
    $store.status = 'Creating connection to system...'
    var peer = new Peer()
    peer.on('open', function () {
      $store.status = 'Joining common room...'
      var conn = peer.connect(roomID)
      
      // on open will be launch when you successfully connect to PeerServer
      conn.on('open', function() {
        $store.status = 'Found someone. Waiting for private line...'
      })
      
      // handle messages received from peer
      conn.on('data', function(data) {
        joinPrivateLine($store, peer, data.privateID)
      })
    })
  }
  
  function findRoom ($store) {
    hostCommonRoom($store)
  }

  function resetHeight (textarea) {
    textarea.style.height = textarea.scrollHeight + 'px'
  }
  
  function setupEverything () {
    document.addEventListener('alpine:init', setupAlpine)
    window.ChatActions = {
      sendMessage: sendMessage,
      findRoom: findRoom,
      resetHeight: resetHeight,
    }
  }
  setupEverything()
})()