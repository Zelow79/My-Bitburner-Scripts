import { spread, loot, scrape } from "dnet/controller.js";
/** @param {NS} ns */
export async function main(ns) {
  const timeStamps = {};
  while (1) {
    scrape(ns);
    spread(ns, timeStamps);
    loot(ns); //WIP
    await ns.sleep(1000);
  }
}