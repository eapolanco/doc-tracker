This directory stores your SSL certificates for TLS support.

Setup:
1. In your backend `.env` file, set `TLS_ENABLED=true`.
2. That's it!

Behavior:
- If no certificates exist at the specified `SSL_KEY_PATH` and `SSL_CERT_PATH` (defaults: `certs/key.pem` and `certs/cert.pem`), the server will AUTOMATICALLY generate self-signed certificates and save them here on the first run.
- You can replace these auto-generated files with your own valid certificates if you have them.

Manual Generation (Optional):
If you prefer to generate them manually using OpenSSL:
openssl req -x509 -newkey rsa:4096 -keyout key.pem -out cert.pem -days 365 -nodes
