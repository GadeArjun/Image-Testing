document.addEventListener("DOMContentLoaded", function () {
  const uploadForm = document.getElementById('uploadForm');
  const fileInputContainer = document.getElementById('fileInputContainer');
  const messageBox = document.getElementById('message');
  const loadingIndicator = document.getElementById('loading');
  const uploadedFilesContainer = document.getElementById('uploadedFiles');

  // Utility: Show message in a message box.
  function showMessage(type, text) {
    messageBox.innerHTML = `<div class="message ${type}">${text}</div>`;
    setTimeout(() => {
      messageBox.innerHTML = '';
    }, 10000);
  }

  // Utility: Toggle loading indicator visibility.
  function setLoading(state) {
    if (state) {
      loadingIndicator.classList.remove('hidden');
    } else {
      loadingIndicator.classList.add('hidden');
    }
  }

  // Check for mobile or desktop mode and initialize file input accordingly.
  function initializeFileInput() {
    const isMobile = /Mobi|Android/i.test(navigator.userAgent);
    fileInputContainer.innerHTML = '';

    alert('isMobile: ' + isMobile);
    // If mobile view and "flute picker" is available, use it.
    if (isMobile && typeof window.flutePicker === 'function') {
      alert('Mobile mode: Using Flute Picker');
      const btn = document.createElement('button');
      btn.type = 'button';
      btn.innerText = 'Select Image (Flute Picker)';
      btn.addEventListener('click', function () {
        window.flutePicker(function (file) {
          // Simulate a file object from flutePicker.
          const simulatedFile = new File([file.data], file.name, { type: file.type });
          const fileInput = document.createElement('input');
          fileInput.type = 'file';
          fileInput.name = 'image';
          fileInput.accept = 'image/*';
          // Use DataTransfer to set the file.
          const dt = new DataTransfer();
          dt.items.add(simulatedFile);
          fileInput.files = dt.files;
          fileInputContainer.appendChild(fileInput);
        });
      });
      fileInputContainer.appendChild(btn);
    } else {
      alert('Desktop mode: Using standard file input');
      // Default desktop mode: create a standard file input.
      const fileInput = document.createElement('input');
      fileInput.type = 'file';
      fileInput.id = 'fileInput';
      fileInput.name = 'image';
      fileInput.accept = 'image/*';
      fileInput.required = true;
      fileInputContainer.appendChild(fileInput);
    }
  }

  // Fetch the list of uploaded files from the server.
  function fetchUploadedFiles() {
    setLoading(true);
    fetch('/files')
      .then(response => {
        if (!response.ok) {
          return response.text().then(text => { throw new Error(text || response.statusText); });
        }
        return response.json();
      })
      .then(data => {
        uploadedFilesContainer.innerHTML = '';
        if (data.files && data.files.length > 0) {
          data.files.forEach(file => {
            const img = document.createElement('img');
            img.src = `/uploads/${file}`;
            img.alt = file;
            img.className = 'uploaded-img';
            uploadedFilesContainer.appendChild(img);
          });
        } else {
          uploadedFilesContainer.innerHTML = '<p>No files uploaded yet.</p>';
        }
        setLoading(false);
      })
      .catch(err => {
        setLoading(false);
        showMessage('danger', 'Error fetching files: ' + err.message);
        console.error(err);
      });
  }

  // Initialize the file input based on the device.
  initializeFileInput();

  // Load existing uploaded files on page load.
  fetchUploadedFiles();

  // Handle form submission for uploading.
  uploadForm.addEventListener('submit', function (e) {
    e.preventDefault();
    setLoading(true);
    const formData = new FormData(uploadForm);
    fetch('/upload', {
      method: 'POST',
      body: formData
    })
      .then(response => {
        if (!response.ok) {
          return response.text().then(text => { throw new Error(text || response.statusText); });
        }
        return response.json();
      })
      .then(data => {
        setLoading(false);
        if (data.success) {
          showMessage('success', data.message);
          // Refresh the uploaded files list.
          fetchUploadedFiles();
          // Reset the form and reinitialize the file input.
          uploadForm.reset();
          initializeFileInput();
        } else {
          showMessage('danger', data.message || 'Upload failed');
        }
      })
      .catch(err => {
        setLoading(false);
        showMessage('danger', 'Error during upload: ' + err.message);
        console.error(err);
      });
  });
});
