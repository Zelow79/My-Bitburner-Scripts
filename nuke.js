export const main = async (ns) => {
	const target = ns.args[0] ?? "n00dles"
	const cracks = [{ name: "BruteSSH", doIt: () => ns.brutessh(target) },
	{ name: "FTPCrack", doIt: () => ns.ftpcrack(target) },
	{ name: "relaySMTP", doIt: () => ns.relaysmtp(target) },
	{ name: "HTTPWorm", doIt: () => ns.httpworm(target) },
	{ name: "SQLInject", doIt: () => ns.sqlinject(target) }]
	cracks.forEach(crack => {
		cracker(crack.name + ".exe");
		if (ns.ls("home").includes(crack.name + ".exe")) crack.doIt();
	});
	ns.nuke(target);
	function cracker(crack) {
		if (ns.singularity.purchaseTor()) ns.singularity.purchaseProgram(crack);
	}
}