import * as XLSX from "xlsx";

const files = [
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
  console.log(`Total rows: ${rows.length}`);

  // Show all non-empty rows
  for (let i = 0; i < rows.length; i++) {
    const r = rows[i];
    if (r && r.some(v => v !== undefined && v !== null && v !== "")) {
      const cols: string[] = [];
      for (let j = 0; j < 20; j++) {
        if (r[j] !== undefined && r[j] !== null && r[j] !== "") {
          cols.push(`${j}:${String(r[j]).substring(0, 25)}`);
        }
      }
      console.log(`  Row ${i}: ${cols.join(", ")}`);
    }
  }
  console.log();
}
