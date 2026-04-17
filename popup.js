document.getElementById('processBtn').addEventListener('click', async () => {
    const mode = document.getElementById('modeSelect').value;
    const status = document.getElementById('status');

    status.textContent = `Connecting to ${mode} Engine...`;
    
    try {
        const [tab] = await chrome.tabs.query({ active: true, currentWindow: true });

        chrome.scripting.executeScript({
            target: { tabId: tab.id },
            function: runClarityCore,
            args: [mode] 
        });
        status.textContent = `Processing content with ${mode} Engine...`;
    } catch (err) {
        status.textContent = `Error message: ${err.message}.`;
        console.error('Script execution/Clarity core injection failed:', err);
    }
});

async function runClarityCore(selectedMode) {
    const paragraphs = Array.from(document.querySelectorAll('p'));
    const validParagraphs = paragraphs.filter(p => p.innerText.length > 50);
    if (validParagraphs.length === 0) return;

    const firstPara = validParagraphs[0];
    firstPara.scrollIntoView({ behavior: 'smooth', block: 'center' });

    //combining all paragraphs into one text blob for processing for the ai.....
    const fullText = validParagraphs.map(p => p.innerText).join('\n\n');

    //showing a loading overlay on thr first paragraph....
    // Create the loading status box element with a dashed border and a more prominent message.......
    const loadingDiv = document.createElement('div');
    loadingDiv.innerHTML = `
        <div style="color: #6200ee; font-weight: bold; border: 2px dashed #6200ee; padding: 20px; background: white; margin-bottom: 20px;">
            📡 Clarity Core: Processing full content... this may take a moment.
        </div>
    `;

    // Insert it onto the page just above the first paragraph.....
    firstPara.parentNode.insertBefore(loadingDiv, firstPara);

    try {
    // Small delay to show the "Analyzing" status change
    setTimeout(() => {
        loadingDiv.firstChild.innerHTML = "🧠 Status: Rewriting for high readability...";
    }, 1500);

    const response = await fetch('http://localhost:5000/api/process-content', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ text: fullText, mode: selectedMode })
    });


        const result = await response.json();

        if (result.success) {
            //removing original content paragraphs to make way for the processed content....
            validParagraphs.forEach(p => p.style.display = 'none');

            loadingDiv.style.display = 'none';

            const summaryContainer = document.createElement('div');

            summaryContainer.style.cssText = "border: 8px solid #6200ee; padding: 20px; background: #f4f0ff; font-size: 1.1em; line-height: 1.6; white-space: pre-line;";
            
            summaryContainer.innerHTML = result.data;

            firstPara.parentNode.insertBefore(summaryContainer, firstPara);
            summaryContainer.scrollIntoView({ behavior: 'smooth', block: 'start' });


        } else {
            firstPara.innerHTML = `<b style="color: red;">Engine Error:</b> ${result.error}`;
        }
    } catch (err) {
        console.error('Error during content processing:', err);
        firstPara.innerHTML = `<b style="color: red;">Connection Error:</b> Is 'node server.js' running?`;
        firstPara.style.opacity = '1';
    }
}