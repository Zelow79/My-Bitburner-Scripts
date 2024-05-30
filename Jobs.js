//export const companyNames = ["ECorp", "MegaCorp", "Bachman & Associates", "Blade Industries",
//	"NWO", "Clarke Incorporated", "OmniTek Incorporated", "Four Sigma", "KuaiGong International",
//	"Fulcrum Technologies", "Storm Technologies", "DefComm", "Helios Labs", "VitaLife", "Icarus Microsystems",
//	"Universal Energy", "Galactic Cybersystems", "AeroCorp", "Omnia Cybersystems", "Solaris Space Systems", "DeltaOne",
//	"Global Pharmaceuticals", "Nova Medical", "Central Intelligence Agency", "National Security Agency", "Watchdog Security",
//	"LexoCorp", "Rho Construction", "Alpha Enterprises", "Aevum Police Headquarters", "SysCore Securities", "CompuTek",
//	"NetLink Technologies", "Carmichael Security", "FoodNStuff", "Joe's Guns", "Omega Software", "Noodle Bar"];

export const compWithFac = [["ECorp", "ECorp"], ["MegaCorp", "MegaCorp"], ["Bachman & Associates", "Bachman & Associates"],
["Blade Industries", "Blade Industries"], ["NWO", "NWO"], ["Clarke Incorporated", "Clarke Incorporated"],
["OmniTek Incorporated", "OmniTek Incorporated"], ["Four Sigma", "Four Sigma"], ["KuaiGong International", "KuaiGong International"],
["Fulcrum Technologies", "Fulcrum Secret Technologies"]];

export class Jobs {
	/** @param {NS} ns */
	constructor(ns, companyName) {
		this.companyName = companyName;
		this.favor = ns.singularity.getCompanyFavor(companyName);
		this.jobs = [];
		//this.ns = ns;
		this.applyBest = () => {
			let j = this.jobs;
			j = j.filter(x => x.requiredReputation === 0);
			j.sort((a, b) => b.reputation - a.reputation);
			j[0].apply();
		}

		for (const position of ns.singularity.getCompanyPositions(companyName)) {
			this.jobs.push({
				companyName,
				...ns.formulas.work.companyGains(ns.getPlayer(), companyName, position, ns.singularity.getCompanyFavor(companyName)),
				...ns.singularity.getCompanyPositionInfo(companyName, position),
				promotion() {
					this.nextPosition ? ns.singularity.applyToCompany(companyName, this.field) :
						ns.print(`${this.companyName}: ${this.name} is the last job in it's field.`);
				},
				apply() {
					if (Object.keys(ns.getPlayer().jobs).includes(companyName)) {
						ns.print(`You are already working for ${companyName}`);
						return;
					}
					const result = ns.singularity.applyToCompany(companyName, this.field);
					if (result) ns.print(`You started working for ${companyName} in the ${this.field} field.`);
					return result;
				}
			});
		}
	}

	quit = () => this.ns.singularity.quitJob(this.companyName);

	getJobs = () => {
		const list = [];
		this.jobs.forEach(job => list.push(job.name));
		return list;
	}
}

export class Employment {
	/** @param {NS} ns */
	constructor(ns) {
		this.companies = [];
		this.currentJobs = ns.getPlayer().jobs;
		this.ns = ns;

		for (const company of Object.values(ns.enums.CompanyName)) this.companies.push(new Jobs(ns, company));
	}

	getJobs = () => {
		const list = [];
		this.companies.forEach(company => {
			const x = Object.create({});
			x[company.companyName] = company.getJobs();
			list.push(x);
		});
		return list;
	}

	promoteAllJobs = () => Object.entries(this.currentJobs).forEach(job => new Jobs(this.ns, job[0]).jobs.forEach(e => e.name === job[1] ? e.promotion() : null));
}

export class MyEmployment {
	/** @param {NS} ns */
	constructor(ns) {
		class MyJob {
			constructor(ns, company, job) {
				this.info = ns.singularity.getCompanyPositionInfo(company, job);
				this.promote = () => ns.singularity.applyToCompany(company, this.info.field);
			}
		}
		this.jobs = [];
		this.apply4Factions = () => {
			for (const company of compWithFac) {
				if (Object.keys(ns.getPlayer().jobs).includes(company[0])) {
					ns.print(`Already work for ${company[0]}.`);
				} else if (ns.getPlayer().factions.includes(company[1])) {
					ns.print(`Skipping job at ${company[0]} you're already in faction ${company[1]}.`);
				} else {
					new Jobs(ns, company[0]).applyBest();
				}
			}
		};
		this.promoteMyJobs = () => this.jobs.forEach(j => j.promote());
		this.takeOutTrash = () => { // i dunno, i couldn't think of much better name could change
			for (const company of compWithFac) {
				if (!Object.keys(ns.getPlayer().jobs).includes(company[0]) // skip if we're not working with company
					|| !ns.getPlayer().factions.includes(company[1])) continue; // or if we don't have faction yet
				ns.singularity.quitJob(company[0]);
				ns.print(`Quit working at ${company[0]}`);
			}
		};

		for (const [company, job] of Object.entries(ns.getPlayer().jobs)) this.jobs.push(new MyJob(ns, company, job));
	}
}