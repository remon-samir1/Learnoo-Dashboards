const fs = require('fs');
const paths = [
    'd:/projects/Learnoo-Dashboards/app/(admin)/live-sessions/[id]/settings/page.tsx',
    'd:/projects/Learnoo-Dashboards/app/(doctor)/doctor/live-sessions/[id]/settings/page.tsx'
];

for (const p of paths) {
    if (fs.existsSync(p)) {
        let content = fs.readFileSync(p, 'utf8');
        
        const newStr = `            const lecturePromises = (lecturesRes.data || []).map(async (lecture) => {
              const chaptersRes = await api.chapters.list({ lecture_id: lecture.id });
              return (chaptersRes.data || []).map(chapter => ({
                chapter,
                lecture,
                course,
                department: dept
              }));
            });
            const chaptersArrays = await Promise.all(lecturePromises);
            chaptersArrays.forEach(arr => allChapters.push(...arr));`;

        content = content.replace(/for\s*\(\s*const lecture of lecturesRes\.data\s*\|\|\s*\[\]\)\s*\{[\s\S]*?department:\s*dept\s*\}\);\s*\}\s*\}/, newStr);
        fs.writeFileSync(p, content);
        console.log('Updated ' + p);
    }
}
