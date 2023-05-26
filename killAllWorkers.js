import { getAllServers, format } from "ze-lib";
/** @param {NS} ns */
export async function main(ns) {
	const workers = ["share.js", "hackerBot.js", "charge_marked.js"]; let killcount = 0; ns.disableLog('scan'); ns.tail();
	getAllServers(ns).forEach(server => ns.ps(server).forEach(script => workers.includes(script.filename) && ns.kill(script.pid) ? killcount++ : null));
	ns.print(format(killcount) + " scripts killed.");
}