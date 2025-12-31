/** @param {NS} ns */
export async function main(ns) {
	ns.disableLog("sleep");
	if (ns.args.includes("tail")) ns.ui.openTail();
	const h = ns.hacknet;
	while (1) {
		ns.clearLog();
		const servers = [],
			serversInfo = [],
			// default max values if not changed when called in args
			max = { servers: 10, ram: 8192, cores: 32, cache: 1, level: 20 }

		for (let i = 0; i < h.numNodes(); i++) servers.push(i);

		for (const arrrg of ns.args) { // check args for new max values
			if (typeof arrrg === "string"
				&& arrrg.includes(":")
				&& max[arrrg.split(":")[0]] // if first value is a property on max
				&& !isNaN(parseInt(arrrg.split(":")[1]))) { // and a number
				max[arrrg.split(":")[0]] = parseInt(arrrg.split(":")[1]); // set that property to new nummber
			}
		}

		const cutoff = Math.min(max.servers, h.maxNumNodes()), // cut off for if script should purchase new servers
			checkLevels = () => servers.map(s => h.getNodeStats(s)).reduce((c, a) => c + a.level, 0); // get total server levels

		if (h.numNodes() < cutoff) h.purchaseNode(); // if server count below cutoff try to buy new server

		updateInfo(); // update initial array

		// upgrade ram
		serversInfo.sort((a, b) => a.ram - b.ram);
		for (const hServer of serversInfo) h.upgradeRam(hServer.index); // upgrade ram

		// upgrade cores
		serversInfo.sort((a, b) => a.cores - b.cores);
		for (const hServer of serversInfo) h.upgradeCore(hServer.index); // upgrade cores

		// upgrade cache
		serversInfo.sort((a, b) => a.cache - b.cache);
		for (const hServer of serversInfo) h.upgradeCache(hServer.index); // upgrade cores

		if (checkLevels() < max.level * h.numNodes()) { // upgrade level until total is 100
			serversInfo.sort((a, b) => a.level - b.level);
			for (const server of serversInfo) {
				if (checkLevels() >= max.level * h.numNodes()) continue; // skip if total max level achieved
				if (server.level < max.level) h.upgradeLevel(server.index); // skip if individual level achieved
			}
		}

		updateInfo(); // update serversInfo

		const check = {
			servers: h.numNodes() >= cutoff,
			ram: servers.every(s => h.getNodeStats(s).ram >= max.ram),
			cores: servers.every(s => h.getNodeStats(s).cores >= max.cores),
			cache: servers.every(s => h.getNodeStats(s).cache >= max.cache),
			level: checkLevels() >= max.level * h.numNodes()
		}

		// max length of server stat values for print padding
		let maxLen = { serverName: 0, level: 0, ram: 0, cores: 0, cache: 0 }
		for (const server of serversInfo) {
			if (maxLen.serverName < server.name.length) maxLen.serverName = server.name.length;
			if (maxLen.level < server.level.toString().length) maxLen.level = server.level.toString().length;
			if (maxLen.ram < ns.format.ram(server.ram).length) maxLen.ram = ns.format.ram(server.ram).length;
			if (maxLen.cores < server.cores.toString().length) maxLen.cores = server.cores.toString().length;
			if (maxLen.cache < server.cache.toString().length) maxLen.cache = server.cache.toString().length;
		}

		ns.print("Active servers: " + servers.length + "/" + cutoff);
		ns.print("Total level:    " + checkLevels() + "/" + max.level * h.numNodes());
		ns.print("Cap Values:     " + JSON.stringify(max));
		ns.print("Caps Reached:   " + JSON.stringify(check));
		for (const server of serversInfo) {
			ns.print(`-${(server.name + ":").padEnd(maxLen.serverName + 1, " ")
				} Level: ${server.level.toString().padStart(maxLen.level, " ")
				} -- Ram: ${ns.format.ram(server.ram).padStart(maxLen.ram, " ")
				} -- Cores: ${server.cores.toString().padStart(maxLen.cores, " ")
				} -- Cache: ${server.cache.toString().padStart(maxLen.cache, " ")}`);
		}

		if (check.servers && check.level && check.ram && check.cores && check.cache) {
			ns.print("Jobs Done"); // kill script if we complete all our goals
			ns.exit();
		}
		await ns.sleep(0);

		function updateInfo() {
			serversInfo.length = 0; // empty old array
			for (let i = 0; i < h.numNodes(); i++) serversInfo.push({ index: i, ...h.getNodeStats(i) }); // populate array
		}
	}
}