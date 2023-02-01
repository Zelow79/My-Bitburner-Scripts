import { hmsms, format, formatGB } from "ze-lib.js";
/** @param {NS} ns */
export async function main(ns) {
	ns.clearLog(); ns.disableLog("ALL"); //ns.enableLog("sleep");
	let targets = ["home"] // Leave this "home" used for funcion
	const sleepTime = 200
	function scanner(a) { // This function gets all the servers and puts them in the array targets
		for (let x = 0; x < a.length; x++) {
			let y = ns.scan(a[x]);
			a = Array.from(new Set(a.concat(y)));
		}
		return a;
	}
	targets = scanner(targets); // runs above scanner function
	let getInput = ns.args[0] ?? await ns.prompt("Select Server", { type: "select", choices: targets });
	ns.tail();
	while (true) {
		ns.resizeTail(275, 385);
		const serverStats = ns.getServer(getInput);
		const progress = Math.floor(serverStats.moneyAvailable / serverStats.moneyMax * 100);
		const freeRam = serverStats.maxRam - serverStats.ramUsed
		const rProgress = Math.floor(freeRam / serverStats.maxRam * 100);
		const progressBarMessage = "░"
		const progressBar = progressBarMessage.repeat(Math.floor(progress * 0.25));
		const rProgressBar = progressBarMessage.repeat(Math.floor(rProgress * 0.25));
		const openPortMessage = "Δ"
		let sshPort = " "
		let ftpPort = " "
		let smptPort = " "
		let httpPort = " "
		let sqlPort = " "
		if (serverStats.sshPortOpen == true) { sshPort = openPortMessage }
		if (serverStats.ftpPortOpen == true) { ftpPort = openPortMessage }
		if (serverStats.smptPortOpen == true) { smptPort = openPortMessage }
		if (serverStats.httpPortOpen == true) { httpPort = openPortMessage }
		if (serverStats.sqlPortOpen == true) { sqlPort = openPortMessage }
		ns.clearLog();
		ns.print("Server Name:        " + serverStats.hostname);
		ns.print("IP Adress:          " + serverStats.ip);
		ns.print("Base Security:      " + format(serverStats.baseDifficulty));
		ns.print("Min Security:       " + format(serverStats.minDifficulty));
		ns.print("Security Level:     " + format(serverStats.hackDifficulty));
		ns.print(`Hack Time:          ${hmsms(ns.getHackTime(getInput))}`)
		ns.print("Required Ports:     " + format(serverStats.numOpenPortsRequired));
		ns.print("Max Server Money:   $" + format(serverStats.moneyMax));
		if (serverStats.moneyMax > 0) {
			ns.print("Current Money:      $" + format(serverStats.moneyAvailable));
			ns.print("Money Progress Bar");
			ns.print(progressBar + "| " + progress + "%");
		}
		ns.print("Max Ram:            " + formatGB(serverStats.maxRam * 1e9));
		if (serverStats.maxRam > 0) {
			ns.print("Used Ram:           " + formatGB(serverStats.ramUsed * 1e9));
			ns.print("Free Ram Progress Bar");
			ns.print(rProgressBar + "| " + rProgress + "%");
		}
		ns.print("╒═════════════════════════════╕");
		ns.print("│         OPEN PORTS          │");
		ns.print("╞═════╤═════╤═════╤═════╤═════╡");
		ns.print("│ SSH │ FPT │ SMP │ HTT │ SQL │");
		ns.print("│  " + sshPort + "  │  " + ftpPort + "  │  " + smptPort + "  │  " + httpPort + "  │  " + sqlPort + "  │");
		ns.print("╘═════╧═════╧═════╧═════╧═════╛");
		await ns.sleep(sleepTime);
	}
}