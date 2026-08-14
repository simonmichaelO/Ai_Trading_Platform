// Bootstrap: Provide WebSocket support for Node.js 20
// This must run BEFORE any Supabase client is created
const ws = require('ws');
global.WebSocket = ws;
