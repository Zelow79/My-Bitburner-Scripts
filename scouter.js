import { getAllServers, hmsms, format, formatGB, formatPercent, bar, tem } from "ze-lib.js";
/** @param {NS} ns */
export async function main(ns) {
	ns.clearLog(); ns.disableLog("ALL"); //ns.enableLog("sleep");
	const targets = getAllServers(ns),
		getInput = ns.args[0] ?? await ns.prompt("Select Server", { type: "select", choices: targets }),
		[sleepTime, width, height] = [200, 300, 460]; ns.tail();
	ns.setTitle(tem(`🕵Scouter:"${getInput}"`, { "font-family": 'Brush Script MT, cursive' }));
	while (true) {
		ns.resizeTail(width, height);
		const serverStats = ns.getServer(getInput),
			progress = serverStats.moneyAvailable / serverStats.moneyMax,
			freeRam = serverStats.maxRam - serverStats.ramUsed,
			rProgress = freeRam / serverStats.maxRam, portOpenIcon = "#";
		let [sshPort, ftpPort, smtpPort, httpPort, sqlPort] = [
			serverStats.sshPortOpen ? portOpenIcon : " ",
			serverStats.ftpPortOpen ? portOpenIcon : " ",
			serverStats.smtpPortOpen ? portOpenIcon : " ",
			serverStats.httpPortOpen ? portOpenIcon : " ",
			serverStats.sqlPortOpen ? portOpenIcon : " "
		]
		ns.clearLog();
		ns.print("Server Name:      " + serverStats.hostname.slice(0, 22));
		ns.print("IP Adress:        " + serverStats.ip);
		ns.print("Admin Rights:     " + serverStats.hasAdminRights);
		ns.print("Owned by Player:  " + serverStats.purchasedByPlayer);
		ns.print("Backdoor Open:    " + serverStats.backdoorInstalled);
		ns.print("Base Security:    " + format(serverStats.baseDifficulty));
		ns.print("Min Security:     " + format(serverStats.minDifficulty));
		ns.print("Security:         " + format(serverStats.hackDifficulty));
		if (serverStats.minDifficulty > 0)
			ns.print(`Hack Time:        ${hmsms(ns.getHackTime(getInput))}`);
		ns.print("Required Ports:   " + format(serverStats.numOpenPortsRequired));
		ns.print("Req Hack Skill:   " + format(serverStats.requiredHackingSkill));
		ns.print("Max Money:        $" + format(serverStats.moneyMax));
		if (serverStats.moneyMax > 0) {
			ns.print("Current Money:    $" + format(serverStats.moneyAvailable));
			ns.print("Money Progress Bar");
			ns.print(bar(progress, "⚡", 33) + "|" + formatPercent(progress, 0));
		}
		ns.print("Max Ram:          " + formatGB(serverStats.maxRam * 2 ** 30));
		if (serverStats.maxRam > 0) {
			ns.print("Used Ram:         " + formatGB(serverStats.ramUsed * 2 ** 30));
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