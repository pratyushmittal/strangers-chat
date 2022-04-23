/* global Alpine, Peer */

(function() {
	function setupAlpine () {
		Alpine.store('me', {
			name: '',
			status: ''
		})
		Alpine.store('messages', [])
		Alpine.store('them', false)
		Alpine.store('room', {
			id: null,
			conn: null,
		})
		console.log('Alpine ready')
	}

	function sendMessage ($store, text) {
		var message = {
			from: $store.me,
			text: text,
			timestamp: Date.now(),
		}
		$store.room.conn.send(message)
		$store.messages.push(message)
	}

	function receiveMessage ($store, message) {
		$store.messages.push(message)
	}

	function hostRoom ($store) {
		var roomID = 'host-yaari'
		var peer = new Peer(roomID)

		peer.on('open', function (id) {
      console.log('registered as peer', id)
			console.log('others can connect on it now', id)
			$store.room.id = id
		})
		peer.on('error', function (err) {
			if (err.type === 'unavailable-id') {
				console.log('id unavailable, joining as a client')
				return joinRoom($store, roomID)
			}
		})

		peer.on('connection', function(conn) {
			console.log('received connection', conn)
			$store.room.conn = conn
			// handle messages received from peer
			conn.on('data', function(data) {
				receiveMessage($store, data)
			})
		})
	}

	function joinRoom ($store, roomID) {
		var peer = new Peer()
		peer.on('open', function () {
			var conn = peer.connect(roomID)

			// on open will be launch when you successfully connect to PeerServer
			conn.on('open', function() {
				console.log('room opened')
				$store.room.id = roomID
				$store.room.conn = conn
				sendMessage($store, 'joined')
			})

			// handle messages received from peer
			conn.on('data', function(data) {
				receiveMessage($store, data)
			})
		})
	}

	function setupEverything () {
		console.log('setupEverything')
		document.addEventListener('alpine:init', setupAlpine)
		window.ChatActions = {
			hostRoom: hostRoom,
			joinRoom: joinRoom,
			sendMessage: sendMessage,
		}
	}
	setupEverything()
})()