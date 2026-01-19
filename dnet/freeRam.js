/** @param {NS} ns */
export async function main(ns) {
  ns.print(await ns.dnet.memoryReallocation(ns.args[0]));
}