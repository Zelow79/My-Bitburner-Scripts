export const cities = ["Sector-12", "Aevum", "Volhaven", "Chongqing", "New Tokyo", "Ishima"]

export function getAllServers(ns, homeless = false) {
	const x = new Set(["home"]);
	for (const server of x) {
		for (const connectServer of ns.scan(server)) {
			x.add(connectServer);
		}
	}
	if (homeless) x.delete("home");
	return Array.from(x);
}

export function pathFinder(ns, server) {
	const path = [server]
	while (path[0] !== "home") path.unshift(ns.scan(path[0])[0]);
	return path;
}

export function serverInfo(ns, serverName, threads = 1, cores = 1, host = null, sleepTime = 0) { // lazy object with server info and other useful server information
	const [player, server, hf] = [ns.getPlayer(), ns.getServer(serverName), ns.formulas.hacking]
	return {
		...server,
		scripts: () => ns.ps(serverName),
		itsGrowPercent: () => hf.growPercent(server, threads, player, cores),
		itsHackTime: () => hf.hackTime(server, player),
		itsGrowTime: () => hf.growTime(server, player),
		itsWeakTime: () => hf.weakenTime(server, player),
		itsHackChance: () => hf.hackChance(server, player),
		itsHackPercent: () => hf.hackPercent(server, player),
		itsHackExp: () => hf.hackExp(server, player),
		nukeIt: () => scriptLaunch(ns, "nuke.js", serverName),
		hackIt: (t = 1) => scriptLaunch(ns, "hack.js", serverName, t, host, sleepTime),
		growIt: (t = 1) => scriptLaunch(ns, "grow.js", serverName, t, host, sleepTime),
		weakIt: (t = 1) => scriptLaunch(ns, "weaken.js", serverName, t, host, sleepTime)
	};
}

export function hgw(ns, serverName, host = null, sleepTime = 0) {
	return {
		nukeIt: () => scriptLaunch(ns, "nuke.js", serverName),
		hackIt: (t = 1) => scriptLaunch(ns, "hack.js", serverName, t, host, sleepTime),
		growIt: (t = 1) => scriptLaunch(ns, "grow.js", serverName, t, host, sleepTime),
		weakIt: (t = 1) => scriptLaunch(ns, "weaken.js", serverName, t, host, sleepTime)
	};
}

export function scriptLaunch(ns, scriptName, serverName, t = 1, host = null, sleepTime = 0) { // sleepTime in ms
	host = host ?? ns.getHostname();
	const [runningScripts, genSerial] = [ns.ps(host), () => numPad(Math.floor(Math.random() * 999999999), 9)];
	let serial = genSerial();
	while (runningScripts.some(script => script.filename === scriptName && script.args[0] === serverName && script.args[2] === serial)) {
		serial = genSerial();
	}
	return ns.exec(scriptName, host, t, serverName, sleepTime, serial);
}

export function makeHGW(ns, location = null) {
	const tools = ["hack", "grow", "weaken"],
		maker = (func) => `export const main = async (ns) => await ns.${func}(ns.args[0], { additionalMsec: isNaN(ns.args[1]) ? 0 : ns.args[1] });`
	location = location ?? "home"
	tools.forEach(tool => {
		ns.write(tool + ".js", maker(tool), "w");
		if (location !== "home") ns.scp(tool + ".js", location);
	});
}

export function shareIt(ns, target) {
	const shareScript = `export const main = async (ns) => { while (1) await ns.share(); }`
	ns.write("share.js", shareScript, "w");
	if (ns.scp("share.js", target)) {
		const freeRam = ns.getServerMaxRam(target) - ns.getServerUsedRam(target);
		if (freeRam < 4) return null;
		const threads = Math.max(Math.floor(freeRam / 4), 1);
		return ns.exec("share.js", target, threads);
	}
}

export async function bdServer(ns, server) { // courtesy of Mughur from the discord. handy way to bd a target
	ns.singularity.connect("home");
	let route = [server]
	while (route[0] != "home") route.unshift(ns.scan(route[0])[0]);
	for (const server of route) ns.singularity.connect(server);
	await ns.singularity.installBackdoor();
	ns.singularity.connect("home");
}

export function formatPercent(value, maxFracDigits = 2, minFracDigits = 0) {
	const locale = "en-US"
	return Intl.NumberFormat(locale, {
		style: "percent",
		maximumFractionDigits: maxFracDigits,
		minimumFractionDigits: minFracDigits
	}).format(value);
}

