export const cities = ["Sector-12", "Aevum", "Volhaven", "Chongqing", "New Tokyo", "Ishima"];

export function getAllServers(ns, homeless = false) {
	const x = new Set(["home"]);
	x.forEach(server => ns.scan(server).forEach(connectServer => x.add(connectServer)));
	if (homeless) x.delete("home");
	return Array.from(x);
}

export function pathFinder(ns, server) {
	const path = [server];
	while (path[0] !== "home") path.unshift(ns.scan(path[0])[0]);
	return path;
}

export function hgw(ns, serverName, host = "home", sleepTime = 0, pingPort = false, finishTime = 0) {
	const ahhgs = [serverName, sleepTime, pingPort, finishTime];
	console.log("args:"); console.log(ahhgs);
	return {
		nukeIt: () => ns.exec("nuke.js", "home", 1, serverName),
		hackIt: (t = 1) => ns.exec("hack.js", host, t, ...ahhgs),
		growIt: (t = 1) => ns.exec("grow.js", host, t, ...ahhgs),
		weakIt: (t = 1) => ns.exec("weaken.js", host, t, ...ahhgs)
	};
}

export function makeHGW(ns, location = null) {
	const tools = ["hack", "grow", "weaken"],
		pingPort = `if (ns.args[2]) {\n		const p = ns.getPortHandle(ns.pid + 100); \n		p.write("started"); \n		p.clear(); \n	}\n`,
		maker = (func) => `export const main = async (ns) => {\n	${pingPort}	await ns.${func}(ns.args[0], { additionalMsec: ns.args[1] ?? 0 }); \n}`;
	location = location ?? "home";
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
	let route = [server];
	while (route[0] != "home") route.unshift(ns.scan(route[0])[0]);
	for (const server of route) ns.singularity.connect(server);
	await ns.singularity.installBackdoor();
	ns.singularity.connect("home");
}

