export function exportToCsv(data: any[], filename: string) {
  if (!data || data.length === 0) {
    console.warn("No data to export.")
    return
  }

  // Build a unified header set from all rows to avoid missing columns across mixed records
  const headerSet = new Set<string>()
  for (const row of data) {
    Object.keys(row || {}).forEach((key) => headerSet.add(key))
  }
  const headers = Array.from(headerSet)
  const csvRows: string[] = []

  // Add headers
  csvRows.push(headers.join(","))

  // Add data rows
  for (const row of data) {
    const values = headers.map((header) => {
      const value = row?.[header]
      // Use "N/A" for null/undefined per project expectation and README
      let formattedValue = value === null || value === undefined ? "N/A" : String(value)
      // Normalize CRLF to LF to prevent unintended blank lines in CSV viewers
      formattedValue = formattedValue.replace(/\r\n/g, "\n")
      // Escape commas, double quotes, and newlines by wrapping in quotes and doubling inner quotes
      if (/[,"\n]/.test(formattedValue)) {
        formattedValue = `"${formattedValue.replace(/"/g, '""')}"`
      }
      return formattedValue
    })
    csvRows.push(values.join(","))
  }

  const csvString = csvRows.join("\n")
  // Prepend UTF-8 BOM to improve compatibility with Excel and ensure proper encoding
  const blob = new Blob(["\uFEFF" + csvString], { type: "text/csv;charset=utf-8;" })
  const link = document.createElement("a")

  if (link.download !== undefined) {
    // Browsers that support HTML5 download attribute
    link.setAttribute("href", URL.createObjectURL(blob))
    link.setAttribute("download", filename)
    link.style.visibility = "hidden"
    document.body.appendChild(link)
    link.click()
    document.body.removeChild(link)
  } else {
    // Fallback for older browsers
    window.open(URL.createObjectURL(blob))
  }
}
