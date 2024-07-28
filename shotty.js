/** @param {NS} ns */
export async function main(ns) {
	["exec", "scan", "sleep"].forEach(o => ns.disableLog(o));
	ns.clearLog(); ns.tail(); ns.resizeTail(330, 470);
	const info = {
		title: "SHOTTY!**SHOTTY!**SHOTTY!**SHOTTY!**",
		workerName: "pellet.js",
		workerWeight: { "hack": 1.7, "grow": 1.75, "weaken": 1.75 },
		target: "n00dles",
		hack_percent: 0,
		startingHack_percent: 0.05,
		hack_percent_hardcap: 0.5,
		percentIncrease: 0.02,
		hackAmount: 0,
		threads: { "hack": 1, "grow": 1, "weaken": 1 },
		timings: { "hack": 0, "grow": 0, "weaken": 0 },
		minHackChance: 0.5,
		waitTime: 400,
		maxWorkers: ns.args.includes("yolo") ? 2.5e5 : 3e4,
		pids: [],
		"print": ns.args.includes("no_hud") ? false : true,
		autoAdvance: ns.args.includes("advance") ? true : false,
		debug: ns.args.includes("debug") ? true : false,
		update: ns.args.includes("update") ? true : false, // force worker to update every getRam call default: false
		sound: ns.args.includes("sound") ? true : false
	}, startTime = performance.now();

	servers().forEach(s => ns.ps(s).forEach(x => x.filename === info.workerName ? ns.kill(x.pid) : null)); // kill any running workers
	makeWorker(); // make initial workers

	info.hack_percent = info.startingHack_percent; // set actual hack percent to start percent value

	if (info.sound) { // if sound is enabled player start up and shut down sounds
		new Audio("https://www.myinstants.com/media/sounds/windows-xp-startup.mp3").play();
		ns.atExit(() => new Audio("https://www.myinstants.com/media/sounds/preview_4.mp3").play());
	}
	if (ns.getServer(info.target).requiredHackingSkill > ns.getPlayer().skills.hacking) {
		ns.print("Hacking level too low, terminating.");
		ns.exit();
	}

	while (1) {
		if (info.autoAdvance && info?.increasePercent) { // if enabled and flagged
			info.increasePercent = false; // turn flag back off
			// increase hacking percent by info.percentIncrease without exceeding info.hack_percent_hardcap
			info.hack_percent = Math.min(info.hack_percent_hardcap, info.hack_percent + info.percentIncrease);
		}

		const changed = targetSelector(); // check for better targets and true if new one is selected
		await prep(); // prep target if needed
		setValues(); // set values for batch

		let tCheck = performance.now();

		while (info.pids.length < info.maxWorkers) {
			const batch = sendBatch();
			if (batch) {
				batch.forEach(p => info.pids.push(p)); // if not false should be an array of 4 pids
			} else {
				break; // if falsy break while loop early
			}
			if (performance.now() > tCheck + info.waitTime) {
				await ns.sleep(0);
				tCheck = performance.now();
			}
		}

		// if pids length is near maxWorkers flag to increase hacking percent
		if (!changed && info.pids.length > (info.maxWorkers) * 0.8) info.increasePercent = true;

		while (info.pids.length > 0) {
			printInfo();
			await ns.sleep(500);
			info.pids = info.pids.filter(p => ns.isRunning(p)); // update pids
		}
	}

	function printInfo() {
		let title = [...info.title];
		title.push(title.shift(...title[0]));
		info.title = title.join("");
		ns.setTitle(React.createElement("span", { style: { color: `rgb(${Math.floor(Math.random() * 155)}, 255, ${Math.floor(Math.random() * 155)})` } }, info.title));
		if (!info["print"]) return false;
		ns.clearLog();
		const tar = ns.getServer(info.target);
		if (info.sound) ns.print("***SOUND ENABLED***");
		ns.print("Runtime:        " + ns.tFormat(performance.now() - startTime));
		ns.print("Worker Limit:   " + info.maxWorkers);
		ns.print("Active Workers: " + info.pids.length);
		ns.print("---Target Info---");
		ns.print("Server Name:    " + info.target);
		const secDiff = tar.hackDifficulty - tar.minDifficulty,
			moneyDiff = tar.moneyAvailable - tar.moneyMax;
		ns.print(`Security(min):  ${tar.hackDifficulty} (${tar.minDifficulty}) ${secDiff > 0 ? ns.formatNumber(secDiff) : ""}`);
		ns.print(`Money(max):     \$${ns.formatNumber(tar.moneyAvailable, 2)} (\$${ns.formatNumber(tar.moneyMax, 2)}) ${moneyDiff < 0 ? ns.formatNumber(moneyDiff) : ""}`);
		ns.print("Hack %:         " + ns.formatPercent(info.hack_percent, 0));
		ns.print("Hack $ amt:     $" + ns.formatNumber(info.hackAmount, 2));
		if (info.debug) ns.print("Wait Time:      " + info.waitTime);
		ns.print("---Script Earnings---")
		ns.print("EXP:            " + ns.formatNumber(ns.getRunningScript(ns.pid).onlineExpGained, 2));
		ns.print("Money:          $" + ns.formatNumber(ns.getRunningScript(ns.pid).onlineMoneyMade, 2));
		ns.print("Money /s:       $" + ns.formatNumber(Math.floor(ns.getRunningScript(ns.pid).onlineMoneyMade / ((performance.now() - startTime) / (1000))), 2));
		ns.print("Money /h:       $" + ns.formatNumber(Math.floor(ns.getRunningScript(ns.pid).onlineMoneyMade / ((performance.now() - startTime) / (1000 * 60 * 60))), 2));
		if (info.debug) {
			ns.print("---Threads---");
			Object.entries(info.threads).forEach(([key, value]) => ns.print(`${key}:${" ".padStart(15 - key.length)}${value}`));
			ns.print("---Timings---");
			Object.entries(info.timings).forEach(([key, value]) => ns.print(`${key}:${" ".padStart(15 - key.length)}${value.toFixed(2)}`));
		}
	}

	function sendBatch() {
		const ram = getRam(),
			instructions = [],
			pids = [];

		// Hack
		instructions.push(stageWorker("hack", info.threads["hack"], info.timings["weaken"] - info.timings["hack"]));
		// Weaken
		instructions.push(stageWorker("weaken", info.threads["weaken"]));
		// Grow
		instructions.push(stageWorker("grow", info.threads["grow"], info.timings["weaken"] - info.timings["grow"]));
		// Weaken
		instructions.push(stageWorker("weaken", info.threads["weaken"]));

		if (instructions.includes(undefined)) return false;

		for (const instruction of instructions) {
			pids.push(ns.exec(info.workerName, instruction[1], {
				threads: info.threads[instruction[0]],
				ramOverride: info.workerWeight[instruction[0]],
				temporary: true
			}, info.target, instruction[2], instruction[0]));
		}

		return pids;

		function stageWorker(type, threads = 1, wait = 0) {
			for (let i = 0; i < ram.length; i++) {
				if (ram[i].maxRam - ram[i].ramUsed < info.workerWeight[type] * threads) continue; // not enough ram to run worker
				ram[i].ramUsed += info.workerWeight[type] * threads;
				return [type, ram[i].hostname, wait];
			}
		}
	}

	function setValues() {
		const spoof = ns.getServer(info.target);
		spoof.moneyAvailable = spoof.moneyMax;
		spoof.minDifficulty = spoof.minDifficulty;

		info.threads["hack"] = Math.floor(ns.hackAnalyzeThreads(info.target, ns.getServer(info.target).moneyMax * info.hack_percent));
		info.timings["hack"] = ns.getHackTime(info.target);
		info.hackAmount = spoof.moneyMax * ns.formulas.hacking.hackPercent(spoof, ns.getPlayer()) * info.threads["hack"];
		spoof.moneyAvailable = spoof.moneyMax - info.hackAmount;

		info.threads["grow"] = ns.formulas.hacking.growThreads(spoof, ns.getPlayer(), spoof.moneyMax);
		info.timings["grow"] = ns.getGrowTime(info.target);

		info.threads["weaken"] = Math.max(Math.ceil(info.threads["hack"] * 0.002 / ns.weakenAnalyze(1)), Math.ceil(info.threads["grow"] * 0.004 / ns.weakenAnalyze(1)));
		info.timings["weaken"] = ns.getWeakenTime(info.target);
	}

	async function prep() {
		const needMoney = () => ns.getServer(info.target).moneyAvailable < ns.getServer(info.target).moneyMax,
			badSec = () => ns.getServer(info.target).hackDifficulty < ns.getServer(info.target).minDifficulty,
			calls = [];
		while (needMoney() || badSec()) {
			for (const ram of getRam()) {
				if (!ns.ls(ram.hostname).includes(info.workerName)) makeWorker(ram.hostname);
				const freeRam = ram.maxRam - ram.ramUsed;
				if (freeRam < info.workerWeight["grow"]  // skip server if it can't even hold 1 worker
					|| freeRam < info.workerWeight["weaken"]) continue;
				if (badSec() && needMoney() // if target needs both weaken and grow and has enough to split ram 50:50
					&& freeRam > info.workerWeight["weaken"] + info.workerWeight["grow"]) {
					const threads = Math.floor(freeRam / info.workerWeight["grow"] / 2);
					calls.push([info.workerName, ram.hostname, { threads, ramOverride: info.workerWeight["weaken"], temporary: true }, info.target, 0, "weaken"]);
					calls.push([info.workerName, ram.hostname, { threads, ramOverride: info.workerWeight["grow"], temporary: true }, info.target, 0, "grow"]);
				} else if (badSec()) {
					const threads = Math.floor(freeRam / info.workerWeight["weaken"]);
					calls.push([info.workerName, ram.hostname, { threads, ramOverride: info.workerWeight["weaken"], temporary: true }, info.target, 0, "weaken"]);
				} else {
					const threads = Math.floor(freeRam / info.workerWeight["grow"]);
					calls.push([info.workerName, ram.hostname, { threads, ramOverride: info.workerWeight["grow"], temporary: true }, info.target, 0, "grow"]);
				}
			}

			for (const instructions of calls) {
				info.pids.push(ns.exec(...instructions));
			}

			while (info.pids.length > 0) {
				if (!badSec() && !needMoney()) {
					servers().forEach(s => ns.ps(s).forEach(script => script.filename === info.workerName ? ns.kill(script.pid) : null));
					if (info.sound) new Audio("https://www.myinstants.com/media/sounds/youtube-uwuuuuu.mp3").play();
					info.pids = info.pids.filter(p => ns.isRunning(p));
					break;
				}

				info.pids = info.pids.filter(p => ns.isRunning(p));
				printInfo();
				ns.print("***PREPPING***");
				await ns.sleep(500);
			}
		}
	}

	function targetSelector() {
		const result = servers().filter(server => ns.getServer(server).hasAdminRights
			&& ns.formulas.hacking.weakenTime(spoof(server), ns.getPlayer()) < 1000 * 30
			&& ns.getServer(server).moneyMax > 0
			& ns.getServer(server).requiredHackingSkill < ns.getPlayer().skills.hacking);

		if (result.length > 0) {
			result.sort((a, b) => ns.getServer(b).moneyMax - ns.getServer(a).moneyMax);
			if (info.target != result[0]) {
				info.target = result[0];
				info.hack_percent = info.startingHack_percent;
				return true; // we updated the target with a new one
			}
		}
		return false; // we did not update target with a new one

		function spoof(server) {
			const spoof = ns.getServer(server);
			spoof.hackDifficulty = spoof.minDifficulty;
			return spoof;
		}
	}

	function getRam() {
		const result = [];
		for (const server of servers()) {
			if (info.update) makeWorker(server);
			const noRam = ns.getServer(server).maxRam < 2,
				noAccess = !ns.getServer(server).hasAdminRights;
			if (noRam || noAccess) continue // don't want shit servers
			result.push(ns.getServer(server));
		}
		result.sort((a, b) => a.maxRam - b.maxRam);
		result.push(ns.getServer("home")); // add home after sort so home is used last, probably not needed
		return result;
	}

	function makeWorker(send = false) { // send should be name of server that will host worker
		ns.write(info.workerName,
			`export const main = async (ns) => await ns[ns.args[2]](ns.args[0], { additionalMsec: ns.args[1] ?? 0});`, "w");
		if (send && ns.serverExists(send)) ns.scp(info.workerName, send);
	}

	function servers() { // get all servers except home
		const x = new Set(["home"]);
		x.forEach(server => ns.scan(server).forEach(connectServer => x.add(connectServer)));
		x.delete("home");
		return Array.from(x);
	}
}