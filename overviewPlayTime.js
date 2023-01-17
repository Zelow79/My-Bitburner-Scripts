export async function main(ns) {
  ns.clearLog(); ns.disableLog("sleep");
  const doc = eval('document');
  let hook0 = doc.getElementById('overview-extra-hook-0');
  let hook1 = doc.getElementById('overview-extra-hook-1');
  ns.atExit(() => {
    hook0.innerText = ""
    hook1.innerText = ""
  });
  while (1) {
    const player = ns.getPlayer();
    const totalPlaytime = player.totalPlaytime
    const lastBitnode = player.playtimeSinceLastBitnode
    const lastAug = player.playtimeSinceLastAug
    hook0.innerText = `Time Played\nSince Aug. install:\nSince BN clear:\nTotal:`
    hook1.innerText = `(dd:hh:mm:ss)\n${dhm(lastAug)}\n${dhm(lastBitnode)}\n${dhm(totalPlaytime)}`
    await ns.sleep(1000);
  }
}

function dhm(t) {
  var cd = 24 * 60 * 60 * 1000,
    ch = 60 * 60 * 1000,
    cm = 60 * 1000,
    d = Math.floor(t / cd),
    h = Math.floor((t - d * cd) / ch),
    m = Math.floor((t - d * cd - h * ch) / cm),
    s = Math.round((t - d * cd - h * ch - m * cm) / 1000),
    pad = function (n) { return n < 10 ? '0' + n : n; };
  if (s === 60) {
    m++;
    s = 0;
  }
  if (m === 60) {
    h++;
    m = 0;
  }
  if (h === 24) {
    d++;
    h = 0;
  }
  return [d, pad(h), pad(m), pad(s)].join(':');
}