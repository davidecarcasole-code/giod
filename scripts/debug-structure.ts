import * as XLSX from "xlsx";

const files = [
  { path: "Latina - Foglio Vendite 2026.xlsx", sede: "LATINA" },
  { path: "Villa Betania - Foglio Vendite 2026.xlsx", sede: "VILLA BETANIA" },
  { path: "_NUOVO Cristo Re - Foglio Vendite 2026.xlsx", sede: "CRISTO RE" },
  { path: "Firenze - Foglio Vendite 2026.xlsx", sede: "FIRENZE" },
];

for (const { path: f, sede } of files) {
  const wb = XLSX.readFile(f);
  const sn = wb.SheetNames.find((n) => n.toUpperCase().includes("OPPORTUNITA"))!;
  const rows: any[][] = XLSX.utils.sheet_to_json(wb.Sheets[sn], { header: 1 });
  console.log(`${sede}: total rows=${rows.length}`);

  // Show the "Tot. ANNO" rows to understand the structure
  for (let i = 0; i < rows.length; i++) {
    const r = rows[i];
    if (r && typeof r[0] === "string" && r[0].startsWith("Anno ")) {
      console.log(`  ${r[0]} at row ${i}, next non-empty: looking...`);
      // Count non-empty rows after this
      let dataCount = 0;
      for (let j = i + 1; j < Math.min(i + 10, rows.length); j++) {
        const r2 = rows[j];
        if (r2 && r2.some(v => v !== undefined && v !== null && v !== "")) {
          console.log(`    row ${j}: esito=${r2[1]}, paz=${r2[4]}`);
          dataCount++;
        }
      }
      console.log(`    non-empty rows after: ${dataCount > 0 ? dataCount : "(none found nearby)"}`);
    }
  }

  // Count data rows (rows with valid esito in [1])
  let dataRows = 0;
  let dataStart = -1;
  let dataEnd = -1;
  for (let i = 0; i < rows.length; i++) {
    const r = rows[i];
    if (!r) continue;
    const esito = r[1];
    if (["ESEGUITO", "NON ESEGUITO", "IN ATTESA"].includes(esito)) {
      dataRows++;
      if (dataStart < 0) dataStart = i;
      dataEnd = i;
    }
  }
  console.log(`  Data rows: ${dataRows} (rows ${dataStart}-${dataEnd})`);
  console.log();
}
