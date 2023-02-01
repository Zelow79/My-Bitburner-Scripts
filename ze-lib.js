export function getAllServers(ns) {
	const x = new Set(["home"]);
	for (const server of x) {
		for (const connectServer of ns.scan(server)) {
			x.add(connectServer);
		}
	}
	return Array.from(x);
}

export const cities = ["Sector-12", "Aevum", "Volhaven", "Chongqing", "New Tokyo", "Ishima"]

export function serverInfo(ns, serverName, threads = 1, cores = 1) { // lazy object with server info and other useful server information
	const player = ns.getPlayer();
	const server = ns.getServer(serverName);
	const hf = ns.formulas.hacking
	return {
		...ns.getServer(serverName),
		scripts: ns.ps(serverName),
		growPercent: hf.growPercent(server, threads, player, cores),
		hackTime: hf.hackTime(server, player),
		growTime: hf.growTime(server, player),
		weakenTime: hf.weakenTime(server, player),
		hackChance: hf.hackChance(server, player),
		hackPercent: hf.hackPercent(server, player),
		hackExp: hf.hackExp(server, player)
	};
}

export async function bdServer(ns, server) { // courtesy of Mughur from the discord. handy way to bd a target
	ns.singularity.connect("home");
	let route = [server]
	while (route[0] != "home") {
		route.unshift(ns.scan(route[0])[0]);
	}
	for (let server of route) {
		ns.singularity.connect(server);
	}
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

export function format(value, maxFracDigits = 2, minFracDigits = 0) {
	const locale = "en-US"
	const notation = (value >= 1e15) ? "scientific" : "compact"
	return Intl.NumberFormat(locale, {
		notation: notation,
		compactDisplay: "short",
		//roundingMode: "trunc",
		maximumFractionDigits: maxFracDigits,
		minimumFractionDigits: minFracDigits
	}).format(value).toLocaleLowerCase();
}

export function numPad(value, digits) {
	return value.toString().length < digits ? '0'.repeat(digits - value.toString().length) + value : value
}

export function round(value, precision) { // rounds accurately to the precision value, which determines decimal place IE, 1 = 0.0, 2 = 0.00
	var multiplier = Math.pow(10, precision || 0);
	return Math.round(value * multiplier) / multiplier;
}

export function diceBar(progress, length = 15) { // progress bar with random dice as the bar, also color coded, orginal design came from NightElf from BB discord
	const diceSet = ["", "", "", "", "", ""]
	const empty = " "
	const progressValue = Math.min(progress, 1);

	const colors = [196, 202, 226, 46, 33];
	const fullColor = "white";

	const categoryValue = Math.min(colors.length - 1, Math.floor(progressValue * colors.length));
	const color = progressValue < 1 ? colors[categoryValue] : fullColor;

	const barProgress = Math.floor(progressValue * length);
	const array = []
	for (let i = 0; i < barProgress; i++) { array.push(diceSet[Math.floor(Math.random() * diceSet.length)]); }
	for (let i = 0; i < length - barProgress; i++) { array.push(empty); }
	return `[${colorPicker(array.join(""), color)}]`;
}

export function bar(progress, bar = true, length = 15) { // progress bar, orginal design came from NightElf from BB discord
	if (bar == true) bar = "#"
	const empty = " "
	const progressValue = Math.min(progress, 1);
	const barProgress = Math.floor(progressValue * length);

	const colors = [196, 202, 226, 46, 33];
	const fullColor = "white";

	const categoryValue = Math.min(colors.length - 1, Math.floor(progressValue * colors.length));
	const color = progressValue < 1 ? colors[categoryValue] : fullColor;

	const array = new Array(barProgress).fill(bar).concat(new Array(length - barProgress).fill(empty));
	return `[${colorPicker(array.join(""), color)}]`;
}

export function colorPicker(x, color) { // x = what you want colored
	let y;
	switch (color) {
		case "black":
			y = `\u001b[30m${x}\u001b[0m`
			break;
		case "red":
			y = `\u001b[31m${x}\u001b[0m`
			break;
		case "green":
			y = `\u001b[32m${x}\u001b[0m`
			break;
		case "yellow":
			y = `\u001b[33m${x}\u001b[0m`
			break;
		case "blue":
			y = `\u001b[34m${x}\u001b[0m`
			break;
		case "magenta":
			y = `\u001b[35m${x}\u001b[0m`
			break;
		case "cyan":
			y = `\u001b[36m${x}\u001b[0m`
			break;
		case "white":
			y = `\u001b[37m${x}\u001b[0m`
			break;
		default:
			y = `\u001b[38;5;${color}m${x}\u001b[0m`
	}
	return y;
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