export function formatPercent(value, maxFracDigits = 2, minFracDigits = 0) {
	const locale = "en-US";
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

export function tem(text, color = "rainbow") {
	const eleMaker = (t, c) => React.createElement("span", { style: c }, t),
		result = [];
	color === "rainbow" ? text.split('').forEach(l => result.push(eleMaker(l, { color: `rgb(${Math.random() * 255},${Math.random() * 255},${Math.random() * 255})` }))) :
		result.push(eleMaker(text, color));
	return result;
}

export function sillyNumbers(value, decimals = 3) { //bastardized xsinx's FormatMoney function
	if (Math.abs(value) >= 1e69) return '$' + value.toExponential(0);
	for (const pair of [[1e66, 'Uv'], [1e63, 'v'], [1e60, 'N'], [1e57, 'O'], [1e54, 'St'], [1e51, 'Sd'], [1e48, 'Qd'], [1e45, 'Qt'], [1e42, 'T'], [1e39, 'D'], [1e36, 'u'], [1e33, 'd'], [1e30, 'n'], [1e27, 'o'], [1e24, 'S'], [1e21, 's'], [1e18, 'Q'], [1e15, 'q'], [1e12, 't'], [1e9, 'b'], [1e6, 'm'], [1e3, 'k']])
		if (Math.abs(value) >= pair[0]) return (Math.sign(value) < 0 ? "-" : "") + (Math.abs(value) / pair[0]).toFixed(decimals) + pair[1];
	return '$' + (Math.sign(value) < 0 ? "-" : "") + Math.abs(value).toFixed(decimals);
}

export function numPad(value, digits) {
	return value.toString().length < digits ? '0'.repeat(digits - value.toString().length) + value : value.toString();
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
	if (bar == true) bar = "#";
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

export function progBar(progress, width = 200, deci = 0) {
	if (isNaN(progress)) return false;
	progress = Math.max(0, Math.min(progress, 1));
	const height = "18px",
		colors = ["#a80100", "#a70200", "#a50300", "#a30300", "#a20400", "#a00500", "#9e0600", "#9d0700", "#9b0800", "#990800", "#970900", "#960a00", "#940b00", "#920c00", "#910d00", "#8f0d00", "#8d0e00", "#8c0f00", "#8a1000", "#881100", "#871200",
			"#851300", "#831300", "#821400", "#801500", "#7e1600", "#7d1700", "#7b1800", "#791800", "#781900", "#761a00", "#741b00", "#721c00", "#711d00", "#6f1d00", "#6d1e00", "#6c1f00", "#6a2000", "#682100", "#672200", "#652300", "#632300", "#622400",
			"#602500", "#5e2600", "#5d2700", "#5b2800", "#592800", "#582900", "#562a00", "#542b00", "#522c00", "#512d00", "#4f2d00", "#4d2e00", "#4c2f00", "#4a3000", "#483100", "#473200", "#453200", "#433300", "#423400", "#403500", "#3e3600", "#3d3700",
			"#3b3800", "#393800", "#383900", "#363a00", "#343b00", "#323c00", "#313d00", "#2f3d00", "#2d3e00", "#2c3f00", "#2a4000", "#284100", "#274200", "#254200", "#234300", "#224400", "#204500", "#1e4600", "#1d4700", "#1b4800", "#194800", "#184900",
			"#164a00", "#144b00", "#134c00", "#114d00", "#0f4d00", "#0d4e00", "#0c4f00", "#0a5000", "#085100", "#075200", "#055200", "#035300", "#025400"],
		progressBar = React.createElement("div", { style: { height: "100%", "line-height": height, width: (progress * 100) + "%", "background-color": colors[Math.floor(progress * 100) - 1], "text-align": "center", "white-space": "nowrap" } }, (progress * 100).toFixed(deci) + "%");
	return React.createElement("div", { style: { height: height, width: width + "px", color: "white", border: "1px solid rgb(255,255,255)" } }, progressBar);
}

export function art(x, style) {                                     // x = what you want colored
	const o = {                                                      // accepts style as an object, all options are optional
		color: !isNaN(style.color) ? style.color : -1,                // style.color uses 256 color codes
		background: !isNaN(style.background) ? style.background : -1, // style.background 256 color codes aswell
		bold: style.bold ? true : false,                              // style.bold is boolean true for bold else false
		underline: style.underline ? true : false                     // style.underline is boolean true for underline else false
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
		pad = (n) => n < 10 ? '0' + n : n;
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
		pad = (n) => n < 10 ? '0' + n : n;
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
		msPad = (n) => n.toString().length < 3 ? '0'.repeat(3 - n.toString().length) + n : n;
	if (ms === 1000) { s++; ms = 0 }
	if (s === 60) { m++; s = 0 }
	if (m === 60) { h++; m = 0 }
	return [pad(h), pad(m), pad(s), msPad(ms)].join(':');
}

export function timeFormat(t, v = null) { // t is in ms
	let cd = 8.64e7, ch = 3.6e6, cm = 6e4, mf = Math.floor, mr = Math.round,
		d = mf(t / cd), h = mf((t - d * cd) / ch), m = mf((t - d * cd - h * ch) / cm),
		s = mf((t - d * cd - h * ch - m * cm) / 1000), ms = mr(t - d * cd - h * ch - m * cm - s * 1000),
		pad = (n) => n < 10 ? '0' + n : n, msPad = (n) => (n + "").length < 3 ? '0'.repeat(3 - (n + "").length) + n : n;
	if (ms === 1000) { s++; ms = 0; }
	if (s === 60) { m++; s = 0; }
	if (m === 60) { h++; m = 0; }
	if (v === "hmsms") return [pad(h + d * 24), pad(m), pad(s), msPad(ms)].join(':');
	if (v === "hms") return [pad(h + d * 24), pad(m), pad(s)].join(':');
	if (h === 24) { d++; h = 0; }
	if (v === "dhms") return [pad(d), pad(h), pad(m), pad(s)].join(':');
	return [pad(d), pad(h), pad(m), pad(s), msPad(ms)].join(':');
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

export function playSound(url) {
	const audio = new Audio();
	audio.src = url;
	audio.play();
}

export function cipher(word, code = [420]) { //word to be ciphered and array of secret codes for encryption
	if (!word || code.length < 1) return null;

	function process(w, c) {
		const encrypted = []; //storage for encryption
		for (let i = 0; i < w.length; i++) { //iterate word letter by letter
			encrypted.push(w.charCodeAt(i) ^ c); //convert letter to char number and xor bit shift by code
		}
		return String.fromCharCode(...encrypted) //return converted char numbers back to string
	}
	let result = word; //result will be modified based on number of codes given in code array
	for (let i = 0; i < code.length; i++) {
		result = process(result, code[i]);
	}
	return result;
}

export function tableMaker(data, columns = 4, tableProps = null, tdProps = null) {  // data is an array of Numbers or Strings
	const tableRows = [],                                                     // Requires ns.printRaw() or ns.tprintRaw()
		defacto = { style: { border: "2px solid green" } },
		tabProps = tableProps ?? defacto,
		datProps = tdProps ?? defacto;
	data.reverse();
	while (data.length > 0) tableRows.push(createRow());
	return React.createElement("table", tabProps, tableRows);

	function createRow() {
		let content = [],
			i = data.length,
			j = 0;
		while (data.length > 0 && i--) {
			if (j >= columns) break;
			content.push(React.createElement("td", datProps, data[i]));
			data.splice(i, 1);
			j++;
		}
		return React.createElement("tr", null, content);
	}
}

// experimental table, first take.
export function createTable(width, columns, data) { // data is an array of strings and/or numbers going row, by row starting with header
	const tablePad = (x, y, z = " ") => x.toString().padStart(y, z).substring(0, y),
		cellPad = Math.floor(width / columns - (columns - 1));
	while (!Number.isInteger(data.length / columns)) {
		data.push(" ");
	}
	let content = "",
		i = data.length,
		j = 0;
	data.reverse();
	const divider = "\n" + "├" + "─".repeat(cellPad * columns + (columns * 2 - 1)) + "┤" + "\n";
	content += "\n" + "┌" + "─".repeat(cellPad * columns + (columns * 2 - 1)) + "┐" + "\n"
	while (i--) {
		if (j >= columns) break;
		content += "|" + tablePad(data[i], cellPad) + " ";
		data.splice(i, 1);
		j++;
	}
	content += "|";
	content += divider;
	content += createRows(columns, data);
	content += "\n" + "└" + "─".repeat(cellPad * columns + (columns * 2 - 1)) + "┘" + "\n";
	return `${content}`;

	function createRows(columns, data) {
		let content = "",
			i = data.length,
			j = 0;
		while (i--) {
			if (j >= columns) {
				content += "|\n"; // create new row
				j = 0; // reset column counter
			}
			content += "|" + tablePad(data[i], cellPad) + " ";
			data.splice(i, 1);
			j++;
		}
		return `${content}|`;
	}
}

export const totallyNotImportant = () => playSound("https://soundspunos.com/uploads/files/2022-05/1651865406_1651485572_18775-rickroll354.mp3");