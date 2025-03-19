const startCameraBtn = document.getElementById('startCameraBtn');
const video = document.getElementById('video');
const captureBtn = document.getElementById('captureBtn');
const canvas = document.getElementById('canvas');
const capturedImage = document.getElementById('capturedImage');
const uploadBtn = document.getElementById('uploadBtn');
const detailsDiv = document.getElementById('details');
const serverImagesDiv = document.getElementById('serverImages');
const alertBox = document.getElementById('alertBox');

let stream;
let blobToUpload;

function showAlert(message, type = 'info') {
  alertBox.innerHTML = `<div class="alert alert-${type}">${message}</div>`;
  setTimeout(() => (alertBox.innerHTML = ''), 10000);
}


// Start camera and show video preview
startCameraBtn.addEventListener('click', async () => {
  try {
    // Check if the user agent indicates a mobile device
    const isMobile = /Android|iPhone|iPad|iPod/i.test(navigator.userAgent);
    // Set the facingMode: use "environment" for mobile to get the rear camera, "user" for non-mobile devices
    const constraints = {
      video: {
        facingMode: { ideal: isMobile ? "environment" : "user" }
      }
    };

    stream = await navigator.mediaDevices.getUserMedia(constraints);
    video.srcObject = stream;
    video.style.display = 'block';
    captureBtn.style.display = 'inline-block';
    showAlert('Camera opened. Ready to capture.', 'info');
  } catch (err) {
    showAlert('Error accessing camera: ' + err.message, 'danger');
  }
});


// Capture the photo from the video stream
captureBtn.addEventListener('click', () => {
  canvas.width = video.videoWidth;
  canvas.height = video.videoHeight;
  const context = canvas.getContext('2d');
  context.drawImage(video, 0, 0, canvas.width, canvas.height);
  stream.getTracks().forEach((track) => track.stop());
  video.style.display = 'none';
  captureBtn.style.display = 'none';
  uploadBtn.style.display = 'inline-block';

  // Convert canvas to blob and update the image preview
  canvas.toBlob(
    (blob) => {
      blobToUpload = blob;
      const url = URL.createObjectURL(blob);
      capturedImage.src = url;
      // Show the captured image until the upload is done
      capturedImage.style.display = 'block';
    },
    'image/png'
  );

  detailsDiv.innerHTML = `
    <p><strong>Image Details:</strong></p>
    <p>Format: PNG</p>
    <p>Resolution: ${canvas.width} x ${canvas.height}</p>
    <p>Captured at: ${new Date().toLocaleString()}</p>
  `;
  showAlert('Image captured. Ready to upload.', 'info');
});

// Upload the image to the server
uploadBtn.addEventListener('click', async () => {
  if (!blobToUpload) {
    showAlert('No image to upload.', 'danger');
    return;
  }

  const formData = new FormData();
  // Note: The field name is "file" to match what the server expects.
  formData.append('file', blobToUpload, 'captured_image.png');

  showAlert('Uploading image...', 'info');

  try {
    const res = await fetch('/upload', {
      method: 'POST',
      body: formData,
    });

    if (res.ok) {
      showAlert('Image uploaded successfully!', 'success');
      uploadBtn.style.display = 'none';
      // Hide the captured image preview after upload
      capturedImage.style.display = 'none';
      // Update details with file name and a note about file path
      detailsDiv.innerHTML += `
        <p>File Name: captured_image.png</p>
        <p>Note: The file is stored on the server in the "uploads" directory.</p>`;
      fetchServerImages();
    } else {
      showAlert('Upload failed. Try again.', 'danger');
    }
  } catch (err) {
    showAlert('Error uploading image: ' + err.message, 'danger');
  }
});

// Fetch the list of uploaded images from the server
async function fetchServerImages() {
  try {
    const res = await fetch('/files');
    const images = await res.json();
    serverImagesDiv.innerHTML = '';
    images.files.forEach((url) => {
      const img = document.createElement('img');
      img.src = `/uploads/${url}`;
      img.className = 'uploaded-image';
      serverImagesDiv.appendChild(img);
    });
    showAlert('Fetched images from server.', 'success');
  } catch (err) {
    showAlert('Error fetching images: ' + err.message, 'danger');
  }
}

// Fetch images on page load
fetchServerImages();