export function formatGB(bytes, dm = 0) {
	if (bytes == 0) return '0 Bytes';
	var k = 1024,
		sizes = [`${bytes <= 1 ? "Byte" : "Bytes"}`, 'KB', 'MB', 'GB', 'TB', 'PB', 'EB', 'ZB', 'YB'],
		i = Math.floor(Math.log(bytes) / Math.log(k));
	return parseFloat((bytes / Math.pow(k, i)).toFixed(dm)) + sizes[i];
}

export function format(value, maxFracDigits = 3, minFracDigits = 0) {
	const locale = "en-US"
	const notation = (value >= 1e15 || value <= -1e15) ? "scientific" : "compact"
	return Intl.NumberFormat(locale, {
		notation: notation,
		compactDisplay: "short",
		roundingMode: "trunc",
		maximumFractionDigits: maxFracDigits,
		minimumFractionDigits: minFracDigits
	}).format(value).toLocaleLowerCase();
}

export function sillyNumbers(value, decimals = 3) { //bastardized xsinx's FormatMoney function
	if (Math.abs(value) >= 1e69) return '$' + value.toExponential(0);
	for (const pair of [[1e66, 'Uv'], [1e63, 'v'], [1e60, 'N'], [1e57, 'O'], [1e54, 'St'], [1e51, 'Sd'], [1e48, 'Qd'], [1e45, 'Qt'], [1e42, 'T'], [1e39, 'D'], [1e36, 'u'], [1e33, 'd'], [1e30, 'n'], [1e27, 'o'], [1e24, 'S'], [1e21, 's'], [1e18, 'Q'], [1e15, 'q'], [1e12, 't'], [1e9, 'b'], [1e6, 'm'], [1e3, 'k']])
		if (Math.abs(value) >= pair[0]) return (Math.sign(value) < 0 ? "-" : "") + (Math.abs(value) / pair[0]).toFixed(decimals) + pair[1];
	return '$' + (Math.sign(value) < 0 ? "-" : "") + Math.abs(value).toFixed(decimals);
}

export function numPad(value, digits) {
	return value.toString().length < digits ? '0'.repeat(digits - value.toString().length) + value : value.toString()
}

export function round(value, precision) { // rounds accurately to the precision value, which determines decimal place IE, 1 = 0.0, 2 = 0.00
	var multiplier = Math.pow(10, precision || 0);
	return Math.round(value * multiplier) / multiplier;
}

export function diceBar(progress, length = 15) { // progress bar with random dice as the bar, also color coded, orginal design came from NightElf from BB discord
	const diceSet = ["", "", "", "", "", ""],
		empty = " ",
		progressValue = Math.min(progress, 1),
		colors = [196, 202, 226, 46, 33],
		fullColor = 255,
		categoryValue = Math.min(colors.length - 1, Math.floor(progressValue * colors.length)),
		color = progressValue < 1 ? colors[categoryValue] : fullColor,
		barProgress = Math.floor(progressValue * length),
		array = [];
	for (let i = 0; i < barProgress; i++) { array.push(diceSet[Math.floor(Math.random() * diceSet.length)]); }
	for (let i = 0; i < length - barProgress; i++) { array.push(empty); }
	return `[${art(array.join(""), { color })}]`;
}

export function bar(progress, bar = true, length = 15) { // progress bar, orginal design came from NightElf from BB discord
	if (bar == true) bar = "#"
	const empty = " ",
		progressValue = Math.min(progress, 1),
		barProgress = Math.floor(progressValue * length),
		colors = [196, 202, 226, 46, 33],
		fullColor = 255,
		categoryValue = Math.min(colors.length - 1, Math.floor(progressValue * colors.length)),
		color = progressValue < 1 ? colors[categoryValue] : fullColor,
		array = new Array(barProgress).fill(bar).concat(new Array(length - barProgress).fill(empty));
	return `[${art(array.join(""), { color })}]`;
}

export function art(x, style) {                                     // x = what you want colored
	const o = {                                                      // accepts style as an object, all options are optional
		color: !isNaN(style.color) ? style.color : -1,                // style.color uses 256 color codes
		background: !isNaN(style.background) ? style.background : -1, // style.background 256 color codes aswell
		bold: style.bold ? true : false,                              // style.bold is boolean true for bold else false
		underline: style.underline ? true : false                     // style.unders is boolean true for underline else false
	}
	return `\x1b[${o.color >= 0 ? `38;5;${o.color}` : null}${o.bold ? ";1" : null}${o.underline ?
		";4" : null}${o.background >= 0 ? `;48;5;${o.background}` : null}m${x}\x1b[0m`;
}

