import { progBar, timeFormat } from "ze-lib";
/** @param {NS} ns */
export async function main(ns) {
	if (ns.args.includes("help")) {
		ns.tprintRaw(`Usage: run ${ns.getScriptName()} options`);
		ns.tprintRaw("Options:");
		ns.tprintRaw("skeet: sets passive wait time to 0ms letting it run as fast as possible *might be resource intensive");
		ns.tprintRaw("yeet: allows for longer to finish batches");
		ns.tprintRaw("yolo: Raises batch limit to 250k from 30k");
		ns.tprintRaw("no_hud: removes print out");
		ns.tprintRaw("sound: Enables some sound effects for various things, like prepping, start up and shut down");
		ns.tprintRaw("advance: WIP, attempts to increase max hacking % limit as you reach the batch limit");
		ns.tprintRaw("debug: adds some additional information to print out");
		return;
	}
	["exec", "scan", "sleep"].forEach(o => ns.disableLog(o));
	ns.clearLog(); ns.ui.openTail();
	const info = {
		title: "SHOTTY!**SHOTTY!**SHOTTY!**",
		workerName: "pellet.js", // name of the worker 
		workerWeight: { "hack": 1.7, "grow": 1.75, "weaken": 1.75 }, // weights for worker in different modes
		target: "n00dles", // mostly just use by the script likely wont stay n00dles
		hack_percent: 0, // this value is modified by the script
		startingHack_percent: 0.05, // set this value for the starting value for script
		hack_percent_hardcap: 0.5, // highest hacking percent can go
		percentIncrease: 0.02, // amount hacking % increases by when autoAdvance is on
		hackAmount: 0, // this value is modified by the script
		threads: { "hack": 1, "grow": [1, 1], "weaken": 1 }, // script stores thread values here
		timings: { "hack": 0, "grow": 0, "weaken": 0 }, // timing values stored here
		minHackChance: 0.9, // min allowed hacking chance
		waitTime: 400, // time to wait before sleeping when firing workers
		workersSent: 0, // value for tracking number of works sent
		passiveWaitTime: ns.args.includes("skeet") ? 0 : 500, // time to wait before checking for new batches *also effects prepping and tail refresh rate
		minWeakenTime: ns.args.includes("yeet") ? 1000 * 60 * 5 : 1000 * 60, // yeet mode to allow longer batches
		maxWorkers: ns.args.includes("yolo") ? 2.5e5 : 3e4, // yolo mode to raise batch count upper limit
		"print": ns.args.includes("no_hud") ? false : true, // no_hud to disable most print screen feedback
		sound: ns.args.includes("sound") ? true : false, // sound mode adds sounds to some events
		autoAdvance: ns.args.includes("advance") ? true : false, // WIP goal is for auto hacking percent increase
		update: ns.args.includes("update") ? true : false, // force worker to update every getRam call default: false
		debug: ns.args.includes("debug") ? true : false, // debug mode adds some additional info to print out
		pids: [], // container for worker pids
		modes: [] // container for enabled modes
	}, startTime = performance.now();

	if (ns.args.includes("skeet")) info.modes.push("SKEET"); // if skeet is enabled add it to info.modes
	if (ns.args.includes("yolo")) info.modes.push("YOLO"); // if yolo is enabled add it to info.modes
	if (info.sound) info.modes.push("SOUND"); // if sound is enabled add it to info.modes
	if (info.debug) info.modes.push("DEBUG"); // if debug is enabled add it to info.modes
	let heightSpacer = 0; // default height spacer
	if (info.modes.length > 0) heightSpacer = 20; // if there is a mode add space for new line
	ns.ui.resizeTail(275, 270 + heightSpacer); // set tail height with spacer
	if (info.debug) ns.ui.resizeTail(275, 435 + heightSpacer); // change height for debug stats

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
		printInfo();
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
			await ns.sleep(info.passiveWaitTime);
			info.pids = info.pids.filter(p => ns.isRunning(p)); // update pids
		}
	}

	function printInfo() {
		let title = [...info.title];
		title.push(title.shift(...title[0]));
		info.title = title.join("");
		ns.ui.setTailTitle(React.createElement("span", { style: { color: `rgb(${Math.floor(Math.random() * 155)}, 255, ${Math.floor(Math.random() * 155)})` } }, info.title));
		if (!info["print"]) return false;
		ns.clearLog();
		const tar = ns.getServer(info.target);
		if (info.modes.length > 0) ns.print(`*MODES: ${info.modes.join(", ")}`);
		ns.print("Runtime:        " + timeFormat(performance.now() - startTime, "dhms"));
		ns.print("Worker Limit:   " + ns.format.number(info.maxWorkers));
		ns.print("Active Workers: " + ns.format.number(info.pids.length));
		if (info.debug) {
			ns.print("Workers Sent:   " + ns.format.number(info.workersSent));
			ns.print("Wait Time:      " + info.waitTime);
		}
		ns.print("---Target Info---");
		ns.print("Server Name:    " + info.target);
		const secDiff = tar.hackDifficulty - tar.minDifficulty,
			moneyDiff = tar.moneyAvailable - tar.moneyMax;
		ns.print(`Security(min):  ${tar.hackDifficulty.toFixed(2)} (${tar.minDifficulty.toFixed(2)}) ${secDiff > 0 ? ns.format.number(secDiff, 2) : ""}`);
		ns.print(`Money(max):     \$${ns.format.number(tar.moneyAvailable, 2)} (\$${ns.format.number(tar.moneyMax, 2)})`); //${moneyDiff < 0 ? ns.format.number(moneyDiff) : ""}`);
		ns.printRaw(React.createElement("div", { style: { display: "flex" } }, React.createElement("span", {}, "Percentage:     "), progBar(tar.moneyAvailable / tar.moneyMax, 150, 2)));
		ns.print("Hack %($):      " + ns.format.percent(info.hack_percent, 0) + " ($" + ns.format.number(info.hackAmount, 2) + ")");
		ns.print("---Script Earnings---")
		ns.print("EXP:            " + ns.format.number(ns.getRunningScript(ns.pid).onlineExpGained, 2));
		ns.print("EXP /s(h):      " + ns.format.number(Math.floor(ns.getRunningScript(ns.pid).onlineExpGained / ((performance.now() - startTime) / (1000))), 2)
			+ " (" + ns.format.number(Math.floor(ns.getRunningScript(ns.pid).onlineExpGained / ((performance.now() - startTime) / (1000 * 60 * 60))), 2) + ")");
		ns.print("Money:          $" + ns.format.number(ns.getRunningScript(ns.pid).onlineMoneyMade, 2));
		ns.print("Money /s(h):    $" + ns.format.number(Math.floor(ns.getRunningScript(ns.pid).onlineMoneyMade / ((performance.now() - startTime) / (1000))), 2)
			+ " ($" + ns.format.number(Math.floor(ns.getRunningScript(ns.pid).onlineMoneyMade / ((performance.now() - startTime) / (1000 * 60 * 60))), 2) + ")");
		if (info.debug) {
			ns.print("---Threads---");
			ns.print("hack:           " + ns.format.number(info.threads["hack"], 0));
			ns.print("grow:           " + info.threads["grow"][0] + " ~ " + info.threads["grow"][info.threads["grow"].length - 1]);
			ns.print("weaken:         " + ns.format.number(info.threads["weaken"], 0));
			ns.print("---Timings---");
			Object.entries(info.timings).forEach(([key, value]) => ns.print(`${key}:${" ".padStart(15 - key.length)}${ns.format.time(value, true)}`));
		}
	}

	function sendBatch() {
		const ram = getRam(), instructions = [], pids = [];
		// Hack
		instructions.push(stageWorker("hack", info.timings["weaken"] - info.timings["hack"]));
		// Weaken
		instructions.push(stageWorker("weaken"));
		// Grow
		sort(true); // sort ram for grow instruction
		instructions.push(stageWorker("grow", info.timings["weaken"] - info.timings["grow"]));
		// Weaken
		sort() // sort ram back for last weaken instruction
		instructions.push(stageWorker("weaken"));

		if (instructions.includes(undefined)) return false;

		for (const instruction of instructions) {
			pids.push(ns.exec(info.workerName, instruction[1], {
				threads: instruction[3],
				ramOverride: info.workerWeight[instruction[0]],
				temporary: true
			}, info.target, instruction[2], instruction[0]));
			info.workersSent++;
		}

		return pids;

		function stageWorker(type, wait = 0) {
			for (let i = 0; i < ram.length; i++) {
				const threads = type === "grow" ? info.threads["grow"][ram[i].cpuCores - 1] : info.threads[type];
				if (ram[i].maxRam - ram[i].ramUsed < info.workerWeight[type] * threads) continue; // not enough ram to run worker
				ram[i].ramUsed += info.workerWeight[type] * threads;
				return [type, ram[i].hostname, wait, threads];
			}
		}

		function sort(gro = false) { // if true we want to sort by cores most to least
			if (gro) { // sort by cores for grow calls
				ram.sort((a, b) => b.cpuCores - a.cpuCores);
			} else { // if not sorting for grow, put home on the bottom of the list
				const storage = ram.splice(ram.map(e => e.hostname).indexOf("home"), 1)[0]; // pop home out of the list
				ram.sort((a, b) => a.maxRam - b.maxRam); // sort remaining servers by max ram, smaller to larger
				ram.push(storage); // put home back in at the bottom of the list
			}
		}
	}

	function setValues() {
		const spoof = ns.getServer(info.target);
		spoof.moneyAvailable = spoof.moneyMax;
		spoof.minDifficulty = spoof.minDifficulty;

		info.threads["hack"] = Math.max(1, Math.floor(ns.hackAnalyzeThreads(info.target, ns.getServer(info.target).moneyMax * info.hack_percent)));
		info.timings["hack"] = ns.getHackTime(info.target);
		info.hackAmount = spoof.moneyMax * ns.formulas.hacking.hackPercent(spoof, ns.getPlayer()) * info.threads["hack"];
		spoof.moneyAvailable = spoof.moneyMax - info.hackAmount;

		info.threads["grow"].length = 0; // clear old thread values
		for (let i = 1; i < 129; i++) {
			info.threads["grow"].push(ns.formulas.hacking.growThreads(spoof, ns.getPlayer(), spoof.moneyMax, i));
		}
		info.timings["grow"] = ns.getGrowTime(info.target);

		info.threads["weaken"] = Math.max(Math.ceil(info.threads["hack"] * 0.002 / ns.weakenAnalyze(1)), Math.ceil(info.threads["grow"][0] * 0.004 / ns.weakenAnalyze(1)));
		info.timings["weaken"] = ns.getWeakenTime(info.target);
	}

	async function prep() {
		const needMoney = () => ns.getServer(info.target).moneyAvailable < ns.getServer(info.target).moneyMax,
			badSec = () => ns.getServer(info.target).hackDifficulty > ns.getServer(info.target).minDifficulty,
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
			calls.length = 0; // clears calls to prevent repeating last calls

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
				await ns.sleep(info.passiveWaitTime);
			}
		}
	}

	function targetSelector() {
		const result = servers().filter(server => ns.getServer(server).hasAdminRights
			&& ns.formulas.hacking.hackChance(spoof(server), ns.getPlayer()) > info.minHackChance
			&& ns.formulas.hacking.weakenTime(spoof(server), ns.getPlayer()) < info.minWeakenTime
			&& ns.getServer(server).moneyMax > 0
			& ns.getServer(server).requiredHackingSkill < ns.getPlayer().skills.hacking);

		if (result.length > 0) {
			const interest = server => ns.getServer(server).moneyMax * ns.getServer(server).serverGrowth;
			result.sort((a, b) => interest(b) - interest(a));
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