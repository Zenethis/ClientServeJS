    document.addEventListener('DOMContentLoaded', function() {
      // Elements
      const fileDropArea = document.getElementById('file-drop-area');
      const csjFileInput = document.getElementById('csj-file');
      const fileInfo = document.getElementById('file-info');
      const fileName = document.getElementById('file-name');
      const fileSize = document.getElementById('file-size');
      const csjPasswordInput = document.getElementById('csj-password');
      const appTitleInput = document.getElementById('app-title');
      const startFileInput = document.getElementById('start-file');
      const serviceWorkerUrlInput = document.getElementById('service-worker-url');
      const serviceWorkerUrlContainer = document.getElementById('service-worker-url-container');
      const servingMethodRadios = document.querySelectorAll('input[name="serving-method"]');
      const encryptCsjCheckbox = document.getElementById('encrypt-csj');
      const encryptionPasswordInput = document.getElementById('encryption-password');
      const customCssTextarea = document.getElementById('custom-css');
      const customJsTextarea = document.getElementById('custom-js');
      const generateButton = document.getElementById('generate-button');
      const resetButton = document.getElementById('reset-button');
      const progressContainer = document.getElementById('progress-container');
      const progressBar = document.getElementById('progress-bar');
      const alertDiv = document.getElementById('alert');
      const tabs = document.querySelectorAll('.tab');
      const tabContents = document.querySelectorAll('.tab-content');
      const steps = document.querySelectorAll('.step');
      
      // Step navigation buttons
      const nextStep1Button = document.getElementById('next-step-1');
      const prevStep2Button = document.getElementById('prev-step-2');
      const nextStep2Button = document.getElementById('next-step-2');
      const prevStep3Button = document.getElementById('prev-step-3');
      const nextStep3Button = document.getElementById('next-step-3');
      const prevStep4Button = document.getElementById('prev-step-4');
      
      // Step containers
      const step1Container = document.getElementById('step-1');
      const step2Container = document.getElementById('step-2');
      const step3Container = document.getElementById('step-3');
      const step4Container = document.getElementById('step-4');
      
      // Variables
      let csjFile = null;
      let clientServe = null;
      let currentStep = 1;
      
      // Initialize ClientServe
      function initClientServe() {
        clientServe = new ClientServe({
          debug: true,
          showLoadingBar: false,
          persistFiles: false
        });
      }
      
      // Check if ClientServe is available
      if (typeof ClientServe === 'undefined') {
        showAlert('ClientServeJS library not found. Please make sure clientserve.js is loaded.', 'error');
      } else {
        initClientServe();
      }
      
      // Set default service worker URL
      serviceWorkerUrlInput.value = window.location.href.replace(/\/[^\/]*$/, '/clientserve.js');
      
      // Handle serving method change
      servingMethodRadios.forEach(radio => {
        radio.addEventListener('change', function() {
          if (this.value === 'service-worker') {
            serviceWorkerUrlContainer.classList.remove('hidden');
          } else {
            serviceWorkerUrlContainer.classList.add('hidden');
          }
        });
      });
      
      // File drop area event listeners
      fileDropArea.addEventListener('click', function() {
        csjFileInput.click();
      });
      
      fileDropArea.addEventListener('dragover', function(e) {
        e.preventDefault();
        e.stopPropagation();
        this.classList.add('dragover');
      });
      
      fileDropArea.addEventListener('dragleave', function(e) {
        e.preventDefault();
        e.stopPropagation();
        this.classList.remove('dragover');
      });
      
      fileDropArea.addEventListener('drop', function(e) {
        e.preventDefault();
        e.stopPropagation();
        this.classList.remove('dragover');
        
        if (e.dataTransfer.files.length > 0) {
          handleFileSelect(e.dataTransfer.files[0]);
        }
      });
      
      // File input change handler
      csjFileInput.addEventListener('change', function(event) {
        if (event.target.files.length > 0) {
          handleFileSelect(event.target.files[0]);
        }
      });
      
      // Handle file selection
      function handleFileSelect(file) {
        if (file.name.endsWith('.csj')) {
          csjFile = file;
          fileName.textContent = file.name;
          fileSize.textContent = formatFileSize(file.size);
          fileInfo.classList.remove('hidden');
          nextStep1Button.disabled = false;
          showAlert('CSJ file selected: ' + file.name, 'success');
        } else {
          showAlert('Please select a valid .csj file', 'error');
          csjFile = null;
          fileInfo.classList.add('hidden');
          nextStep1Button.disabled = true;
        }
      }
      
      // Format file size
      function formatFileSize(bytes) {
        if (bytes === 0) return '0 Bytes';
        const k = 1024;
        const sizes = ['Bytes', 'KB', 'MB', 'GB'];
        const i = Math.floor(Math.log(bytes) / Math.log(k));
        return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
      }
      
      // Tab switching
      tabs.forEach(tab => {
        tab.addEventListener('click', function() {
          // Remove active class from all tabs
          tabs.forEach(t => t.classList.remove('active'));
          
          // Add active class to clicked tab
          this.classList.add('active');
          
          // Hide all tab contents
          tabContents.forEach(content => content.classList.remove('active'));
          
          // Show the corresponding tab content
          const tabId = 'tab-' + this.getAttribute('data-tab');
          document.getElementById(tabId).classList.add('active');
        });
      });
      
      // Step navigation
      function goToStep(step) {
        // Hide all steps
        step1Container.classList.add('hidden');
        step2Container.classList.add('hidden');
        step3Container.classList.add('hidden');
        step4Container.classList.add('hidden');
        
        // Show the current step
        document.getElementById('step-' + step).classList.remove('hidden');
        
        // Update step indicators
        steps.forEach(s => {
          const stepNum = parseInt(s.getAttribute('data-step'));
          s.classList.remove('active', 'completed');
          
          if (stepNum === step) {
            s.classList.add('active');
          } else if (stepNum < step) {
            s.classList.add('completed');
          }
        });
        
        currentStep = step;
      }
      
      // Step navigation buttons
      nextStep1Button.addEventListener('click', function() {
        goToStep(2);
      });
      
      prevStep2Button.addEventListener('click', function() {
        goToStep(1);
      });
      
      nextStep2Button.addEventListener('click', function() {
        goToStep(3);
      });
      
      prevStep3Button.addEventListener('click', function() {
        goToStep(2);
      });
      
      nextStep3Button.addEventListener('click', function() {
        goToStep(4);
      });
      
      prevStep4Button.addEventListener('click', function() {
        goToStep(3);
      });
      
      // Generate button click handler
      generateButton.addEventListener('click', async function() {
        if (!csjFile) {
          showAlert('Please select a CSJ file first', 'error');
          goToStep(1);
          return;
        }
        
        try {
          // Show progress
          progressContainer.classList.remove('hidden');
          progressBar.style.width = '10%';
          
          // Read the CSJ file
          const fileBuffer = await readFileAsArrayBuffer(csjFile);
          progressBar.style.width = '20%';
          
          // Get the CSJ password
          const csjPassword = csjPasswordInput.value || 'clientserve';
          
          // Decrypt the CSJ file
          const csjData = await CSJFormat.decrypt(new Uint8Array(fileBuffer), csjPassword);
          progressBar.style.width = '40%';
          
          if (!csjData || !csjData.files) {
            throw new Error('Invalid CSJ file or incorrect password');
          }
          
          // Get the serving method
          const servingMethod = document.querySelector('input[name="serving-method"]:checked').value;
          
          // Create a new ClientServe instance with the extracted files
          clientServe = new ClientServe({
            debug: true,
            showLoadingBar: false,
            persistFiles: false,
            csjPassword: csjPassword
          });
          
          // Set the files
          clientServe.files = csjData.files;
          progressBar.style.width = '60%';
          
          // Get the options for the offline file
          const options = {
            title: appTitleInput.value || 'ClientServeJS Offline App',
            startFile: startFileInput.value || 'index.html',
            remoteServiceWorkerUrl: serviceWorkerUrlInput.value,
            password: encryptCsjCheckbox.checked ? (encryptionPasswordInput.value || csjPassword) : null,
            customCss: customCssTextarea.value,
            customJs: customJsTextarea.value,
            files: clientServe.files, // Pass the files to createOfflineHtml
            servingMethod: servingMethod // Pass the serving method to createOfflineHtml
          };
          
          // Create the offline HTML file
          const offlineBlob = await clientServe.createOfflineHtml(options);
          progressBar.style.width = '90%';
          
          // Create a download link
          const downloadUrl = URL.createObjectURL(offlineBlob);
          const downloadLink = document.createElement('a');
          downloadLink.href = downloadUrl;
          downloadLink.download = (appTitleInput.value || 'offline-app').replace(/\s+/g, '-').toLowerCase() + '.html';
          
          // Trigger the download
          document.body.appendChild(downloadLink);
          downloadLink.click();
          document.body.removeChild(downloadLink);
          
          progressBar.style.width = '100%';
          showAlert('Offline file generated successfully!', 'success');
          
          // Hide progress after a delay
          setTimeout(() => {
            progressContainer.classList.add('hidden');
            progressBar.style.width = '0%';
          }, 2000);
        } catch (error) {
          console.error('Error generating offline file:', error);
          showAlert('Error: ' + error.message, 'error');
          progressContainer.classList.add('hidden');
        }
      });
      
      // Reset button click handler
      resetButton.addEventListener('click', function() {
        // Reset file input
        csjFileInput.value = '';
        fileInfo.classList.add('hidden');
        csjFile = null;
        
        // Reset form fields
        csjPasswordInput.value = '';
        appTitleInput.value = '';
        startFileInput.value = 'index.html';
        serviceWorkerUrlInput.value = window.location.href.replace(/\/[^\/]*$/, '/clientserve.js');
        document.querySelector('input[name="serving-method"][value="service-worker"]').checked = true;
        serviceWorkerUrlContainer.classList.remove('hidden');
        encryptCsjCheckbox.checked = true;
        encryptionPasswordInput.value = '';
        customCssTextarea.value = '';
        customJsTextarea.value = '';
        
        // Disable next button
        nextStep1Button.disabled = true;
        
        // Hide progress
        progressContainer.classList.add('hidden');
        progressBar.style.width = '0%';
        
        // Hide alert
        alertDiv.classList.add('hidden');
        
        // Go to step 1
        goToStep(1);
      });
      
      // Helper function to read a file as ArrayBuffer
      function readFileAsArrayBuffer(file) {
        return new Promise((resolve, reject) => {
          const reader = new FileReader();
          reader.onload = () => resolve(reader.result);
          reader.onerror = reject;
          reader.readAsArrayBuffer(file);
        });
      }
      
      // Helper function to show alerts
      function showAlert(message, type) {
        alertDiv.textContent = message;
        alertDiv.className = 'alert';
        alertDiv.classList.add('alert-' + type);
        alertDiv.classList.remove('hidden');
        
        // Auto-hide success alerts after 5 seconds
        if (type === 'success') {
          setTimeout(() => {
            alertDiv.classList.add('hidden');
          }, 5000);
        }
      }
    });