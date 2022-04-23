/* global Alpine, Peer */

(function() {
  function setupAlpine () {
    Alpine.store('me', {
      name: '',
      status: ''
    })
    Alpine.store('messages', [])
    Alpine.store('them', false)
    Alpine.store('conn', false)
    Alpine.store('status', 'AlpineJS ready.')
    console.log('Alpine ready')
  }
  
  function sendSystemMessage (conn, data) {
    conn.send({
      type: 'system',
      data: data
    })
  }
  
  function sendMessage ($store, text) {
    var message = {
      from: $store.me,
      text: text,
      timestamp: Date.now(),
    }
    $store.conn.send(message)
    $store.messages.push(message)
  }
  
  function receiveMessage ($store, message) {
    $store.messages.push(message)
  }
  
  function hostPrivateConn ($store, tempPeer, tempConn) {
    // create new peer connection
    var peer = new Peer()
    peer.on('open', function () {
      $store.status = 'Waiting for handshake on private line'
      // share new connection id on old connection
      var message = {id: peer.id}
      sendSystemMessage(tempConn, message)
    })
    
    peer.on('connection', function(conn) {
      $store.status = 'Connected to private line'
      $store.conn = conn
      sendMessage($store, 'joined')
      
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
        $store.status = 'Already hosted. Joining them.'
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
      $store.status = 'Private line established.'
      $store.conn = conn
      sendMessage($store, 'joined')
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
        joinPrivateLine($store, peer, data.data.id)
      })
    })
  }
  
  function findRoom ($store) {
    hostCommonRoom($store)
  }
  
  function setupEverything () {
    console.log('setupEverything')
    document.addEventListener('alpine:init', setupAlpine)
    window.ChatActions = {
      sendMessage: sendMessage,
      findRoom: findRoom,
    }
  }
  setupEverything()
})()