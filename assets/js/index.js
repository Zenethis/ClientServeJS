        // DOM Elements
        const archiveTypeSelect = document.getElementById('archive-type');
        const archiveFileInput = document.getElementById('archive-file');
        const fileNameDisplay = document.getElementById('file-name');
        const servePathInput = document.getElementById('serve-path');
        const launchMethodSelect = document.getElementById('launch-method');
        const showLoadingBarCheckbox = document.getElementById('show-loading-bar');
        const fallbackModeCheckbox = document.getElementById('fallback-mode');
        const unitySupportCheckbox = document.getElementById('unity-support');
        const blobModeCheckbox = document.getElementById('blob-mode');
        const unityBlobFallbackCheckbox = document.getElementById('unity-blob-fallback');
        const unityBlobModeCheckbox = document.getElementById('unity-blob-mode');
        const persistFilesCheckbox = document.getElementById('persist-files');
        const csjOptionsDiv = document.getElementById('csj-options');
        const csjPasswordInput = document.getElementById('csj-password');
        const progressBar = document.getElementById('progress-bar');
        const statusDisplay = document.getElementById('status');
        const errorDisplay = document.getElementById('error');
        const loadButton = document.getElementById('load-button');
        const launchButton = document.getElementById('launch-button');
        const createZipButton = document.getElementById('create-zip-button');
        const demoFiles = document.querySelectorAll('.demo-file');
        const storedFilesList = document.getElementById('stored-files-list');
        const refreshStoredFilesButton = document.getElementById('refresh-stored-files');
        const tabs = document.querySelectorAll('.tab');
        const tabContents = document.querySelectorAll('.tab-content');

        const debugModeCheckbox = document.getElementById('debug-mode');
        const debugPanel = document.getElementById('debug-panel');
        const fileListSelect = document.getElementById('file-list');
        const startFileInput = document.getElementById('start-file');
        const launchCustomButton = document.getElementById('launch-custom');
        
        // Variables
        let clientServe = null;
        let selectedFile = null;
        let selectedDemoUrl = null;
        
        // Event Listeners
        archiveFileInput.addEventListener('change', handleFileSelect);
        loadButton.addEventListener('click', loadArchive);
        launchButton.addEventListener('click', launchApp);
        createZipButton.addEventListener('click', createTestZip);
        refreshStoredFilesButton.addEventListener('click', loadStoredFiles);
        
        // Set up demo file clicks
        demoFiles.forEach(demoFile => {
            demoFile.addEventListener('click', () => {
                selectedDemoUrl = demoFile.dataset.url;
                fileNameDisplay.textContent = selectedDemoUrl;
                archiveFileInput.value = '';
                selectedFile = null;
                updateStatus('Demo file selected: ' + selectedDemoUrl);
            });
        });

        // Set up tabs
        tabs.forEach(tab => {
            tab.addEventListener('click', () => {
                // Remove active class from all tabs and contents
                tabs.forEach(t => t.classList.remove('active'));
                tabContents.forEach(c => c.classList.remove('active'));
                
                // Add active class to clicked tab and corresponding content
                tab.classList.add('active');
                const tabId = tab.getAttribute('data-tab');
                document.getElementById(tabId).classList.add('active');
            });
        });

        // Show/hide CSJ options based on archive type
        archiveTypeSelect.addEventListener('change', function() {
            if (this.value === 'csj') {
                csjOptionsDiv.style.display = 'block';
            } else {
                csjOptionsDiv.style.display = 'none';
            }
        });

        debugModeCheckbox.addEventListener('change', function() {
            debugPanel.style.display = this.checked ? 'block' : 'none';
        });

        launchCustomButton.addEventListener('click', launchCustomFile);
        
        // Show warning when Unity Blob Mode is enabled
        unityBlobModeCheckbox.addEventListener('change', function() {
            if (this.checked) {
                if (!confirm('Unity Blob Mode is experimental and may not work with all Unity games. Continue?')) {
                    this.checked = false;
                }
            }
        });
        
        // Load stored files on page load
        document.addEventListener('DOMContentLoaded', () => {
            // Initialize ClientServe for storage operations
            clientServe = new ClientServe({
                persistFiles: true,
                debug: debugModeCheckbox.checked
            });
            
            loadStoredFiles();
        });
        
        // Functions
        function handleFileSelect(event) {
            selectedFile = event.target.files[0];
            selectedDemoUrl = null;
            
            if (selectedFile) {
                fileNameDisplay.textContent = selectedFile.name;
                updateStatus('File selected: ' + selectedFile.name);
                
                // Auto-select the correct archive type based on file extension
                if (selectedFile.name.endsWith('.csj')) {
                    archiveTypeSelect.value = 'csj';
                    csjOptionsDiv.style.display = 'block';
                } else if (selectedFile.name.endsWith('.zip')) {
                    archiveTypeSelect.value = 'zip';
                    csjOptionsDiv.style.display = 'none';
                }
            } else {
                fileNameDisplay.textContent = 'No file chosen';
                updateStatus('Ready to load archive');
            }
        }
        
        function updateStatus(message) {
            statusDisplay.textContent = message;
        }
        
        function showError(message) {
            errorDisplay.textContent = message;
        }
        
        function clearError() {
            errorDisplay.textContent = '';
        }
        
        function updateProgress(percent) {
            progressBar.style.width = `${percent}%`;
        }
        
        async function loadStoredFiles() {
            if (!clientServe) return;
            
            try {
                storedFilesList.innerHTML = '<div class="note">Loading stored files...</div>';
                
                const paths = await clientServe.listStoredPaths();
                
                if (paths.length === 0) {
                    storedFilesList.innerHTML = '<div class="note">No stored files found. Load an archive with "Persist Files" enabled to store files for future use.</div>';
                    return;
                }
                
                storedFilesList.innerHTML = '';
                
                for (const path of paths) {
                    const metadata = await clientServe.storage.getMetadata(path);
                    
                    const fileItem = document.createElement('div');
                    fileItem.className = 'stored-file-item';
                    
                    const filePath = document.createElement('div');
                    filePath.className = 'stored-file-path';
                    filePath.textContent = path;
                    
                    const fileInfo = document.createElement('div');
                    fileInfo.className = 'stored-file-info';
                    if (metadata) {
                        const date = new Date(metadata.timestamp);
                        fileInfo.textContent = `${metadata.fileCount} files, stored ${date.toLocaleDateString()} ${date.toLocaleTimeString()}`;
                    }
                    
                    const fileActions = document.createElement('div');
                    fileActions.className = 'stored-file-actions';
                    
                    const loadButton = document.createElement('button');
                    loadButton.textContent = 'Load';
                    loadButton.addEventListener('click', () => loadFromStorage(path));
                    
                    const deleteButton = document.createElement('button');
                    deleteButton.textContent = 'Delete';
                    deleteButton.style.backgroundColor = '#f44336';
                    deleteButton.addEventListener('click', () => deleteFromStorage(path));
                    
                    fileActions.appendChild(loadButton);
                    fileActions.appendChild(deleteButton);
                    
                    fileItem.appendChild(filePath);
                    fileItem.appendChild(fileInfo);
                    fileItem.appendChild(fileActions);
                    storedFilesList.appendChild(fileItem);
                }
            } catch (error) {
                storedFilesList.innerHTML = `<div class="error">Error loading stored files: ${error.message}</div>`;
                console.error(error);
            }
        }
        
        async function loadFromStorage(path) {
            try {
                updateStatus(`Loading files from storage: ${path}`);
                updateProgress(10);
                
                // Initialize ClientServe with the appropriate options
                clientServe = new ClientServe({
                    path: path,
                    showLoadingBar: showLoadingBarCheckbox.checked,
                    launchMethod: launchMethodSelect.value,
                    fallbackMode: fallbackModeCheckbox.checked,
                    unitySupport: unitySupportCheckbox.checked,
                    debug: debugModeCheckbox.checked,
                    blobMode: blobModeCheckbox.checked,
                    unityBlobFallback: unityBlobFallbackCheckbox.checked,
                    unityBlobMode: unityBlobModeCheckbox.checked,
                    persistFiles: persistFilesCheckbox.checked,
                    onProgress: (percent, stage) => {
                        updateProgress(percent * 100);
                        updateStatus(`${stage.charAt(0).toUpperCase() + stage.slice(1)}: ${Math.round(percent * 100)}%`);
                    },
                    onError: (message, error) => {
                        showError(message);
                        console.error(error);
                    },
                    onReady: () => {
                        updateStatus('ClientServeJS is ready');
                    }
                });
                
                await clientServe.loadFromStorage(path);
                updateProgress(100);
                updateStatus(`Files loaded from storage: ${path}`);
                updateFileList();
                launchButton.disabled = false;
                launchCustomButton.disabled = false;
                
                // Switch to the Load Archive tab
                tabs[0].click();
            } catch (error) {
                showError(`Failed to load from storage: ${error.message}`);
                console.error(error);
            }
        }
        
        async function deleteFromStorage(path) {
            if (!confirm(`Are you sure you want to delete the stored files at ${path}?`)) {
                return;
            }
            
            try {
                await clientServe.deleteFromStorage(path);
                updateStatus(`Deleted files from storage: ${path}`);
                loadStoredFiles();
            } catch (error) {
                showError(`Failed to delete from storage: ${error.message}`);
                console.error(error);
            }
        }

        function updateFileList() {
            if (!clientServe || !clientServe.files) return;

            // Clear the current list
            fileListSelect.innerHTML = '';

            // Add all files to the list
            const files = Object.keys(clientServe.files).sort();
            files.forEach(file => {
                const option = document.createElement('option');
                option.value = file;
                option.textContent = file;
                fileListSelect.appendChild(option);
            });
        }
        
        async function loadArchive() {
            clearError();
            
            if (!selectedFile && !selectedDemoUrl) {
                showError('Please select a file or demo archive');
                return;
            }
            
            const archiveType = archiveTypeSelect.value;
            const servePath = servePathInput.value || '/app';
            const showLoadingBar = showLoadingBarCheckbox.checked;
            const fallbackMode = fallbackModeCheckbox.checked;
            const unitySupport = unitySupportCheckbox.checked;
            const launchMethod = launchMethodSelect.value;
            const blobMode = blobModeCheckbox.checked;
            const unityBlobFallback = unityBlobFallbackCheckbox.checked;
            const unityBlobMode = unityBlobModeCheckbox.checked;
            const persistFiles = persistFilesCheckbox.checked;
            const csjPassword = csjPasswordInput.value || 'clientserve';
            
            // Check for conflicting options
            if (unityBlobMode && !blobMode) {
                showError('Unity Blob Mode requires Blob Mode to be enabled');
                return;
            }
            
            if (unityBlobMode && unityBlobFallback) {
                // Show warning and disable unityBlobFallback
                if (confirm('Unity Blob Mode conflicts with Unity Blob Fallback. Disable Unity Blob Fallback?')) {
                    unityBlobFallbackCheckbox.checked = false;
                } else {
                    // User chose not to disable fallback, so disable blob mode instead
                    unityBlobModeCheckbox.checked = false;
                    unityBlobMode = false;
                }
            }
            
            // Initialize ClientServeJS
            clientServe = new ClientServe({
                path: servePath,
                showLoadingBar: showLoadingBar,
                launchMethod: launchMethod,
                fallbackMode: fallbackMode,
                unitySupport: unitySupport,
                debug: debugModeCheckbox.checked,
                blobMode: blobMode,
                unityBlobFallback: unityBlobFallback,
                unityBlobMode: unityBlobMode,
                persistFiles: persistFiles,
                csjPassword: csjPassword,
                enablePWA: true,
                onProgress: (percent, stage) => {
                    updateProgress(percent * 100);
                    updateStatus(`${stage.charAt(0).toUpperCase() + stage.slice(1)}: ${Math.round(percent * 100)}%`);
                },
                onError: (message, error) => {
                    showError(message);
                    console.error(error);
                },
                onReady: () => {
                    updateStatus('ClientServeJS is ready');
                }
            });
            
            try {
                loadButton.disabled = true;
                updateStatus('Loading archive...');
                
                if (selectedFile) {
                    // Convert File to URL
                    const fileUrl = URL.createObjectURL(selectedFile);
                    await clientServe.loadFromUrl(fileUrl, archiveType);
                } else if (selectedDemoUrl) {
                    await clientServe.loadFromUrl(selectedDemoUrl, archiveType);
                }
                
                updateStatus('Archive loaded successfully');
                updateFileList();
                launchButton.disabled = false;
                launchCustomButton.disabled = false;
                
                // If persistence is enabled, refresh the stored files list
                if (persistFiles) {
                    loadStoredFiles();
                }
            } catch (error) {
                showError('Failed to load archive: ' + error.message);
                console.error(error);
            } finally {
                loadButton.disabled = false;
            }
        }
        
        function launchApp() {
            if (clientServe) {
                clientServe.launch();
            }
        }
        
        async function createTestZip() {
            updateStatus('Creating test ZIP file...');
            
            try {
                const zip = new JSZip();
                
                // Add index.html
                zip.file("index.html", `<!DOCTYPE html>
<html lang="en">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>ClientServeJS Test</title>
    <link rel="stylesheet" href="styles.css">
    <link rel="manifest" href="manifest.json">
</head>
<body>
    <div class="container">
        <h1>ClientServeJS Test</h1>
        <p>This is a test page served from a ZIP archive using ClientServeJS.</p>
        
        <div class="card">
            <h2>Features</h2>
            <ul>
                <li>Serves files directly from ZIP archives</li>
                <li>No server required</li>
                <li>Works with HTML, CSS, JavaScript, and more</li>
                <li>Supports various file types</li>
                <li>Includes PWA support with manifest</li>
            </ul>
        </div>
        
        <div class="card">
            <h2>Test JavaScript</h2>
            <button id="testButton">Click Me</button>
            <div id="result"></div>
        </div>
        
        <div class="card">
            <h2>Test Image</h2>
            <img src="image.svg" alt="Test Image" width="200">
        </div>
    </div>
    
    <script src="script.js"><\/script>
</body>
</html>`);
                
                // Add styles.css
                zip.file("styles.css", `body {
    font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Oxygen, Ubuntu, Cantarell, 'Open Sans', 'Helvetica Neue', sans-serif;
    line-height: 1.6;
    color: #333;
    max-width: 800px;
    margin: 0 auto;
    padding: 20px;
    background-color: #f5f5f5;
}

.container {
    display: flex;
    flex-direction: column;
    gap: 20px;
}

h1 {
    color: #4CAF50;
}

.card {
    background-color: white;
    border-radius: 8px;
    box-shadow: 0 4px 6px rgba(0, 0, 0, 0.1);
    padding: 20px;
}

button {
    background-color: #4CAF50;
    color: white;
    border: none;
    border-radius: 4px;
    padding: 10px 20px;
    font-size: 16px;
    cursor: pointer;
    transition: background-color 0.3s;
}

button:hover {
    background-color: #2E7D32;
}

#result {
    margin-top: 10px;
    padding: 10px;
    background-color: #f1f1f1;
    border-radius: 4px;
}`);
                
                // Add script.js
                zip.file("script.js", `document.getElementById('testButton').addEventListener('click', function() {
    const result = document.getElementById('result');
    result.textContent = 'JavaScript is working! Current time: ' + new Date().toLocaleTimeString();
});

console.log('Script loaded from ZIP archive');`);
                
                // Add SVG image
                zip.file("image.svg", `<svg xmlns="http://www.w3.org/2000/svg" width="200" height="200" viewBox="0 0 200 200">
    <rect width="200" height="200" fill="#4CAF50" />
    <circle cx="100" cy="100" r="80" fill="#2E7D32" />
    <text x="100" y="110" font-family="Arial" font-size="24" fill="white" text-anchor="middle">ClientServeJS</text>
</svg>`);
                
                // Add manifest.json for PWA support
                zip.file("manifest.json", `{
    "name": "ClientServeJS Test App",
    "short_name": "CSJ Test",
    "description": "A test application for ClientServeJS",
    "start_url": "index.html",
    "display": "standalone",
    "background_color": "#4CAF50",
    "theme_color": "#4CAF50",
    "icons": [
        {
            "src": "image.svg",
            "sizes": "192x192",
            "type": "image/svg+xml"
        }
    ]
}`);
                
                // Generate ZIP file
                const content = await zip.generateAsync({type: 'blob'});
                
                // Create download link
                const url = URL.createObjectURL(content);
                const a = document.createElement('a');
                a.href = url;
                a.download = 'clientserve-test.zip';
                document.body.appendChild(a);
                a.click();
                document.body.removeChild(a);
                
                updateStatus('Test ZIP file created and downloaded');
            } catch (error) {
                showError('Failed to create test ZIP: ' + error.message);
                console.error(error);
            }
        }
        
        // Create demo ZIP files for testing
        async function createDemoZips() {
            try {
                // Basic demo
                const basicZip = new JSZip();
                basicZip.file("index.html", `<!DOCTYPE html>
<html>
<head>
    <title>Basic Demo</title>
    <style>
        body { font-family: sans-serif; max-width: 800px; margin: 0 auto; padding: 20px; }
        h1 { color: #4CAF50; }
    </style>
</head>
<body>
    <h1>Basic Demo</h1>
    <p>This is a basic demo of ClientServeJS.</p>
    <p>Current time: <span id="time"></span></p>
    
    <script>
        document.getElementById('time').textContent = new Date().toLocaleTimeString();
    <\/script>
</body>
</html>`);
                
                // Game demo
                const gameZip = new JSZip();
                gameZip.file("index.html", `<!DOCTYPE html>
<html>
<head>
    <title>Game Demo</title>
    <link rel="stylesheet" href="style.css">
</head>
<body>
    <div class="game-container">
        <h1>Simple Game Demo</h1>
        <div class="game">
            <div class="player" id="player"></div>
        </div>
        <div class="controls">
            <p>Use arrow keys to move the player</p>
            <p>Score: <span id="score">0</span></p>
        </div>
    </div>
    
    <script src="game.js"><\/script>
</body>
</html>`);
                
                gameZip.file("style.css", `body {
    font-family: sans-serif;
    background-color: #f5f5f5;
    margin: 0;
    padding: 20px;
}

.game-container {
    max-width: 800px;
    margin: 0 auto;
    background-color: white;
    border-radius: 8px;
    box-shadow: 0 4px 6px rgba(0, 0, 0, 0.1);
    padding: 20px;
}

h1 {
    color: #4CAF50;
    text-align: center;
}

.game {
    width: 100%;
    height: 300px;
    background-color: #333;
    position: relative;
    overflow: hidden;
    border-radius: 4px;
}

.player {
    width: 30px;
    height: 30px;
    background-color: #4CAF50;
    position: absolute;
    left: 50%;
    top: 50%;
    transform: translate(-50%, -50%);
    transition: left 0.1s, top 0.1s;
}

.controls {
    margin-top: 20px;
    text-align: center;
}

#score {
    font-weight: bold;
    color: #4CAF50;
}`);
                
                gameZip.file("game.js", `// Simple game logic
let playerX = 50;
let playerY = 50;
let score = 0;
const player = document.getElementById('player');
const scoreDisplay = document.getElementById('score');
const gameArea = document.querySelector('.game');
const gameWidth = gameArea.clientWidth;
const gameHeight = gameArea.clientHeight;
const playerSize = 30;

// Set initial position
updatePlayerPosition();

// Handle keyboard input
document.addEventListener('keydown', (event) => {
    const speed = 5;
    
    switch(event.key) {
        case 'ArrowUp':
            playerY = Math.max(0, playerY - speed);
            break;
        case 'ArrowDown':
            playerY = Math.min(100, playerY + speed);
            break;
        case 'ArrowLeft':
            playerX = Math.max(0, playerX - speed);
            break;
        case 'ArrowRight':
            playerX = Math.min(100, playerX + speed);
            break;
    }
    
    updatePlayerPosition();
    incrementScore();
});

function updatePlayerPosition() {
    // Convert percentage to pixels
    const pixelX = (playerX / 100) * (gameWidth - playerSize);
    const pixelY = (playerY / 100) * (gameHeight - playerSize);
    
    player.style.left = pixelX + 'px';
    player.style.top = pixelY + 'px';
}

function incrementScore() {
    score++;
    scoreDisplay.textContent = score;
}`);
                
                // Save the demo files
                const basicContent = await basicZip.generateAsync({type: 'blob'});
                const gameContent = await gameZip.generateAsync({type: 'blob'});
                
                // Create URLs for the demo files
                window.demoBasicUrl = URL.createObjectURL(basicContent);
                window.demoGameUrl = URL.createObjectURL(gameContent);
                
                // Update demo file links
                document.querySelectorAll('.demo-file').forEach(demoFile => {
                    const url = demoFile.dataset.url;
                    if (url === 'demo-basic.zip') {
                        demoFile.addEventListener('click', () => {
                            selectedDemoUrl = window.demoBasicUrl;
                            fileNameDisplay.textContent = 'demo-basic.zip';
                            archiveFileInput.value = '';
                            selectedFile = null;
                            updateStatus('Demo file selected: demo-basic.zip');
                        });
                    } else if (url === 'demo-game.zip') {
                        demoFile.addEventListener('click', () => {
                            selectedDemoUrl = window.demoGameUrl;
                            fileNameDisplay.textContent = 'demo-game.zip';
                            archiveFileInput.value = '';
                            selectedFile = null;
                            updateStatus('Demo file selected: demo-game.zip');
                        });
                    }
                });
                
                console.log('Demo files created');
            } catch (error) {
                console.error('Failed to create demo files:', error);
            }
        }

        function launchCustomFile() {
            if (!clientServe) return;

            const customFile = startFileInput.value.trim();
            if (customFile) {
                clientServe.launch(customFile);
            } else if (fileListSelect.selectedOptions.length > 0) {
                clientServe.launch(fileListSelect.selectedOptions[0].value);
            } else {
                showError('Please enter a start file or select one from the list');
            }
        }

        // Add event listeners to handle option conflicts
        blobModeCheckbox.addEventListener('change', function() {
            if (!this.checked && unityBlobModeCheckbox.checked) {
                unityBlobModeCheckbox.checked = false;
                alert('Unity Blob Mode requires Blob Mode to be enabled. Unity Blob Mode has been disabled.');
            }
        });

        unityBlobModeCheckbox.addEventListener('change', function() {
            if (this.checked) {
                if (!blobModeCheckbox.checked) {
                    blobModeCheckbox.checked = true;
                    alert('Unity Blob Mode requires Blob Mode. Blob Mode has been enabled.');
                }
                
                if (unityBlobFallbackCheckbox.checked) {
                    if (confirm('Unity Blob Mode conflicts with Unity Blob Fallback. Disable Unity Blob Fallback?')) {
                        unityBlobFallbackCheckbox.checked = false;
                    } else {
                        this.checked = false;
                    }
                }
            }
        });
        
        // Initialize demo files
        createDemoZips();