export function dhms(t) { // t is in ms
	var cd = 24 * 60 * 60 * 1000,
		ch = 60 * 60 * 1000,
		cm = 60 * 1000,
		d = Math.floor(t / cd),
		h = Math.floor((t - d * cd) / ch),
		m = Math.floor((t - d * cd - h * ch) / cm),
		s = Math.round((t - d * cd - h * ch - m * cm) / 1000),
		pad = (n) => n < 10 ? '0' + n : n
	if (s === 60) { m++; s = 0 }
	if (m === 60) { h++; m = 0 }
	if (h === 24) { d++; h = 0 }
	return [d, pad(h), pad(m), pad(s)].join(':');
}

export function hms(t) { // t is in ms
	var ch = 60 * 60 * 1000,
		cm = 60 * 1000,
		h = Math.floor(t / ch),
		m = Math.floor((t - h * ch) / cm),
		s = Math.round((t - h * ch - m * cm) / 1000),
		pad = (n) => n < 10 ? '0' + n : n
	if (s === 60) { m++; s = 0 }
	if (m === 60) { h++; m = 0 }
	return [pad(h), pad(m), pad(s)].join(':');
}

export function hmsms(t) { // t is in ms
	var ch = 60 * 60 * 1000,
		cm = 60 * 1000,
		h = Math.floor(t / ch),
		m = Math.floor((t - h * ch) / cm),
		s = Math.floor((t - h * ch - m * cm) / 1000),
		ms = Math.round(t - h * ch - m * cm - s * 1000),
		pad = (n) => n < 10 ? '0' + n : n,
		msPad = (n) => n.toString().length < 3 ? '0'.repeat(3 - n.toString().length) + n : n
	if (ms === 1000) { s++; ms = 0 }
	if (s === 60) { m++; s = 0 }
	if (m === 60) { h++; m = 0 }
	return [pad(h), pad(m), pad(s), msPad(ms)].join(':');
}

export const names = [
	"Negative Nancy",
	"Debbie Downer",
	"Nervous Nellie",
	"Chatty Kathy",
	"Average Joe",
	"Handy Andy",
	"Gloomy Gus",
	"Good-Time Charlie",
	"Joe Blow",
	"Mary Sue",
	"Peeping Tom",
	"Plain Jane",
	"Simple Simon",
	"Ready Freddy",
	"Nosy Nelly",
	"Bummer Betsy",
	"Pissy Chrissy",
	"Melancholy Molly",
	"Sad Susan",
	"Awful Adam",
	"Crabby Abby",
	"Tricky Ricky",
	"Nasty Nate",
	"Loose Lucy",
	"Sticky Nicki",
	"Rude Jude",
	"Freaky Frank",
	"Feral Cheryl"
]

// experimental table, first take.
export function createTable(width, columns, data) { // data is an array of strings and/or numbers going row, by row starting with header
	const tablePad = (x, y, z = " ") => x.toString().padStart(y, z).substring(0, y);
	const cellPad = Math.floor(width / columns - (columns - 1))
	while (!Number.isInteger(data.length / columns)) {
		data.push(" ");
	}
	let content = ""
	let i = data.length
	data.reverse();
	let j = 0
	const divider = "\n" + "├" + "─".repeat(cellPad * columns + (columns * 2 - 1)) + "┤" + "\n";
	content += "\n" + "┌" + "─".repeat(cellPad * columns + (columns * 2 - 1)) + "┐" + "\n"
	while (i--) {
		if (j >= columns) break;
		content += "|" + tablePad(data[i], cellPad) + " ";
		data.splice(i, 1);
		j++
	}
	content += "|"
	content += divider
	content += createRows(columns, data);
	content += "\n" + "└" + "─".repeat(cellPad * columns + (columns * 2 - 1)) + "┘" + "\n"
	return `${content}`

	function createRows(columns, data) {
		let content = ""
		let i = data.length
		let j = 0
		while (i--) {
			if (j >= columns) {
				content += "|\n"; // create new row
				j = 0; // reset column counter
			}
			content += "|" + tablePad(data[i], cellPad) + " ";
			data.splice(i, 1);
			j++
		}
		return `${content}|`
	}
}