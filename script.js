document.getElementById('csvFile').addEventListener('change', function (e) {
    const file = e.target.files[0];
    if (!file) return;

    Papa.parse(file, {
        complete: function (results) {
            const data = results.data;
            if (data.length === 0) return showMessage("Empty CSV file");

            const columnCount = data[0].length;
            const transposed = Array.from({ length: columnCount }, (_, i) =>
                data.map(row => row[i])
            );

            const columnHashes = transposed.map(col => JSON.stringify(col));
            const counts = {};
            columnHashes.forEach(hash => {
                counts[hash] = (counts[hash] || 0) + 1;
            });

            const duplicates = Object.entries(counts).filter(([_, count]) => count > 1);

            const output = duplicates.length
                ? `<table class="w-full text-left border mt-4">
            <thead><tr><th class="border px-2 py-1">Duplicate Set</th><th class="border px-2 py-1">Count</th></tr></thead>
            <tbody>
              ${duplicates.map(([hash, count], i) =>
                    `<tr><td class="border px-2 py-1">Set ${i + 1}</td><td class="border px-2 py-1">${count}</td></tr>`
                ).join('')}
            </tbody>
           </table>`
                : `<p class="text-green-600 font-semibold">No duplicate columns found 🎉</p>`;

            document.getElementById('result').innerHTML = output;
        },
        error: function (err) {
            showMessage(`Error: ${err.message}`);
        }
    });
});

function showMessage(message) {
    document.getElementById('result').innerHTML = `<p class="text-red-600">${message}</p>`;
}
