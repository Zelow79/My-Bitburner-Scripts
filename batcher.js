import { hgw, makeHGW, hmsms, dhms, format, formatGB, formatPercent, getAllServers, art } from "ze-lib.js";
/** @param {NS} ns */
export async function main(ns) {
	const consts = {
		target: "joesguns",
		strip: false,
		hedger: true,
		awaitPort: false,
		killOnLevel: false,
		prep: false,
		hack_percent: 0.02,
		hack_threads: 1,
		grow_threads: 1,
		weaken_threads: 1,
		hack_time: 1,
		grow_time: 1,
		weaken_time: 1,
		maxbatches: 1,
		lastKnownLevel: 1,
		killedHacks: 0, // this value will increment as hacks are killed
		base_spacer: 4, // space between each HGW call in ms
		batch_spacer: 0, // space between each batch in ms
		leap: 0 // leap skips batch spacer sleep every x iterations or always sleeps each loop at 0
	},
		moab = ns.exec("superNuker.js", "home", 1),
		batches = [];
	while (ns.isRunning(moab)) await ns.sleep(0);
	if (ns.args[0] !== undefined && ns.serverExists(ns.args[0])) consts.target = ns.args[0];
	else {
		const worthy = getAllServers(ns).filter(s => !ns.getServer(s).purchasedByPlayer
			&& ns.formulas.hacking.weakenTime(spoofTarget(s, 0, true), ns.getPlayer()) < 1000 * 30
			&& ns.getServer(s).hasAdminRights
			&& ns.getServer(s).moneyMax > 0
			&& ns.getServer(s).requiredHackingSkill < ns.getPlayer().skills.hacking);
		if (worthy.length > 0) {
			worthy.sort((a, b) => ns.getServer(b).moneyMax - ns.getServer(a).moneyMax);
			consts.target = worthy[0];
		}
	}
	if (!isNaN(ns.args[1])) consts.hack_percent = ns.args[1];
	const crapIdontWant = [`sleep`, `scp`, `scan`, `ALL`],
		fh = ns.formulas.hacking,
		getSecurityCost = (threads, option = "grow") => option === "grow" ? threads * 0.004 : threads * 0.002,
		prepCheck = () => ns.getServer(consts.target).hackDifficulty === ns.getServer(consts.target).minDifficulty && ns.getServer(consts.target).moneyAvailable === ns.getServer(consts.target).moneyMax,
		pids = [ns.exec("scouter.js", "home", 1, consts.target)];
	ns.clearLog(); crapIdontWant.forEach(fn => ns.disableLog(fn)); ns.tail(); ns.resizeTail(360, 570);
	makeHGW(ns, "home");
	const [hackWeight, growWeight, weakenWeight] = [ns.getScriptRam("hack.js", "home"), ns.getScriptRam("grow.js", "home"), ns.getScriptRam("weaken.js", "home")],
		batchRam = () => (hackWeight * consts.hack_threads) + (growWeight * consts.grow_threads) + (weakenWeight * consts.weaken_threads);
	let preppedServer;
	ns.atExit(() => {
		const workers = ["hack.js", "grow.js", "weaken.js"];
		getAllServers(ns).forEach(server => ns.ps(server).forEach(script => {
			if (workers.includes(script.filename)) pids.push(script.pid);
		}));
		pids.forEach((p) => {
			ns.kill(p);
			ns.closeTail(p);
		});
	});

	consts.lastKnownLevel = ns.getPlayer().skills.hacking;

	while (1) {
		while (hgwRunCheck()) await ns.sleep(0);
		if (consts.prep) await prepServer();
		setValues();
		printNshit();

		let loop = 0;
		// main loop
		while (1) {
			loop++;
			if (consts.lastKnownLevel !== ns.getPlayer().skills.hacking) {
				const hacks = [];
				getAllServers(ns).forEach(server => ns.ps(server).forEach(script => script.filename === "hack.js" ? hacks.push(script.pid) : null));
				hacks.sort((a, b) => a - b);
				//ns.kill(hacks[0]);
				let i = 0;
				for (const p of hacks) {
					if (i > 5) break; // only kill frist 5 hack scripts
					//if (ns.kill(p)) ns.tprint(`PID ${p} killed.`);
					if (consts.killOnLevel) if (ns.kill(p)) consts.killedHacks++;
					i++;
				}
				consts.lastKnownLevel = ns.getPlayer().skills.hacking;
			}

			if (consts.hedger) {
				const scripts = [];
				for (const server of getAllServers(ns)) {
					for (const script of ns.ps(server)) {
						const isHack = script.filename === "hack.js",
							isGrow = script.filename === "grow.js",
							isWeak = script.filename === "weak.js";

						if (isHack || isGrow || isWeak) scripts.push(script);
					}
				}
				scripts.sort((a, b) => a.args[3] - b.args[3]); // sort by finish time
				const s = ns.getServer(consts.target);
				if (scripts.length > 0
					&& scripts[0].filename === "hack.js"
					&& s.moneyAvailable !== s.moneyMax
					&& s.hackDifficulty !== s.minDifficulty) {
					if (ns.kill(scripts[0].pid)) consts.killedHacks++;
					//ns.tprint(`Killed ${scripts[0].filename} PID: ${scripts[0].pid}`);
				}
			}
			printNshit();
			if (ramCheck() && batchCheck()) {
				if (consts.strip) {
					for (let i = 0; i < consts.maxbatches; i++) {
						await sendBatch(i * (consts.base_spacer * 2 + 1));
						if (i % 100 === 0) await ns.sleep(consts.batch_spacer);
					}
				} else {
					await sendBatch();
					if (consts.leap === 0 || loop % consts.leap === 0) await ns.sleep(consts.batch_spacer);
				}
			}
			await ns.sleep(0); // safety sleep
			if (ns.getServer(consts.target).hackDifficulty === ns.getServer(consts.target).minDifficulty
				&& ns.getServer(consts.target).moneyAvailable === ns.getServer(consts.target).moneyMax) setValues();
		}
	}

	function hgwRunCheck(location) {
		const scripts = ["hack.js", "grow.js", "weaken.js"]
		if (location !== undefined && ns.serverExists(location)) {
			return ns.ps(location).some(f => scripts.includes(f.filename));
		} else {
			for (const server of getAllServers(ns)) {
				for (const script of ns.ps(server))
					if (scripts.includes(script.filename)) return true;
			}
			return false;
		}
	}

	async function prepServer() {
		ns.getServer(consts.target).hasAdminRights ? ns.print(`${consts.target} has root access.`) : hgw(ns, consts.target, "home", 0).nukeIt();
		ns.print(`Prepping ${consts.target} now...`)
		while (ns.ps("home").some(f => f.filename === "nuke.js")) await ns.sleep(0);
		const needsGrow = () => ns.getServer(consts.target).moneyAvailable < ns.getServer(consts.target).moneyMax
		const needsWeaken = () => ns.getServer(consts.target).hackDifficulty > ns.getServer(consts.target).minDifficulty
		while (needsGrow() || needsWeaken()) {
			for (const ram of getRam()) {
				while (ram.freeRam > weakenWeight || ram.freeRam > growWeight) {
					if (!needsGrow() && !needsWeaken()) {
						getAllServers(ns).forEach(server => ns.ps(server).forEach(script => {
							script.filename === "grow.js" || script.filename === "weaken.js" ? ns.kill(script.pid) : null
						}));
						return;
					}
					if (needsWeaken()) {
						if (ram.freeRam < weakenWeight) break;
						if (!ns.ls(ram.name).includes("weaken.js")) makeHGW(ns, ram.name);
						hgw(ns, consts.target, ram.name).weakIt(1);
						ram.freeRam -= weakenWeight;
					}
					if (needsGrow()) {
						if (ram.freeRam < growWeight) break;
						if (!ns.ls(ram.name).includes("grow.js")) makeHGW(ns, ram.name);
						hgw(ns, consts.target, ram.name).growIt(1);
						ram.freeRam -= growWeight;
					}
					await ns.sleep(consts.batch_spacer);
				}
			}
			await ns.sleep(0);
		}
	}

	async function sendBatch(x = 0) {
		let ramHosts = getRam(),
			host = "home",
			adjust = x + performance.now();
		for (const server of ramHosts) {
			if (server.freeRam < hackWeight * consts.hack_threads) continue;
			host = server.name;
			break;
		}
		if (!ns.ls(host).includes("hack.js")) makeHGW(ns, host);
		const hDelay = consts.weaken_time + consts.base_spacer - consts.hack_time,
			hFinishTime = consts.hack_time + hDelay + adjust;
		// Send hack
		hgw(ns, consts.target, host, hDelay, false, hFinishTime).hackIt(consts.hack_threads);

		ramHosts = getRam();
		for (const server of ramHosts) {
			if (server.freeRam < growWeight * consts.grow_threads) continue;
			host = server.name;
			break;
		}
		if (!ns.ls(host).includes("grow.js")) makeHGW(ns, host);
		const gDelay = consts.weaken_time + (consts.base_spacer * 2) - consts.grow_time,
			gFinishTime = consts.grow_time + gDelay + adjust;
		// Send grow
		hgw(ns, consts.target, host, gDelay, false, gFinishTime).growIt(consts.grow_threads);

		ramHosts = getRam();
		const wDelay = consts.base_spacer * 3, bPids = [],
			wFinishTime = consts.weaken_time + wDelay + adjust;
		let rWThreads = consts.weaken_threads;
		for (const server of ramHosts) {
			if (server.freeRam < weakenWeight || rWThreads === 0) continue;
			if (!ns.ls(server.name).includes("weaken.js")) makeHGW(ns, server.name);
			const aThreads = Math.floor(server.freeRam / weakenWeight);
			if (aThreads < rWThreads) {
				const threads = aThreads;
				// Send weaken
				const pDiddy = hgw(ns, consts.target, server.name, wDelay, false, wFinishTime).weakIt(threads);
				bPids.push(pDiddy);
				rWThreads -= threads;
			} else {
				const threads = rWThreads;
				// Send weaken
				const pDiddy = hgw(ns, consts.target, server.name, wDelay, consts.awaitPort, wFinishTime).weakIt(threads);
				bPids.push(pDiddy);
				rWThreads -= threads;
				if (consts.awaitPort) await ns.getPortHandle(pDiddy + 100).nextWrite();
			}
		}
		batches.push(bPids.sort((a, b) => a - b)[0]); // push first weaken PID to batches
	}

	function setValues() {
		preppedServer = ns.getServer(consts.target);
		consts.hack_threads = Math.max(Math.floor(ns.hackAnalyzeThreads(consts.target, consts.hack_percent * preppedServer.moneyMax)), 1);
		consts.grow_threads = Math.max(fh.growThreads(spoofTarget(consts.target, getSecurityCost(consts.hack_threads, "hack")), ns.getPlayer(), spoofTarget(consts.target).moneyMax) + 1, 1);
		consts.weaken_threads = Math.max(Math.ceil(getSecurityCost(consts.hack_threads, "hack") + getSecurityCost(consts.grow_threads) / ns.weakenAnalyze(1)) + 1, 1);
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
			//serverObj.moneyAvailable = Math.floor(serverObj.moneyMax - ns.formulas.hacking.hackPercent(spoofTarget(server, 0, true), ns.getPlayer()) * serverObj.moneyMax * consts.hack_threads);
			serverObj.moneyAvailable = Math.floor(serverObj.moneyMax * (1 - ns.formulas.hacking.hackPercent(spoofTarget(server, 0, true), ns.getPlayer()) * consts.hack_threads));
			serverObj.hackDifficulty = serverObj.minDifficulty + secAdj;
		}
		return serverObj;
	}

	function getRam(focus_home = false) {
		const hashnet = [];
		for (let i = 0; i < 20; i++) hashnet.push(`hacknet-server-${i}`);
		const availableRam = s => ns.getServer(s).maxRam - ns.getServer(s).ramUsed,
			ram = getAllServers(ns, true).filter(server => ns.getServer(server).maxRam > 0
				&& ns.getServer(server).hasAdminRights && !hashnet.includes(server)), result = [];
		ram.sort((a, b) => availableRam(a) - availableRam(b) || ns.getServer(b).maxRam - ns.getServer(a).ramUsed);
		if (focus_home) {
			ram.unshift("home");
		} else {
			ram.push("home");
		}
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

		for (const server of ramHosts) {
			if (server.freeRam < growWeight * consts.grow_threads) continue;
			growStatus = true; server.freeRam -= growWeight * consts.grow_threads; break;
		}

		let rWThreads = consts.weaken_threads;
		for (const server of ramHosts) {
			if (server.freeRam < weakenWeight || rWThreads === 0) continue;
			const aThreads = Math.floor(server.freeRam / weakenWeight),
				threads = aThreads < rWThreads ? aThreads : rWThreads;
			server.freeRam -= threads; rWThreads -= threads;
		}
		if (rWThreads > 0) return false; weakenStatus = true;

		return hackStatus && weakenStatus && growStatus;
	}

	function batchCheck() {
		for (let i = 0; i < batches.length; i++) {
			if (ns.getRunningScript(batches[i]) !== null) continue;
			batches.splice(i, 1);
			i--;
		}
		consts.maxbatches = Math.ceil(consts.weaken_time / ((4 * consts.base_spacer) + consts.batch_spacer))
		ns.setTitle(React.createElement("span", { style: { color: "rgb(255,255,255)" } }, `Batches in flight: ${batches.length} / ${consts.maxbatches}`))
		return batches.length < consts.maxbatches;
	}

	function printNshit() {
		ns.clearLog();
		const self = ns.getRunningScript(ns.pid);
		ns.print(`Runtime:        ${art(dhms((self.offlineRunningTime + self.onlineRunningTime) * 1000), { color: 255 })}`);
		Object.entries(consts).forEach(([key, value]) => ns.print(`${key}:${"".padEnd(14 - key.length, " ")} ${art(value, { color: 255 })}`));
		ns.print(`Hack % t-1:     ${art(formatPercent(fh.hackPercent(ns.getServer(consts.target), ns.getPlayer())), { color: 255 })}`);
		ns.print(`Spoof max:      ${art("$" + format(spoofTarget(consts.target).moneyMax), { color: 255 })}`);
		ns.print(`Spoof cur:      ${art("$" + format(spoofTarget(consts.target).moneyAvailable), { color: 255 })}`);
		ns.print(`Hack %:         ${art(formatPercent(fh.hackPercent(preppedServer, ns.getPlayer()) * consts.hack_threads), { color: 255 })}`);
		ns.print(`Batch RAM:      ${art(formatGB(batchRam() * 1073741824), { color: 255 })}`);
		ns.print(`Hack Time:      ${art(hmsms(consts.hack_time) + ` Finish: ${hmsms(consts.hack_time + (consts.weaken_time + consts.base_spacer - consts.hack_time))}`, { color: 255 })}`);
		ns.print(`Grow Time:      ${art(hmsms(consts.grow_time) + ` Finish: ${hmsms(consts.grow_time + (consts.weaken_time + (consts.base_spacer * 2) - consts.grow_time))}`, { color: 255 })}`);
		ns.print(`Weak Time:      ${art(hmsms(consts.weaken_time) + ` Finish: ${hmsms(consts.weaken_time + (consts.base_spacer * 3))}`, { color: 255 })}`);
		ns.print(`EXP rate:       ${art(format(ns.getScriptExpGain(ns.pid)) + " / sec", { color: 255 })}`);
		ns.print(`EXP Made:       ${art(format(self.offlineExpGained + self.onlineExpGained), { color: 255 })}`);
		ns.print(`Income Rate:    ${art("$" + format(ns.getScriptIncome(ns.pid)) + " / sec", { color: 255 })}`);
		ns.print(`Total Made:     ${art("$" + format(self.offlineMoneyMade + self.onlineMoneyMade), { color: 255 })}`);
	}
}