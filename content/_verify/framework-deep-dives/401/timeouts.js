// Node's own HTTP timeouts, read off a real server object rather than quoted.
//
// Lesson 401 is about connections that are supposed to stay open for a long
// time. Node ships four timeouts that decide how long "open" is allowed to
// last, and three of them are set to values nobody chose for a streaming
// endpoint. This prints them from the runtime that will actually enforce
// them, so the lesson's table is a measurement rather than a citation --
// the same argument content/_verify/database-advanced/42 makes for
// PostgreSQL, applied to a stack that can also be interrogated.
//
// Nothing here opens a port. The server object is constructed, its fields are
// read, and it is closed; there is no listen(), no socket and no network.
//
// Determinism: every value below is a constant in Node's own source. The Node
// version is deliberately NOT printed -- if a future release changes one of
// these, this proof should go red and the lesson should be corrected, rather
// than the output shifting every time CI updates its runtime.
const http = require('node:http');

const server = http.createServer();
const agent = new http.Agent();

const ms = (value) => (value === 0 ? '0 (no limit)' : `${value} ms`);

console.log('$ node -e "read the defaults off http.createServer()"');
console.log('');
console.log('inbound — what the server enforces on a connection it accepts:');
console.log(`  server.keepAliveTimeout      ${ms(server.keepAliveTimeout)}`);
console.log(`  server.headersTimeout        ${ms(server.headersTimeout)}`);
console.log(`  server.requestTimeout        ${ms(server.requestTimeout)}`);
console.log(`  server.timeout               ${ms(server.timeout)}`);
console.log(`  server.maxRequestsPerSocket  ${server.maxRequestsPerSocket === 0 ? '0 (unlimited)' : server.maxRequestsPerSocket}`);
console.log('');
console.log('outbound — and here the two agents disagree:');
console.log(`  http.globalAgent.keepAlive   ${http.globalAgent.keepAlive}`);
console.log(`  new http.Agent().keepAlive   ${agent.keepAlive}`);
console.log(`  http.globalAgent.maxSockets  ${http.globalAgent.maxSockets}`);
console.log(`  new http.Agent().maxSockets  ${agent.maxSockets}`);
console.log('');
console.log('That pair is worth staring at. A request with no agent uses the global one and');
console.log(`reuses connections (keepAlive ${http.globalAgent.keepAlive}). The moment you construct an agent -- which is`);
console.log('what you do to cap maxSockets, the usual reason -- you get a fresh one whose');
console.log(`keepAlive is ${agent.keepAlive}, and connection reuse is silently gone. The change that was`);
console.log('meant to bound concurrency has also added a TCP and TLS handshake per request.');
console.log('');
console.log(`requestTimeout is ${server.requestTimeout / 1000} seconds, and it applies to the whole request.`);
console.log('A server-sent-events response is a request that has not finished, so a stream');
console.log('left open past that limit is destroyed by the runtime -- not by the proxy, not');
console.log('by the client, and with nothing in the application code to point at.');
console.log('');
console.log(`keepAliveTimeout is ${server.keepAliveTimeout / 1000} seconds, which is the other half of the classic 502.`);
console.log('If whatever sits in front of this server holds idle connections longer than');
console.log('Node does, Node closes a socket the proxy still believes it can reuse, and the');
console.log('next request on it fails at the proxy rather than here.');

server.close();
agent.destroy();
