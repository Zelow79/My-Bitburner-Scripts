import { hgw, makeHGW, hmsms, dhms, format, formatGB, formatPercent, getAllServers, art } from "ze-lib.js";
const consts = {
	target: "joesguns",
	autoReset: true,
	hack_percent: 0.02,
	hack_threads: 1,
	grow_threads: 1,
	weaken_threads: 1,
	hack_time: 1,
	grow_time: 1,
	weaken_time: 1,
	base_spacer: 30, // space between each HGW call in ms
	batch_spacer: 90 // space between each batch in ms
}
/** @param {NS} ns */
export async function main(ns) {
	const moab = ns.exec("superNuker.js", "home", 1);
	while (ns.isRunning(moab)) await ns.sleep(0);
	if (ns.args[0] !== undefined && ns.serverExists(ns.args[0])) consts.target = ns.args[0];
	else {
		const worthy = getAllServers(ns).filter(s => !ns.getServer(s).purchasedByPlayer
			&& ns.formulas.hacking.weakenTime(spoofTarget(s, 0, true), ns.getPlayer()) < 1000 * 60
			&& ns.getServer(s).hasAdminRights
			&& ns.getServer(s).moneyMax > 0
			&& ns.getServer(s).requiredHackingSkill < ns.getPlayer().skills.hacking);
		if (worthy.length === 0) {
			ns.print("There was no worthy, the end is nigh.");
			ns.exit();
		}
		worthy.sort((a, b) => ns.getServer(b).moneyMax - ns.getServer(a).moneyMax);
		consts.target = worthy[0];
	}
	if (!isNaN(ns.args[1])) consts.hack_percent = ns.args[1];
	const crapIdontWant = [`sleep`, `scp`, `scan`, `ALL`],
		fh = ns.formulas.hacking,
		getSecurityCost = (threads, option = "grow") => option === "grow" ? threads * 0.004 : threads * 0.002,
		pids = [ns.exec("scouter.js", "home", 1, consts.target)];
	ns.clearLog(); crapIdontWant.forEach(fn => ns.disableLog(fn)); ns.tail();
	makeHGW(ns, "home");
	const [hackWeight, growWeight, weakenWeight] = [ns.getScriptRam("hack.js", "home"), ns.getScriptRam("grow.js", "home"), ns.getScriptRam("weaken.js", "home")],
		batchRam = () => (hackWeight * consts.hack_threads) + (growWeight * consts.grow_threads) + (weakenWeight * consts.weaken_threads);
	let preppedServer;
	ns.atExit(() => {
		pids.forEach((p) => {
			ns.kill(p);
			ns.closeTail(p);
		});
	});

	while (1) {
		while (ns.scriptRunning("hack.js", "home") || ns.scriptRunning("grow.js", "home") || ns.scriptRunning("weaken.js", "home")) await ns.sleep(0);
		await prepServer();
		setValues();
		printNshit();

		// main loop
		while (1) {
			printNshit();
			if (ramCheck()) sendBatch();
			await ns.sleep(consts.batch_spacer);
			if (ns.getServer(consts.target).hackDifficulty === ns.getServer(consts.target).minDifficulty
				&& ns.getServer(consts.target).moneyAvailable === ns.getServer(consts.target).moneyMax) setValues();
		}
	}

	async function prepServer() {
		ns.getServer(consts.target).hasAdminRights ? ns.print(`${consts.target} has root access.`) : hgw(ns, consts.target, "home", 0).nukeIt();
		ns.print(`Prepping ${consts.target} now...`)
		while (ns.scriptRunning("nuke.js", "home")) await ns.sleep(0);
		const needsGrow = () => ns.getServer(consts.target).moneyAvailable < ns.getServer(consts.target).moneyMax
		const needsWeaken = () => ns.getServer(consts.target).hackDifficulty > ns.getServer(consts.target).minDifficulty
		while (needsGrow() || needsWeaken()) {
			if (needsWeaken()) {
				for (const ram of getRam()) {
					if (ram.freeRam < weakenWeight) continue;
					makeHGW(ns, ram.name);
					hgw(ns, consts.target, ram.name).weakIt(Math.floor(ram.freeRam / weakenWeight));
				}
			}
			else if (needsGrow()) {
				for (const ram of getRam()) {
					if (ram.freeRam < growWeight) continue;
					makeHGW(ns, ram.name);
					hgw(ns, consts.target, ram.name).growIt(Math.floor(ram.freeRam / growWeight));
				}
			}
			while (ns.scriptRunning("grow.js", "home") || ns.scriptRunning("weaken.js", "home")) await ns.sleep(0);
			await ns.sleep(0);
		}
	}

	function sendBatch() {
		let ramHosts = getRam(),
			host = "home";
		for (const server of ramHosts) {
			if (server.freeRam < hackWeight * consts.hack_threads) continue;
			host = server.name;
			break;
		}
		if (!ns.ls(host, ".js").includes("hack")) makeHGW(ns, host);
		const hDelay = consts.weaken_time + consts.base_spacer - consts.hack_time;
		// Send hack
		hgw(ns, consts.target, host, hDelay).hackIt(consts.hack_threads);

		ramHosts = getRam();
		const wDelay = consts.base_spacer * 3
		let rWThreads = consts.weaken_threads;
		for (const server of ramHosts) {
			if (server.freeRam < weakenWeight || rWThreads === 0) continue;
			if (!ns.ls(server.name, ".js").includes("weaken")) makeHGW(ns, server.name);
			const aThreads = Math.floor(server.freeRam / weakenWeight),
				threads = aThreads < rWThreads ? aThreads : rWThreads;
			// Send weaken
			hgw(ns, consts.target, server.name, wDelay).weakIt(threads);
			rWThreads -= threads;
		}

		ramHosts = getRam(true);
		for (const server of ramHosts) {
			if (server.freeRam < growWeight * consts.grow_threads) continue;
			host = server.name;
			break;
		}
		if (!ns.ls(host, ".js").includes("grow")) makeHGW(ns, host);
		const gDelay = consts.weaken_time + (consts.base_spacer * 2) - consts.grow_time;
		hgw(ns, consts.target, host, gDelay).growIt(consts.grow_threads);
	}

	function setValues() {
		preppedServer = ns.getServer(consts.target);
		consts.hack_threads = Math.max(Math.floor(ns.hackAnalyzeThreads(consts.target, consts.hack_percent * preppedServer.moneyMax)), 1);
		consts.grow_threads = Math.max(fh.growThreads(spoofTarget(consts.target, getSecurityCost(consts.hack_threads, "hack")), ns.getPlayer(), spoofTarget(consts.target).moneyMax), 1);
		consts.weaken_threads = Math.max(Math.ceil(getSecurityCost(consts.hack_threads, "hack") + getSecurityCost(consts.grow_threads) / 0.005), 1);
		consts.hack_time = fh.hackTime(preppedServer, ns.getPlayer());
		consts.grow_time = fh.growTime(spoofTarget(consts.target, getSecurityCost(consts.grow_threads)), ns.getPlayer());
		consts.weaken_time = fh.weakenTime(spoofTarget(consts.target, getSecurityCost(consts.grow_threads) + getSecurityCost(consts.hack_threads, "hack")), ns.getPlayer());
	}

	function spoofTarget(server, secAdj = 0, full = false) {
		const serverObj = {
			...ns.getServer(server)
		}
		if (full) {
			serverObj.moneyAvailable = serverObj.moneyMax;
			serverObj.hackDifficulty = serverObj.minDifficulty + secAdj;
		} else {
			serverObj.moneyAvailable = Math.floor(serverObj.moneyMax * (1 - ns.formulas.hacking.hackPercent(spoofTarget(server, 0, true), ns.getPlayer()) * consts.hack_threads));
			serverObj.hackDifficulty = serverObj.minDifficulty + secAdj;
		}
		return serverObj;
	}

	function getRam(focus_home = false) {
		const hashnet = [];
		for (let i = 0; i < 20; i++) hashnet.push(`hacknet-node-${i}`);
		const availableRam = s => ns.getServer(s).maxRam - ns.getServer(s).ramUsed,
			ram = getAllServers(ns, true).filter(server => ns.getServer(server).maxRam > 0
				&& ns.getServer(server).hasAdminRights && !hashnet.includes(server)), result = [];
		ram.sort((a, b) => availableRam(a) - availableRam(b) || ns.getServer(b).maxRam - ns.getServer(a).ramUsed);
		if (!focus_home) ram.push("home");
		else ram.unshift("home");
		for (const server of ram) result.push({
			name: server,
			maxRam: ns.getServer(server).maxRam,
			freeRam: ns.getServer(server).maxRam - ns.getServer(server).ramUsed
		});
		return result;
	}

	function ramCheck() {
		let ramHosts = getRam(), hackStatus = false, weakenStatus = false, growStatus = false;
		for (const server of ramHosts) {
			if (server.freeRam < hackWeight * consts.hack_threads) continue;
			hackStatus = true; server.freeRam -= hackWeight * consts.hack_threads; break;
		}
		let rWThreads = consts.weaken_threads;
		for (const server of ramHosts) {
			if (server.freeRam < weakenWeight || rWThreads === 0) continue;
			const aThreads = Math.floor(server.freeRam / weakenWeight),
				threads = aThreads < rWThreads ? aThreads : rWThreads;
			server.freeRam -= threads; rWThreads -= threads;
		}
		if (rWThreads > 0) return false; weakenStatus = true;
		for (const server of ramHosts) {
			if (server.freeRam < growWeight * consts.grow_threads) continue;
			growStatus = true; server.freeRam -= growWeight * consts.grow_threads; break;
		}
		return hackStatus && weakenStatus && growStatus;
	}

	function printNshit() {
		ns.clearLog();
		const self = ns.getRunningScript(ns.pid);
		ns.print(`Runtime:        ${art(dhms((self.offlineRunningTime + self.onlineRunningTime) * 1000), { color: 255 })}`);
		Object.entries(consts).forEach(([key, value]) => ns.print(`${key}:${"".padEnd(14 - key.toString().length, " ")} ${art(value, { color: 255 })}`));
		ns.print(`Hack % t-1:     ${art(formatPercent(fh.hackPercent(ns.getServer(consts.target), ns.getPlayer())), { color: 255 })}`);
		ns.print(`Spoof max:      ${art("$" + format(spoofTarget(consts.target).moneyMax), { color: 255 })}`);
		ns.print(`Spoof cur:      ${art("$" + format(spoofTarget(consts.target).moneyAvailable), { color: 255 })}`);
		ns.print(`Hack %:         ${art(formatPercent(fh.hackPercent(preppedServer, ns.getPlayer()) * consts.hack_threads), { color: 255 })}`);
		ns.print(`Batch RAM:      ${art(formatGB(batchRam() * 1073741824), { color: 255 })}`);
		ns.print(`Hack Time:      ${art(hmsms(consts.hack_time), { color: 255 })}`);
		ns.print(`Grow Time:      ${art(hmsms(consts.grow_time), { color: 255 })}`);
		ns.print(`Weak Time:      ${art(hmsms(consts.weaken_time), { color: 255 })}`);
		ns.print(`EXP rate:       ${art(format(ns.getScriptExpGain(ns.pid)) + " / sec", { color: 255 })}`);
		ns.print(`EXP Made:       ${art(format(self.offlineExpGained + self.onlineExpGained), { color: 255 })}`);
		ns.print(`Income Rate:    ${art("$" + format(ns.getScriptIncome(ns.pid)) + " / sec", { color: 255 })}`);
		ns.print(`Total Made:     ${art("$" + format(self.offlineMoneyMade + self.onlineMoneyMade), { color: 255 })}`);
	}
}