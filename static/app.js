// ==================================================
// FILE: static/app.js
// Frontend wizard logic
// ==================================================

let currentStep = 1;
let selectedType = '';
let generatedBlobUrl = '';

// DOM Elements
const steps = document.querySelectorAll('.step');
const wizardSteps = document.querySelectorAll('.wizard-step');
const qrCards = document.querySelectorAll('.qr-card');
const forms = {
    url: document.getElementById('form-url'),
    wifi: document.getElementById('form-wifi'),
    vcard: document.getElementById('form-vcard')
};

// Buttons
const btnNext1 = document.getElementById('btn-next-1');
const btnNext2 = document.getElementById('btn-next-2');
const btnBack2 = document.getElementById('btn-back-2');
const btnGenerate = document.getElementById('btn-generate');
const btnBack3 = document.getElementById('btn-back-3');
const btnBack4 = document.getElementById('btn-back-4');
const btnDownload = document.getElementById('btn-download');
const btnNew = document.getElementById('btn-new');

// Preview
const qrPreview = document.getElementById('qr-preview');
const previewPlaceholder = document.getElementById('preview-placeholder');

// ============== Utility Functions ==============

function updateStepper() {
    steps.forEach((step, index) => {
        const stepNum = index + 1;
        step.classList.remove('active', 'completed');
        
        if (stepNum === currentStep) {
            step.classList.add('active');
        } else if (stepNum < currentStep) {
            step.classList.add('completed');
        }
    });
}

function showStep(stepNum) {
    wizardSteps.forEach(step => step.classList.add('hidden'));
    document.getElementById(`step-${stepNum}`).classList.remove('hidden');
    currentStep = stepNum;
    updateStepper();
    window.scrollTo({ top: 0, behavior: 'smooth' });
}

function showError(message) {
    alert(message);
}

// ============== Step 1: Select QR Type ==============

qrCards.forEach(card => {
    card.addEventListener('click', function() {
        qrCards.forEach(c => c.classList.remove('selected'));
        this.classList.add('selected');
        selectedType = this.dataset.type;
    });
});

btnNext1.addEventListener('click', function() {
    if (!selectedType) {
        showError('Please select a QR code type');
        return;
    }
    
    // Show appropriate form
    Object.values(forms).forEach(form => form.classList.add('hidden'));
    forms[selectedType].classList.remove('hidden');
    
    showStep(2);
});

// ============== Step 2: Add Content ==============

btnBack2.addEventListener('click', function() {
    showStep(1);
});

btnNext2.addEventListener('click', function() {
    // Validate based on type
    let isValid = false;
    
    if (selectedType === 'url') {
        const data = document.getElementById('url-data').value.trim();
        if (data) {
            isValid = true;
        } else {
            showError('Please enter a URL or text');
        }
    } else if (selectedType === 'wifi') {
        const ssid = document.getElementById('wifi-ssid').value.trim();
        if (ssid) {
            isValid = true;
        } else {
            showError('Please enter WiFi SSID');
        }
    } else if (selectedType === 'vcard') {
        const name = document.getElementById('vcard-name').value.trim();
        const phone = document.getElementById('vcard-phone').value.trim();
        const email = document.getElementById('vcard-email').value.trim();
        
        if (name && phone && email) {
            isValid = true;
        } else {
            showError('Please fill in Name, Phone, and Email fields');
        }
    }
    
    if (isValid) {
        showStep(3);
    }
});

// ============== Step 3: Design & Generate ==============

btnBack3.addEventListener('click', function() {
    showStep(2);
});

