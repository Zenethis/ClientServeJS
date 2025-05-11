    // DOM Elements
        const archiveSourceSelect = document.getElementById('archive-source');
        const zipInputDiv = document.getElementById('zip-input');
        const folderInputDiv = document.getElementById('folder-input');
        const zipFileInput = document.getElementById('zip-file');
        const folderFilesInput = document.getElementById('folder-files');
        const zipFileName = document.getElementById('zip-file-name');
        const folderFilesCount = document.getElementById('folder-files-count');
        const folderFilesList = document.getElementById('folder-files-list');
        const passwordInput = document.getElementById('password');
        const metadataInput = document.getElementById('metadata');
        const progressBar = document.getElementById('progress-bar');
        const statusDisplay = document.getElementById('status');
        const errorDisplay = document.getElementById('error');
        const createButton = document.getElementById('create-button');
        
        // Variables
        let selectedZipFile = null;
        let selectedFolderFiles = [];
        
        // Event Listeners
        archiveSourceSelect.addEventListener('change', function() {
            if (this.value === 'zip') {
                zipInputDiv.style.display = 'block';
                folderInputDiv.style.display = 'none';
            } else {
                zipInputDiv.style.display = 'none';
                folderInputDiv.style.display = 'block';
            }
        });
        
        zipFileInput.addEventListener('change', function(event) {
            selectedZipFile = event.target.files[0];
            
            if (selectedZipFile) {
                zipFileName.textContent = selectedZipFile.name;
                updateStatus('ZIP file selected: ' + selectedZipFile.name);
            } else {
                zipFileName.textContent = 'No file chosen';
                updateStatus('Ready to create CSJ archive');
            }
        });
        
        folderFilesInput.addEventListener('change', function(event) {
            selectedFolderFiles = Array.from(event.target.files);
            
            if (selectedFolderFiles.length > 0) {
                folderFilesCount.textContent = `${selectedFolderFiles.length} files selected`;
                updateStatus(`${selectedFolderFiles.length} files selected from folder`);
                
                // Display file list
                folderFilesList.innerHTML = '';
                selectedFolderFiles.forEach(file => {
                    const fileItem = document.createElement('div');
                    fileItem.className = 'file-list-item';
                    
                    const filePath = document.createElement('div');
                    filePath.className = 'file-list-item-path';
                    filePath.textContent = file.webkitRelativePath || file.name;
                    
                    const fileSize = document.createElement('div');
                    fileSize.className = 'file-list-item-size';
                    fileSize.textContent = formatFileSize(file.size);
                    
                    fileItem.appendChild(filePath);
                    fileItem.appendChild(fileSize);
                    folderFilesList.appendChild(fileItem);
                });
            } else {
                folderFilesCount.textContent = 'No files chosen';
                folderFilesList.innerHTML = '';
                updateStatus('Ready to create CSJ archive');
            }
        });
        
        createButton.addEventListener('click', createCSJArchive);
        
        // Functions
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
        
        function formatFileSize(bytes) {
            if (bytes === 0) return '0 Bytes';
            
            const k = 1024;
            const sizes = ['Bytes', 'KB', 'MB', 'GB', 'TB'];
            const i = Math.floor(Math.log(bytes) / Math.log(k));
            
            return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
        }
        
        async function createCSJArchive() {
            clearError();
            
            const archiveSource = archiveSourceSelect.value;
            const password = passwordInput.value || 'clientserve'; // Use default if not provided
            let metadata = {};
            
            try {
                if (metadataInput.value.trim()) {
                    metadata = JSON.parse(metadataInput.value);
                }
            } catch (error) {
                showError('Invalid JSON in metadata field');
                return;
            }
            
            if (archiveSource === 'zip' && !selectedZipFile) {
                showError('Please select a ZIP file');
                return;
            }
            
            if (archiveSource === 'folder' && selectedFolderFiles.length === 0) {
                showError('Please select folder files');
                return;
            }
            
            try {
                createButton.disabled = true;
                updateStatus('Processing files...');
                updateProgress(10);
                
                let files = {};
                
                if (archiveSource === 'zip') {
                    // Extract files from ZIP
                    updateStatus('Extracting ZIP file...');
                    
                    const zipData = await readFileAsArrayBuffer(selectedZipFile);
                    const zip = await JSZip.loadAsync(zipData);
                    
                    let processedFiles = 0;
                    const totalFiles = Object.keys(zip.files).length;
                    
                    for (const [path, zipEntry] of Object.entries(zip.files)) {
                        if (!zipEntry.dir) {
                            const isBinary = isBinaryFile(path);
                            const content = await zipEntry.async(isBinary ? 'uint8array' : 'text');
                            
                            files[path] = {
                                content,
                                isBinary,
                                type: getMimeType(path),
                            };
                            
                            processedFiles++;
                            const percent = 10 + Math.round((processedFiles / totalFiles) * 40);
                            updateProgress(percent);
                            updateStatus(`Extracting: ${Math.round((processedFiles / totalFiles) * 100)}%`);
                        }
                    }
                } else {
                    // Process folder files
                    updateStatus('Processing folder files...');
                    
                    let processedFiles = 0;
                    const totalFiles = selectedFolderFiles.length;
                    
                    for (const file of selectedFolderFiles) {
                        const path = file.webkitRelativePath || file.name;
                        const isBinary = isBinaryFile(path);
                        const content = await readFile(file, isBinary);
                        
                        files[path] = {
                            content,
                            isBinary,
                            type: getMimeType(path),
                        };
                        
                        processedFiles++;
                        const percent = 10 + Math.round((processedFiles / totalFiles) * 40);
                        updateProgress(percent);
                        updateStatus(`Processing: ${Math.round((processedFiles / totalFiles) * 100)}%`);
                    }
                }
                
                updateStatus('Creating CSJ archive...');
                updateProgress(60);
                
                // Add metadata
                metadata.fileCount = Object.keys(files).length;
                metadata.createdAt = new Date().toISOString();
                
                // Create CSJ archive
                const csjData = await CSJFormat.createCSJ(files, metadata, password);
                
                updateStatus('CSJ archive created, preparing download...');
                updateProgress(90);
                
                // Create download link
                const blob = new Blob([csjData], { type: 'application/x-clientserve-archive' });
                const url = URL.createObjectURL(blob);
                const a = document.createElement('a');
                a.href = url;
                a.download = (archiveSource === 'zip' ? selectedZipFile.name : 'archive') + '.csj';
                document.body.appendChild(a);
                a.click();
                document.body.removeChild(a);
                
                updateStatus('CSJ archive created and downloaded successfully');
                updateProgress(100);
            } catch (error) {
                showError('Failed to create CSJ archive: ' + error.message);
                console.error(error);
            } finally {
                createButton.disabled = false;
            }
        }
        
        function readFileAsArrayBuffer(file) {
            return new Promise((resolve, reject) => {
                const reader = new FileReader();
                reader.onload = () => resolve(reader.result);
                reader.onerror = reject;
                reader.readAsArrayBuffer(file);
            });
        }
        
        function readFile(file, isBinary) {
            return new Promise((resolve, reject) => {
                const reader = new FileReader();
                reader.onload = () => {
                    if (isBinary) {
                        resolve(new Uint8Array(reader.result));
                    } else {
                        resolve(reader.result);
                    }
                };
                reader.onerror = reject;
                
                if (isBinary) {
                    reader.readAsArrayBuffer(file);
                } else {
                    reader.readAsText(file);
                }
            });
        }
        
        function isBinaryFile(filePath) {
            const binaryExtensions = [
                "png", "jpg", "jpeg", "gif", "webp", "bmp", "ico",
                "mp3", "wav", "ogg", "flac", "m4a",
                "mp4", "webm", "ogv", "mov",
                "ttf", "otf", "woff", "woff2", "eot",
                "pdf", "doc", "docx", "xls", "xlsx", "ppt", "pptx",
                "zip", "tar", "gz", "rar", "7z", "csj",
                "wasm", "glb", "gltf", "obj", "stl",
                "bin", "dat", "data", "unityweb", "mem",
            ];
            
            const extension = filePath.split(".").pop().toLowerCase();
            return binaryExtensions.includes(extension);
        }
        
        function getMimeType(filePath) {
            const mimeTypes = {
                // Web
                html: "text/html",
                css: "text/css",
                js: "application/javascript",
                mjs: "application/javascript",
                json: "application/json",
                xml: "application/xml",
                svg: "image/svg+xml",
                
                // Images
                png: "image/png",
                jpg: "image/jpeg",
                jpeg: "image/jpeg",
                gif: "image/gif",
                webp: "image/webp",
                bmp: "image/bmp",
                ico: "image/x-icon",
                
                // Audio
                mp3: "audio/mpeg",
                wav: "audio/wav",
                ogg: "audio/ogg",
                flac: "audio/flac",
                m4a: "audio/m4a",
                
                // Video
                mp4: "video/mp4",
                webm: "video/webm",
                ogv: "audio/ogg",
                mov: "video/quicktime",
                
                // Fonts
                ttf: "font/ttf",
                otf: "font/otf",
                woff: "font/woff",
                woff2: "font/woff2",
                eot: "application/vnd.ms-fontobject",
                
                // Documents
                pdf: "application/pdf",
                doc: "application/msword",
                docx: "application/vnd.openxmlformats-officedocument.wordprocessingml.document",
                xls: "application/vnd.ms-excel",
                xlsx: "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
                ppt: "application/vnd.ms-powerpoint",
                pptx: "application/vnd.openxmlformats-officedocument.presentationml.presentation",
                
                // Archives
                zip: "application/zip",
                tar: "application/x-tar",
                gz: "application/gzip",
                rar: "application/vnd.rar",
                "7z": "application/x-7z-compressed",
                "csj": "application/x-clientserve-archive",
                
                // WebAssembly
                wasm: "application/wasm",
                
                // Text
                txt: "text/plain",
                csv: "text/csv",
                md: "text/markdown",
                
                // 3D
                glb: "model/gltf-binary",
                gltf: "model/gltf+json",
                obj: "model/obj",
                stl: "model/stl",
                
                // Unity specific
                data: "application/octet-stream",
                unityweb: "application/octet-stream",
                mem: "application/octet-stream",
                
                // Other
                bin: "application/octet-stream",
                dat: "application/octet-stream",
            };
            
            const extension = filePath.split(".").pop().toLowerCase();
            return mimeTypes[extension] || "application/octet-stream";
        }