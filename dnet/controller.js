import { ports } from "ports.js";
/**
 * To do list
 * refactor section for adding and removing banked passwords from portHandle
 * 
 */
/** @param {NS} ns */
export async function main(ns) {
  const timeStamps = {},
    versionFileName = "dnet/versionInfo.txt";

  if (!ns.ls(ns.getHostname()).includes(versionFileName)) {
    ns.write(versionFileName, JSON.stringify({
      versionNumber: 0
    }, null, 1), "w");
  }

  while (1) { // main loop
    spread(ns, timeStamps);

    const portAddPw = ns.getPortHandle(ports["dnetAddPw"]);
    while (portAddPw.peek() != "NULL PORT DATA") { // check add port for new password objects to add to bank
      const newData = JSON.parse(portAddPw.read()),
        data = JSON.parse(ns.read("dnet/victims.txt"));
      let update = false;

      for (const e of data) {
        if (e.name === newData.name) {
          e.password = newData.password;
          update = true;
          break; // done processing data go to next port reading
        }
      }
      if (!update) {
        data.push(newData);
      }
      ns.write("dnet/victims.txt", JSON.stringify(data, null, 1), "w");

    }

    const portRmPw = ns.getPortHandle(ports["dnetRmPw"]);
    while (portRmPw.peek() != "NULL PORT DATA") { // check rm port for password objects to remove from bank
      const rmData = JSON.parse(portRmPw.read()),
        data = JSON.parse(ns.read("dnet/victims.txt"));
      // skip process if rmData.name isn't in bank.
      if (!data.some(d => d.name === rmData.name)) continue;
      // remove server name from bank based on object sent to rm port
      ns.write("dnet/victims.txt", JSON.stringify(data.filter(v => v.name !== rmData.name), null, 1), "w");
      //ns.tprint(`Server: ${rmData.name} with Pass: ${rmData.password} was removed from password bank`);
    }

    updateVictimsBank();
    function updateVictimsBank() { // update all servers with current victims.txt file
      for (const victim of JSON.parse(ns.read("dnet/victims.txt"))) {
        if (!ns.serverExists(victim.name)) {
          ns.getPortHandle(ports["dnetRmPw"]).write(JSON.stringify({
            name: victim.name,
            password: victim.password
          }));
          //ns.tprint(`Deleted server detected: ${victim.name} sent to rm port for deletion`);
          continue; // skip deleted servers
        }
        const victimStats = ns.dnet.getServerAuthDetails(victim.name);
        if (!victimStats.isOnline) continue; // skip server is offline
        if (!victim.hasSession) { // attempt to connect to server
          ns.dnet.connectToSession(victim.name, victim.password);
        }
        if (!victim.hasSession) continue; // check if server is now in session, skip if not
        ns.scp("dnet/victims.txt", victim.name, "darkweb");
      }
    }

    //await ns.dnet.nextUpdate();
    await ns.sleep(100);
  }

}

/** @param {NS} ns */
export function spread(ns, timeStamps) {
  const hName = ns.getHostname();
  let freeRam = ns.getServerMaxRam(hName) - ns.getServerUsedRam(hName) - ns.dnet.getBlockedRam(hName);
  if (ns.ls(hName, ".cache").length > 0) {
    const cacheCost = 3.85;
    if (freeRam > cacheCost) {
      ns.exec("dnet/cacheMoney.js", hName, 1, ...ns.ls(hName, ".cache"));
    };
  }

  for (const hostName of ns.dnet.probe()) {
    if (hostName === "darkweb") continue; // don't want scout on darkweb we want the controller on darkweb
    const d = ns.dnet.getServerAuthDetails(hostName);
    for (const o of JSON.parse(ns.read("dnet/victims.txt"))) {
      if (o.name === hostName) {
        if (!ns.dnet.connectToSession(o.name, o.password).success) {
          ns.getPortHandle(ports["dnetRmPw"]).write(JSON.stringify({
            name: o.name,
            password: o.password
          }));
        }
      }
    }
    if (d.hasSession) {
      const files = ns.ls("darkweb", "dnet/");
      files.push("ports.js");
      ns.scp(files, hostName, "darkweb");
      ns.exec("dnet/scout.js", hostName, {
        preventDuplicates: true,
        threads: 1
      });
    } else {
      if (timeStamps[hostName] && timeStamps[hostName] + 10 * 1000 > Date.now()) continue;
      const authenticateRamCost = 2;
      freeRam = ns.getServerMaxRam(hName) - ns.getServerUsedRam(hName) - ns.dnet.getBlockedRam(hName);
      if (freeRam < authenticateRamCost) continue;
      const threads = Math.floor(Math.max(1, freeRam / authenticateRamCost));
      ns.exec("dnet/authenticate.js", hName, {
        preventDuplicates: true,
        threads
      }, JSON.stringify(d), hostName); // stringify serverAuthDetails and send to ns.args[0]
      timeStamps[hostName] = Date.now();
    }
  }

  for (const hostName of ns.dnet.probe()) {
    freeRam = ns.getServerMaxRam(hName) - ns.getServerUsedRam(hName) - ns.dnet.getBlockedRam(hName);
    if (freeRam < 2.6 || ns.dnet.getBlockedRam(hostName) === 0) continue;
    const threads = Math.floor(Math.max(1, freeRam / 2.6));
    ns.exec("dnet/freeRam.js", hName, {
      preventDuplicates: true,
      threads
    }, hostName);
  }
}
/** @param {NS} ns */
export function loot(ns) { // MASSIVE WIP Many issues.
  const lootPath = `loot/`;
  for (const file of ns.ls(ns.getHostname())) {
    if (file.includes(".cache")                               // don't want cache files.
      || file.includes(".exe")                                // can't scp .exe files.
      || file.includes(".cct")                                // can't scp .cct files.
      || ns.ls("darkweb", "dnet/").includes(file)             // don't want our own files.
      || ns.ls("darkweb", "ports.js").includes(file)          // don't want our own files.
      || ns.ls("darkweb", lootPath).includes(file)) continue; // or files we already have.
    ns.print("File: " + file);
    ns.scp(file, "darkweb") && !file.includes(".lit") && ns.mv("darkweb", file, lootPath + file);
  }
}
/** @param {NS} ns */
export function scrape(ns) {
  for (const file of ns.ls(ns.getHostname(), "data.txt")) {
    if (file.includes(".processed")) continue; // skip files we already processed
    const fileContents = ns.read(file);
    if (!fileContents.startsWith("Server:") // We want free passwords
      || fileContents.split(" ").length !== 4) continue;
    const name = fileContents.split(" ")[1], password = fileContents.split(" ")[3];
    // send found password to add password port
    ns.getPortHandle(ports["dnetAddPw"]).write(JSON.stringify({ name, password }));
    // rename data to processed to mark the file as obtained
    ns.mv(ns.getHostname(), file, file.replace(".data", ".processed"));
  }
}