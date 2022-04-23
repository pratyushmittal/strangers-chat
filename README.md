# Chat with strangers (using WebRTC and P2P)

How about something like Omegle, but without any middleman or web-servers? Can we connect to strangers using WebRTC? This is an attempt towards that.

**Anonymous Chatting Website**

Jobs to be done:
- Find someone to chat to. Get company.
- Make friends
- Have a wholesome conversation

## Development

This is a static only website which can probably run over Github.

For development, we need to start a simple HTTP server to serve the files.

```bash
python3 -m http.server
open http://localhost:8000
```