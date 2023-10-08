/** @param {NS} ns */
export async function main(ns) {
	ns.tail(); ns.disableLog('ALL');
	const target = "joesguns",
		targetDeets = ns.getServer(target);

	if (ns.args[0]) { //if first argument evaluates true, nuke all servers
		for (const server of getAllServers(true)) {
			const serv = ns.getServer(server);
			if (serv.hasAdminRights) continue; //if server is already nuked skip
			hgw(server).nukeIt();
		}
	}

	while (1) {
		ns.clearLog(); //clears log to display new information on clear log
		ns.print("Exp gain rate: " + ns.formatNumber(Math.floor(ns.getRunningScript(ns.pid).onlineExpGained / ns.getRunningScript(ns.pid).onlineRunningTime)) + " /sec");
		ns.print("Exp gained:    " + ns.formatNumber(ns.getRunningScript(ns.pid).onlineExpGained));
		for (const server of getAllServers(ns)) {
			const serv = ns.getServer(server),
				threads = Math.floor((serv.maxRam - serv.ramUsed) / 1.75);
			if (!serv.hasAdminRights || threads < 1) continue;
			if (!ns.ls(server).includes("grow.js") || !ns.ls(server).includes("weaken.js")) makeHGW(server);
			if (targetDeets.hackDifficulty > targetDeets.minDifficulty) {
				hgw(target, server).weakIt(threads);
				continue;
			}
			hgw(target, server).growIt(threads);
		}
		await ns.sleep(100);
	}

	function getAllServers(homeless = false) {
		const x = new Set(["home"]);
		x.forEach(server => ns.scan(server).forEach(connectServer => x.add(connectServer)));
		if (homeless) x.delete("home");
		return Array.from(x);
	}

	function makeHGW(location = null) {
		const tools = ["grow", "weaken"],
			pingPort = `if (ns.args[2]) {\n		const p = ns.getPortHandle(ns.pid + 100); \n		p.write("started"); \n		p.clear(); \n	}\n`,
			maker = (func) => `export const main = async (ns) => {\n	${pingPort}	await ns.${func}(ns.args[0], { additionalMsec: ns.args[1] ?? 0 }); \n}`;
		location = location ?? "home";
		tools.forEach(tool => {
			ns.write(tool + ".js", maker(tool), "w");
			if (location !== "home") ns.scp(tool + ".js", location);
		});
	}

	function hgw(serverName, host = "home", sleepTime = 0, pingPort = false) {
		const ahhgs = [serverName, sleepTime, pingPort];
		console.log("args:"); console.log(ahhgs);
		return {
			nukeIt: () => ns.exec("nuke.js", "home", 1, serverName), //if first argument evaluates true home will need a nuke.js script
			growIt: (t = 1) => ns.exec("grow.js", host, t, ...ahhgs),
			weakIt: (t = 1) => ns.exec("weaken.js", host, t, ...ahhgs)
		};
	}
}