import { getAllServers, hmsms, format, formatGB, formatPercent, bar } from "ze-lib.js";
/** @param {NS} ns */
export async function main(ns) {
	ns.clearLog(); ns.disableLog("ALL"); //ns.enableLog("sleep");
	let targets = getAllServers(ns);
	const sleepTime = 200
	let getInput = ns.args[0] ?? await ns.prompt("Select Server", { type: "select", choices: targets });
	ns.tail();
	while (true) {
		ns.resizeTail(333, 420);
		const serverStats = ns.getServer(getInput);
		const progress = serverStats.moneyAvailable / serverStats.moneyMax;
		const freeRam = serverStats.maxRam - serverStats.ramUsed
		const rProgress = freeRam / serverStats.maxRam;
		let [sshPort, ftpPort, smtpPort, httpPort, sqlPort] = [
			serverStats.sshPortOpen ? "Δ" : " ",
			serverStats.ftpPortOpen ? "Δ" : " ",
			serverStats.smtpPortOpen ? "Δ" : " ",
			serverStats.httpPortOpen ? "Δ" : " ",
			serverStats.sqlPortOpen ? "Δ" : " "
		]
		ns.clearLog();
		ns.print("Server Name:      " + serverStats.hostname.slice(0, 22));
		ns.print("IP Adress:        " + serverStats.ip);
		ns.print("Admin Rights:     " + serverStats.hasAdminRights);
		ns.print("Base Security:    " + format(serverStats.baseDifficulty));
		ns.print("Min Security:     " + format(serverStats.minDifficulty));
		ns.print("Security:         " + format(serverStats.hackDifficulty));
		ns.print(`Hack Time:        ${hmsms(ns.getHackTime(getInput))}`)
		ns.print("Required Ports:   " + format(serverStats.numOpenPortsRequired));
		ns.print("Req Hack Skill:   " + format(serverStats.requiredHackingSkill));
		ns.print("Max Money:        $" + format(serverStats.moneyMax));
		if (serverStats.moneyMax > 0) {
			ns.print("Current Money:    $" + format(serverStats.moneyAvailable));
			ns.print("Money Progress Bar");
			ns.print(bar(progress, "⚡", 33) + "|" + formatPercent(progress, 0));
		}
		ns.print("Max Ram:          " + formatGB(serverStats.maxRam * 1e9));
		if (serverStats.maxRam > 0) {
			ns.print("Used Ram:         " + formatGB(serverStats.ramUsed * 1e9));
			ns.print("Free Ram Progress Bar");
			ns.print(bar(rProgress, "⚡", 33) + "|" + formatPercent(rProgress, 0));
		}
		ns.print("╒═══════════════════════════════════════╕");
		ns.print("│              OPEN PORTS               │");
		ns.print("╞═══════╤═══════╤═══════╤═══════╤═══════╡");
		ns.print("│  SSH  │  FPT  │  SMT  │  HTT  │  SQL  │");
		ns.print("│   " + sshPort + "   │   " + ftpPort + "   │   " + smtpPort + "   │   " + httpPort + "   │   " + sqlPort + "   │");
		ns.print("╘═══════╧═══════╧═══════╧═══════╧═══════╛");
		await ns.sleep(sleepTime);
	}
}