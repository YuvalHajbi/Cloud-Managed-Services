const apiUrl = (() => {
    const url = `${window.location.protocol}//${window.location.host}/api`;
    console.log('API URL:', url);
    return url;
})();

let config;

// Mapping of category values to descriptive names
const categoryNames = {
  'Category1': 'Community and Social Events',
  'Category2': 'Items for Sale or Rent',
  'Category3': 'Services Offered'
};

async function loadConfig() {
  try {
    const response = await fetch(`${apiUrl}/config`);
    if (!response.ok) {
      throw new Error(`HTTP error! status: ${response.status}`);
    }
    config = await response.json();
  } catch (error) {
    console.error('Error loading configuration:', error);
  }
}

// Add file name display
document.getElementById('imageInput').addEventListener('change', function(e) {
  const fileName = e.target.files[0]?.name || 'No file chosen';
  document.getElementById('file-name').textContent = fileName;
});

document.getElementById('uploadForm').addEventListener('submit', async (e) => {
  e.preventDefault();
  
  const formData = new FormData();
  formData.append('image', document.getElementById('imageInput').files[0]);
  formData.append('category', document.getElementById('categoryInput').value);

  showLoading();
  try {
    const response = await fetch(`${apiUrl}/upload`, {
      method: 'POST',
      body: formData
    });
    if (!response.ok) {
      throw new Error(`HTTP error! status: ${response.status}`);
    }
    const result = await response.json();
    document.getElementById('message').textContent = result.message;
    loadImages();
  } catch (error) {
    console.error('Error:', error);
    document.getElementById('message').textContent = `An error occurred during upload: ${error.message}`;
  } finally {
    hideLoading();
  }
});

async function loadImages(category = '') {
  showLoading();
  try {
    console.log('Fetching images from:', `${apiUrl}/images`);
    const response = await fetch(`${apiUrl}/images`);
    if (!response.ok) {
      throw new Error(`HTTP error! status: ${response.status}`);
    }
    const text = await response.text(); // Get response as text first
    console.log('Raw response:', text); // Log the raw response
    const data = text ? JSON.parse(text) : { images: [] }; // Parse if not empty, else use empty array
    console.log('Parsed image data:', data);
    if (!data || !data.images) {
      throw new Error('Invalid response format');
    }
    const gallery = document.getElementById('gallery');
    gallery.innerHTML = '';
    
    data.images.filter(img => category === '' || img.Category === category).forEach(img => {
      const imgUrl = `${apiUrl}/images/${img.ImageName}`;
      console.log('Image URL:', imgUrl);
      const imgElement = document.createElement('div');
      imgElement.className = 'gallery-item';
      imgElement.innerHTML = `
        <img src="${imgUrl}" alt="${img.ImageName}">
        <button class="delete-btn" data-id="${img.ID}">X</button>
      `;
      gallery.appendChild(imgElement);
    });
    
    addDeleteListeners();
  } catch (error) {
    console.error('Error loading images:', error);
    document.getElementById('message').textContent = `Error loading images: ${error.message}`;
  } finally {
    hideLoading();
  }
}

function showLoading() {
  document.getElementById('loading').style.display = 'block';
}

function hideLoading() {
  document.getElementById('loading').style.display = 'none';
}

async function loadImagesByCategory() {
  showLoading();
  try {
    console.log('Fetching categories from:', `${apiUrl}/categories`);
    const response = await fetch(`${apiUrl}/categories`);
    if (!response.ok) {
      throw new Error(`HTTP error! status: ${response.status}`);
    }
    const text = await response.text(); // Get response as text first
    console.log('Raw response:', text); // Log the raw response
    const categorizedImages = text ? JSON.parse(text) : []; // Parse if not empty, else use empty array
    console.log('Received categorized image data:', categorizedImages);
    const gallery = document.getElementById('gallery');
    gallery.innerHTML = '';

    if (categorizedImages.length === 0) {
      gallery.innerHTML = '<p>No images found.</p>';
    } else {
      categorizedImages.forEach(category => {
        const categoryElement = document.createElement('div');
        categoryElement.className = 'category-section';
        categoryElement.innerHTML = `<h2>${categoryNames[category.category] || category.category}</h2>`;
        
        const imagesElement = document.createElement('div');
        imagesElement.className = 'category-images';
        
        category.images.forEach(img => {
          const imgElement = document.createElement('div');
          imgElement.className = 'gallery-item';
          imgElement.innerHTML = `
            <img src="${img.url}" alt="${img.name}">
            <button class="delete-btn" data-id="${img.id}">X</button>
          `;
          imagesElement.appendChild(imgElement);
        });
        
        categoryElement.appendChild(imagesElement);
        gallery.appendChild(categoryElement);
      });
      addDeleteListeners();
    }
  } catch (error) {
    console.error('Error loading images by category:', error);
    document.getElementById('message').textContent = 'An error occurred while loading images by category.';
  } finally {
    hideLoading();
  }
}

function addDeleteListeners() {
  document.querySelectorAll('.delete-btn').forEach(btn => {
    btn.addEventListener('click', async (e) => {
      const id = e.target.getAttribute('data-id');
      if (!confirm('Are you sure you want to delete this image?')) {
        return;
      }
      showLoading();
      try {
        const response = await fetch(`${apiUrl}/images/${id}`, {
          method: 'DELETE'
        });
        if (response.ok) {
          e.target.parentElement.remove();
          document.getElementById('message').textContent = 'Image deleted successfully.';
        } else {
          throw new Error('Failed to delete image');
        }
      } catch (error) {
        console.error('Error deleting image:', error);
        document.getElementById('message').textContent = 'An error occurred while deleting the image.';
      } finally {
        hideLoading();
      }
    });
  });
}

document.getElementById('categoryFilter').addEventListener('change', (e) => {
  loadImages(e.target.value);
});

document.addEventListener('DOMContentLoaded', () => {
  console.log('DOM content loaded, initializing...');
  loadImages();
  
  // Update category filter options
  const categoryFilter = document.getElementById('categoryFilter');
  Object.entries(categoryNames).forEach(([value, name]) => {
    const option = categoryFilter.querySelector(`option[value="${value}"]`);
    if (option) {
      option.textContent = name;
    }
  });

  // Add a button to switch between views
  const viewToggle = document.createElement('button');
  viewToggle.textContent = 'Toggle Category View';
  viewToggle.classList.add('view-toggle-btn');
  viewToggle.addEventListener('click', () => {
    if (viewToggle.textContent === 'Toggle Category View') {
      loadImagesByCategory();
      viewToggle.textContent = 'Toggle Normal View';
    } else {
      loadImages();
      viewToggle.textContent = 'Toggle Category View';
    }
  });
  
  // Insert the button into the new container
  document.getElementById('viewToggleContainer').appendChild(viewToggle);
});
