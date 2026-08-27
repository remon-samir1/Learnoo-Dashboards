const fs = require('fs');
const files = [
  'app/(admin)/departments/page.tsx',
  'app/(doctor)/doctor/departments/page.tsx'
];

for (const file of files) {
  let text = fs.readFileSync(file, 'utf8');

  // Replace Edit Model Initialization
  const entities = ['course', 'lecture', 'chapter'];
  for (const entity of entities) {
    const fromStr = `schedule: ${entity}.attributes.schedule ? ${entity}.attributes.schedule.replace(' ', 'T').substring(0, 16) : "",`;
    const toStr = `schedule_start: ${entity}.attributes.schedule_start ? ${entity}.attributes.schedule_start.replace(' ', 'T').substring(0, 16) : "",
          schedule_end: ${entity}.attributes.schedule_end ? ${entity}.attributes.schedule_end.replace(' ', 'T').substring(0, 16) : "",`;
    text = text.replace(fromStr, toStr);
  }

  // Replace formData Submit assignments in Add / Edit
  text = text.replace(/schedule: formData\.schedule,/g, 'schedule_start: formData.schedule_start,\n\n              schedule_end: formData.schedule_end,');

  // Replace UI
  const uiRegex = /<div>\s*<label className="block text-sm font-medium text-gray-700 mb-1">\s*Schedule\s*<\/label>\s*<input\s*type="datetime-local"\s*value=\{formData\.schedule \|\| ""\}\s*onChange=\{\(e\) =>\s*setFormData\(\{\s*\.\.\.formData,\s*schedule: e\.target\.value,\s*\}\)\s*\}\s*className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-(green|purple|orange)-500"\s*\/>\s*<\/div>/g;
  
  text = text.replace(uiRegex, (match, color) => {
    return `<div className="flex gap-4 w-full">
                  <div className="flex-1">
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Schedule Start
                    </label>
                    <input
                      type="datetime-local"
                      value={formData.schedule_start || ""}
                      onChange={(e) => setFormData({ ...formData, schedule_start: e.target.value })}
                      className={\`w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-${color}-500\`}
                    />
                  </div>
                  <div className="flex-1">
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Schedule End
                    </label>
                    <input
                      type="datetime-local"
                      value={formData.schedule_end || ""}
                      onChange={(e) => setFormData({ ...formData, schedule_end: e.target.value })}
                      className={\`w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-${color}-500\`}
                    />
                  </div>
                </div>`;
  });

  fs.writeFileSync(file, text);
}
console.log('Update Complete');
