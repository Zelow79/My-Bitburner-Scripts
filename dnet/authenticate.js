import { ports } from "ports.js";
/** @param {NS} ns */
export async function main(ns) {
  const d = JSON.parse(ns.args[0]),
    target = ns.args[1], commonPasswords = [
      "batman", "andrew", "tigger", "sunshine", "iloveyou", "2000",
      "charlie", "robert", "thomas", "hockey", "ranger", "daniel",
      "starwars", "112233", "george", "computer", "michelle", "jessica",
      "pepper", "1111", "zxcvbn", "555555", "11111111", "131313", "freedom",
      "777777", "pass", "maggie", "ginger", "princess", "joshua", "cheese",
      "amanda", "summer", "love", "ashley", "6969", "nicole", "chelsea",
      "biteme", "matthew", "access", "yankees"
    ], factoryDefault = [
      "admin", "password", "0000", "12345"
    ], dogNames = [
      "fido", "spot", "rover", "max"
    ];
  let pw = "", result = "";

  switch (d.modelId) {
    case "ZeroLogon":
      result = await ns.dnet.authenticate(target, pw);
      if (result.code === 200) {
        report(target, pw, result);
        return;
      }
      break;
    case "DeskMemo_3.1":
      if (d.passwordFormat === "numeric") {
        pw = d.passwordHint.slice(-d.passwordLength);
        result = await ns.dnet.authenticate(target, pw);
        if (result.code === 200) {
          report(target, pw, result);
          return;
        }
      }
      break;
    case "CloudBlare(tm)":
      if (d.passwordFormat === "numeric") {
        const storage = [];
        for (const v of d.data) {
          if (!isNaN(parseInt(v))) storage.push(v.toString());
        }
        pw = storage.join("");
        result = await ns.dnet.authenticate(target, pw);
        if (result.code === 200) {
          report(target, pw, result);
          return;
        }
      }
      break;
    case "FreshInstall_1.0":
      const pws = factoryDefault.filter(e => e.length);
      for (const pw of pws) {
        result = await ns.dnet.authenticate(target, pw);
        if (result.code === 200) {
          report(target, pw, result);
          //ns.tprint(`Cracked modelId: ${d.modelId} on server: ${target} with pass: ${pw}`);
          return;
        }
      }
      break;
    case "OctantVoxel":
      pw = parseInt(d.data.split(",")[1], d.data.split(",")[0]).toString(10);
      result = await ns.dnet.authenticate(target, pw);
      if (result.code === 200) {
        report(target, pw, result);
        //ns.tprint(`Cracked modelId: ${d.modelId} on server: ${target} with pass: ${pw}`);
        return;
      }
      break;
    case "PHP 5.4":
      for (const pw of findAllPermutations(d.data)) {
        result = await ns.dnet.authenticate(target, pw);
        if (result.code === 200) {
          report(target, pw, result);
          //ns.tprint(`Cracked modelId: ${d.modelId} on server: ${target} with pass: ${pw}`);
          return;
        }
      }
      break;
    case "(The Labyrinth)":
      // put code to solve The Labyrinth here
      break;
  }

  // finally attempt brute force
  for (const pw of [...commonPasswords, ...factoryDefault, ...dogNames]) {
    result = await ns.dnet.authenticate(target, pw);
    if (result.code === 200) {
      report(target, pw, result);
      ns.tprint(`Cracked modelId: ${d.modelId} through brute force
 on server: ${target} with pass: ${pw}`);
      return;
    }
  }

  function findAllPermutations(numberString) {
    const storage = [];
    function backtrack(index, cArray) {
      if (index === cArray.length - 1) {
        storage.push([...cArray].join(""));
        return;
      }
      for (let i = index; i < cArray.length; i++) {
        [cArray[index], cArray[i]] = [cArray[i], cArray[index]];
        backtrack(index + 1, cArray);
        [cArray[index], cArray[i]] = [cArray[i], cArray[index]];
      }
    }

    backtrack(0, [...numberString]);
    return storage;
  }

  function report(victim, password, result) {
    ns.print(result);
    ns.getPortHandle(ports["dnetAddPw"]).write(JSON.stringify({
      name: victim,
      password
    }));
  }
}