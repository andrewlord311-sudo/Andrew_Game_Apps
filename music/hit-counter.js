// Counts this page load (one number against the game's file name, nothing else) so Andrew can see how often each game is opened.
// No cookies, no ids, and no IP address is kept (see youtube-stats/game-hits-worker). Not counted on Andrew's own devices:
// open any game once with ?nocount=1 (?nocount=0 turns counting back on). Not counted when testing locally.
(function () {
  try {
    var q = new URLSearchParams(location.search);
    if (q.get('nocount') === '1') localStorage.setItem('tga_no_count', '1');
    else if (q.get('nocount') === '0') localStorage.removeItem('tga_no_count');
    if (localStorage.getItem('tga_no_count') === '1') return;
    if (location.hostname !== 'andrewlord311-sudo.github.io') return;
    var g = (location.pathname.split('/').pop() || 'index').replace(/\.html$/, '').replace(/[^a-z0-9_]/gi, '').toLowerCase().slice(0, 32);
    if (g.length < 2) return;
    var v = sessionStorage.getItem('tga_seen') ? '0' : '1';
    sessionStorage.setItem('tga_seen', '1');
    var u = 'https://nuggets-hits.laura-work1306.workers.dev/hit?g=' + g + '&v=' + v;
    if (navigator.sendBeacon) navigator.sendBeacon(u);
    else fetch(u, { method: 'POST', mode: 'no-cors', keepalive: true });
  } catch (e) { /* counting must never break a game */ }
})();