btnGenerate.addEventListener('click', async function() {
    const btn = this;
    btn.disabled = true;
    btn.textContent = 'Generating...';
    
    try {
        const formData = new FormData();
        formData.append('type', selectedType);
        
        // Add content based on type
        if (selectedType === 'url') {
            formData.append('data', document.getElementById('url-data').value.trim());
        } else if (selectedType === 'wifi') {
            formData.append('ssid', document.getElementById('wifi-ssid').value.trim());
            formData.append('password', document.getElementById('wifi-password').value);
            formData.append('security', document.getElementById('wifi-security').value);
            formData.append('hidden', document.getElementById('wifi-hidden').checked ? 'true' : 'false');
        } else if (selectedType === 'vcard') {
            formData.append('name', document.getElementById('vcard-name').value.trim());
            formData.append('phone', document.getElementById('vcard-phone').value.trim());
            formData.append('email', document.getElementById('vcard-email').value.trim());
            formData.append('company', document.getElementById('vcard-company').value.trim());
            formData.append('title', document.getElementById('vcard-title').value.trim());
        }
        
        // Add design options
        formData.append('fill_color', document.getElementById('design-fill').value);
        formData.append('back_color', document.getElementById('design-back').value);
        formData.append('error_level', document.getElementById('design-error').value);
        formData.append('label', document.getElementById('design-label').value.trim());
        
        // Add logo if uploaded
        const logoInput = document.getElementById('design-logo');
        if (logoInput.files.length > 0) {
            formData.append('logo', logoInput.files[0]);
        }
        
        // Call API
        const response = await fetch('/api/generate', {
            method: 'POST',
            body: formData
        });
        
        if (!response.ok) {
            const error = await response.json();
            throw new Error(error.error || 'Failed to generate QR code');
        }
        
        // Get image blob
        const blob = await response.blob();
        
        // Revoke old blob URL if exists
        if (generatedBlobUrl) {
            URL.revokeObjectURL(generatedBlobUrl);
        }
        
        // Create new blob URL
        generatedBlobUrl = URL.createObjectURL(blob);
        
        // Update preview
        qrPreview.src = generatedBlobUrl;
        qrPreview.classList.remove('hidden');
        previewPlaceholder.classList.add('hidden');
        
        // Go to step 4
        showStep(4);
        
    } catch (error) {
        showError('Error: ' + error.message);
    } finally {
        btn.disabled = false;
        btn.textContent = 'Generate QR';
    }
});

// ============== Step 4: Download ==============

btnBack4.addEventListener('click', function() {
    showStep(3);
});

btnDownload.addEventListener('click', function() {
    if (!generatedBlobUrl) {
        showError('No QR code to download');
        return;
    }
    
    const a = document.createElement('a');
    a.href = generatedBlobUrl;
    a.download = `qrcode_${selectedType}_${Date.now()}.png`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
});

btnNew.addEventListener('click', function() {
    // Reset everything
    selectedType = '';
    currentStep = 1;
    
    // Clear forms
    document.getElementById('url-data').value = '';
    document.getElementById('wifi-ssid').value = '';
    document.getElementById('wifi-password').value = '';
    document.getElementById('wifi-security').value = 'WPA';
    document.getElementById('wifi-hidden').checked = false;
    document.getElementById('vcard-name').value = '';
    document.getElementById('vcard-phone').value = '';
    document.getElementById('vcard-email').value = '';
    document.getElementById('vcard-company').value = '';
    document.getElementById('vcard-title').value = '';
    
    // Reset design
    document.getElementById('design-fill').value = '#000000';
    document.getElementById('design-back').value = '#ffffff';
    document.getElementById('design-error').value = 'M';
    document.getElementById('design-label').value = '';
    document.getElementById('design-logo').value = '';
    
    // Clear preview
    qrPreview.classList.add('hidden');
    previewPlaceholder.classList.remove('hidden');
    
    // Revoke blob URL
    if (generatedBlobUrl) {
        URL.revokeObjectURL(generatedBlobUrl);
        generatedBlobUrl = '';
    }
    
    // Deselect cards
    qrCards.forEach(c => c.classList.remove('selected'));
    
    // Go back to step 1
    showStep(1);
});

// Initialize
updateStepper();