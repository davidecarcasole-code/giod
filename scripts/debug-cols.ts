import * as XLSX from "xlsx";

const wb = XLSX.readFile("Latina - Foglio Vendite 2026.xlsx");
const sn = wb.SheetNames.find((n) => n.toUpperCase().includes("OPPORTUNITA"))!;
const rows: any[][] = XLSX.utils.sheet_to_json(wb.Sheets[sn], { header: 1 });

// Show a data row with all columns
for (let i = 197; i < 200; i++) {
  const r = rows[i];
  console.log(`Row ${i}:`);
  for (let j = 0; j < 20; j++) {
    if (r[j] !== undefined && r[j] !== null && r[j] !== "") {
      console.log(`  [${j}] = ${String(r[j])}`);
    }
  }
}
