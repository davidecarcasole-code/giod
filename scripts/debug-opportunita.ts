import * as XLSX from "xlsx";

const wb = XLSX.readFile("Latina - Foglio Vendite 2026.xlsx");
const sn = wb.SheetNames.find((n) => n.toUpperCase().includes("OPPORTUNITA"))!;
const rows: any[][] = XLSX.utils.sheet_to_json(wb.Sheets[sn], { header: 1 });

console.log("Header row 6:", rows[6].join(" | "));
console.log("\nData rows (197-205):");
for (let i = 197; i < Math.min(206, rows.length); i++) {
  const r = rows[i];
  if (r && r.some((v) => v !== undefined && v !== null && v !== "")) {
    console.log(`Row ${i}: esito=${r[1]}, col2=${r[2]} (${typeof r[2]}), paziente=${r[4]}, medico=${r[7]}, importo=${r[9]}, modPag=${r[17]}`);

    // Try interpreting col2 as date
    if (typeof r[2] === "number") {
      const d = new Date((r[2] - 25569) * 86400 * 1000);
      console.log(`  -> as date: ${d.toISOString()} (${d.toLocaleDateString("it-IT")})`);
    }
  }
}

// Count how many data rows have "ESEGUITO", "NON ESEGUITO", "IN ATTESA"
let e = 0, ne = 0, ia = 0, other = 0;
for (const r of rows) {
  if (!r || !r[1] || typeof r[1] !== "string") continue;
  const v = r[1].trim();
  if (v === "ESEGUITO") e++;
  else if (v === "NON ESEGUITO") ne++;
  else if (v === "IN ATTESA") ia++;
  else if (v.length > 0) other++;
}
console.log(`\nTotal: ESEGUITO=${e}, NON ESEGUITO=${ne}, IN ATTESA=${ia}, other=${other}`);

// Check if importo has values
let hasImporto = 0;
for (const r of rows) {
  if (r && r[9]) { hasImporto++; }
}
console.log(`Rows with importo (col9): ${hasImporto}`);
