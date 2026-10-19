export async function readPreactivationPhones(file: File): Promise<string[]> {
  let text: string;
  if (/\.xlsx?$/i.test(file.name)) {
    const XLSX = await import('xlsx');
    const workbook = XLSX.read(await file.arrayBuffer(), { type: 'array' });
    text = XLSX.utils.sheet_to_csv(workbook.Sheets[workbook.SheetNames[0]]);
  } else {
    text = await file.text();
  }
  return text.split(/[\n,\r,;]/).map(number => number.trim()).filter(Boolean);
}
