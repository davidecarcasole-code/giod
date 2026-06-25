import * as XLSX from "xlsx";

const files = [
  "Latina - Foglio Vendite 2026.xlsx",
  "Villa Betania - Foglio Vendite 2026.xlsx",
  "_NUOVO Cristo Re - Foglio Vendite 2026.xlsx",
  "Firenze - Foglio Vendite 2026.xlsx",
];

for (const f of files) {
  console.log(`=== ${f} ===`);
  const wb = XLSX.readFile(f);
  const sn = wb.SheetNames.find((n) => n.toUpperCase().includes("OPPORTUNITA"))!;
  if (!sn) { console.log("  No OPPORTUNITA sheet\n"); continue; }
  const rows: any[][] = XLSX.utils.sheet_to_json(wb.Sheets[sn], { header: 1 });

  // Find header and data section (Anno 2026)
  let dataStart = -1;
  for (let i = 0; i < rows.length; i++) {
    const r = rows[i];
    if (r && typeof r[0] === "string" && r[0].includes("2026") && typeof r[1] === "string" && r[1].includes("Tot.")) {
      dataStart = i + 1;
      break;
    }
  }

  if (dataStart < 0) { console.log("  No 2026 data section\n"); continue; }

  // Check first 15 data rows for all columns
  for (let i = dataStart; i < Math.min(dataStart + 15, rows.length); i++) {
    const r = rows[i];
    if (!r || !r.some(v => v !== undefined && v !== null && v !== "")) continue;
    const cols: string[] = [];
    for (let j = 0; j < 25; j++) {
      if (r[j] !== undefined && r[j] !== null && r[j] !== "") {
        cols.push(`${j}:${String(r[j]).substring(0, 20)}`);
      }
    }
    console.log(`  Row ${i}: ${cols.join(", ")}`);
  }
  console.log();
}
