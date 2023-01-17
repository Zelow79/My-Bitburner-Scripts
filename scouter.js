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
		ns.print("Base Security:      " + ns.nFormat(serverStats.baseDifficulty, '0,0'));
		ns.print("Min Security:       " + ns.nFormat(serverStats.minDifficulty, '0,0'));
		ns.print("Security Level:     " + ns.nFormat(serverStats.hackDifficulty, '0.0[00]'));
		ns.print(`Hack Time:          ${dhm(ns.getHackTime(getInput))}`)
		ns.print("Required Ports:     " + ns.nFormat(serverStats.numOpenPortsRequired, '0.[00]'));
		ns.print("Max Server Money:   $" + format(ns, serverStats.moneyMax));
		if (serverStats.moneyMax > 0) {
			ns.print("Current Money:      $" + format(ns, serverStats.moneyAvailable));
			ns.print("Money Progress Bar");
			ns.print(progressBar + "| " + progress + "%");
		}
		ns.print("Max Ram:            " + ns.nFormat(serverStats.maxRam * 1e9, '0b'));
		if (serverStats.maxRam > 0) {
			ns.print("Used Ram:           " + ns.nFormat(serverStats.ramUsed * 1e9, '0b'));
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

function format(ns, value) {
	return (value >= 1e15) ? ns.nFormat(value, "0.[00]e+0") : ns.nFormat(value, "0.[00]a");
}

function dhm(t) {
	var ch = 60 * 60 * 1000,
		cm = 60 * 1000,
		h = Math.floor(t / ch),
		m = Math.floor((t - h * ch) / cm),
		s = Math.round((t - h * ch - m * cm) / 1000),
		ms = Math.round(t - h * ch - m * cm - s * 1000),
		pad = function (n) { return n < 10 ? '0' + n : n; },
		msPad = function (n) { return n.toString().length < 3 ? '0'.repeat(3 - n.toString().length) + n : n; };
	if (ms === 1000) {
		s++;
		ms = 0;
	}
	if (s === 60) {
		m++;
		s = 0;
	}
	if (m === 60) {
		h++;
		m = 0;
	}
	return [pad(h), pad(m), pad(s), msPad(ms)].join(':');
}