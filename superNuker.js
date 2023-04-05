import { getAllServers, format } from "ze-lib"
/** @param {NS} ns */
export async function main(ns) {
	ns.clearLog(); ns.disableLog("ALL");
	getExploits(ns);
	const target = getAllServers(ns);
	//ns.tail();
	for (let i = 0; i < target.length; i++) {
		const hostname = target[i];
		if (!ns.hasRootAccess(hostname)) {
			const usedPrograms = []
			if (ns.fileExists("BruteSSH.exe", "home") && !ns.getServer(hostname).sshPortOpen) {
				ns.brutessh(hostname); usedPrograms.push("BruteSSH.exe");
			}
			if (ns.fileExists("FTPCrack.exe", "home") && !ns.getServer(hostname).ftpPortOpen) {
				ns.ftpcrack(hostname); usedPrograms.push("FTPCrack.exe");
			}
			if (ns.fileExists("relaySMTP.exe", "home") && !ns.getServer(hostname).smtpPortOpen) {
				ns.relaysmtp(hostname); usedPrograms.push("relaySMTP.exe");
			}
			if (ns.fileExists("HTTPWorm.exe", "home") && !ns.getServer(hostname).httpPortOpen) {
				ns.httpworm(hostname); usedPrograms.push("HTTPWorm.exe");
			}
			if (ns.fileExists("SQLInject.exe", "home") && !ns.getServer(hostname).sqlPortOpen) {
				ns.sqlinject(hostname); usedPrograms.push("SQLInject.exe");
			}
			if (ns.getServer(hostname).numOpenPortsRequired >= ns.getServer(hostname).openPortCount) ns.nuke(hostname);
			if (usedPrograms.length > 0) ns.print(`${usedPrograms.join(" ")} were used on: ${hostname}`);
			if (ns.hasRootAccess(hostname)) {
				ns.toast(`${hostname} -- Rooted!!`, "success", 3000); ns.print(`${hostname} -- Rooted!!`);
			}
		}
	}
}

function getExploits(ns) {
	function getProgram(program) {
		const cost = ns.singularity.getDarkwebProgramCost(program);
		if (ns.getPlayer().money > cost) {
			ns.singularity.purchaseProgram(program);
			if (cost > 0) ns.tprint(`${program} was purchased for ${format(cost)}`);
		}
	}
	if (ns.singularity.purchaseTor()) {
		getProgram("BruteSSH.exe"); getProgram("FTPCrack.exe"); getProgram("relaySMTP.exe");
		getProgram("HTTPWorm.exe"); getProgram("SQLInject.exe");
	} else {
		ns.tprint(`Not enough money to buy Tor router.`);
	}
}