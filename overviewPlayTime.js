import { dhms } from "ze-lib.js"
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
    hook1.innerText = `(dd:hh:mm:ss)\n${dhms(lastAug)}\n${dhms(lastBitnode)}\n${dhms(totalPlaytime)}`
    await ns.sleep(1000);
  }
}