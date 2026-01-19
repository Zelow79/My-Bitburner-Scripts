/** @param {NS} ns */
export async function main(ns) {
  for (const file of ns.args) ns.dnet.openCache(file);
}