// Array to store quotes with text and category
let quotes = [];
let lastSyncTimestamp = 0;
let syncInterval = null;
let isOnline = navigator.onLine;

// Initialize quotes with default data if no local storage exists
const defaultQuotes = [
    { text: "The only way to do great work is to love what you do.", category: "motivation", id: 1, timestamp: Date.now() },
    { text: "Life is what happens to you while you're busy making other plans.", category: "life", id: 2, timestamp: Date.now() },
    { text: "The future belongs to those who believe in the beauty of their dreams.", category: "inspiration", id: 3, timestamp: Date.now() },
    { text: "It is during our darkest moments that we must focus to see the light.", category: "inspiration", id: 4, timestamp: Date.now() },
    { text: "Success is not final, failure is not fatal: it is the courage to continue that counts.", category: "motivation", id: 5, timestamp: Date.now() },
    { text: "The only impossible journey is the one you never begin.", category: "motivation", id: 6, timestamp: Date.now() },
    { text: "In the end, we will remember not the words of our enemies, but the silence of our friends.", category: "life", id: 7, timestamp: Date.now() },
    { text: "Be yourself; everyone else is already taken.", category: "inspiration", id: 8, timestamp: Date.now() }
];

// Server configuration
const SERVER_CONFIG = {
    baseUrl: 'https://jsonplaceholder.typicode.com/posts',
    syncInterval: 30000, // 30 seconds
    timeout: 5000
};

// Local Storage Functions
function saveQuotes() {
    localStorage.setItem('quotes', JSON.stringify(quotes));
    localStorage.setItem('lastSyncTimestamp', lastSyncTimestamp.toString());
}

function loadQuotes() {
    const savedQuotes = localStorage.getItem('quotes');
    const savedTimestamp = localStorage.getItem('lastSyncTimestamp');
    
    if (savedQuotes) {
        quotes = JSON.parse(savedQuotes);
        // Ensure all quotes have required fields for syncing
        quotes = quotes.map(quote => ({
            ...quote,
            id: quote.id || generateId(),
            timestamp: quote.timestamp || Date.now()
        }));
    } else {
        quotes = [...defaultQuotes];
        saveQuotes(); // Save default quotes to localStorage
    }
    
    if (savedTimestamp) {
        lastSyncTimestamp = parseInt(savedTimestamp);
    }
}

// Session Storage Functions
function saveLastViewedQuote(quote) {
    sessionStorage.setItem('lastViewedQuote', JSON.stringify(quote));
}

function getLastViewedQuote() {
    const lastQuote = sessionStorage.getItem('lastViewedQuote');
    return lastQuote ? JSON.parse(lastQuote) : null;
}

function saveUserPreferences(category) {
    // Save to both localStorage and sessionStorage for persistence
    localStorage.setItem('selectedCategory', category);
    sessionStorage.setItem('selectedCategory', category);
}

function getUserPreferences() {
    // Check localStorage first, then sessionStorage for category preference
    return localStorage.getItem('selectedCategory') || 
           sessionStorage.getItem('selectedCategory') || 
           'all';
}

// Function to display a random quote based on selected category
function showRandomQuote() {
    const categoryFilter = document.getElementById('categoryFilter').value;
    const quoteDisplay = document.getElementById('quoteDisplay');
    let filteredQuotes = quotes;
    
    // Save user preference to local storage
    saveUserPreferences(categoryFilter);
    
    // Filter quotes by category if not "all"
    if (categoryFilter !== 'all') {
        filteredQuotes = quotes.filter(quote => quote.category === categoryFilter);
    }
    
    // Update category count display
    updateCategoryCount(filteredQuotes.length, quotes.length, categoryFilter);
    
    // If no quotes in selected category, show message
    if (filteredQuotes.length === 0) {
        document.getElementById('quoteText').textContent = 'No quotes available in this category.';
        document.getElementById('quoteCategory').textContent = '';
        quoteDisplay.style.opacity = '0.7';
        return;
    }
    
    // Select random quote from filtered quotes
    const randomIndex = Math.floor(Math.random() * filteredQuotes.length);
    const selectedQuote = filteredQuotes[randomIndex];
    
    // Display the quote
    document.getElementById('quoteText').textContent = `"${selectedQuote.text}"`;
    document.getElementById('quoteCategory').textContent = `Category: ${selectedQuote.category}`;
    quoteDisplay.style.opacity = '1';
    
    // Save last viewed quote to session storage
    saveLastViewedQuote(selectedQuote);
}

// Function to create and display the add quote form
function createAddQuoteForm() {
    const formContainer = document.getElementById('addQuoteForm');
    
    // Check if form already exists
    if (formContainer.style.display === 'block') {
        formContainer.style.display = 'none';
        return;
    }
    
    // Create form HTML
    formContainer.innerHTML = `
        <h3>Add New Quote</h3>
        <div class="form-group">
            <label for="newQuoteText">Quote Text:</label>
            <textarea id="newQuoteText" placeholder="Enter your quote here..." required></textarea>
        </div>
        <div class="form-group">
            <label for="newQuoteCategory">Category:</label>
            <input type="text" id="newQuoteCategory" placeholder="Enter category (e.g., motivation, life, inspiration)" required>
        </div>
        <div class="controls">
            <button type="button" onclick="addQuote()">Add Quote</button>
            <button type="button" onclick="cancelAddQuote()">Cancel</button>
        </div>
    `;
    
    // Show the form
    formContainer.style.display = 'block';
}

// Function to add a new quote to the array
function addQuote() {
    const quoteText = document.getElementById('newQuoteText').value.trim();
    const quoteCategory = document.getElementById('newQuoteCategory').value.trim().toLowerCase();
    
    // Validate input
    if (!quoteText || !quoteCategory) {
        alert('Please fill in both the quote text and category.');
        return;
    }
    
    // Create new quote object with sync fields
    const newQuote = {
        id: generateId(),
        text: quoteText,
        category: quoteCategory,
        timestamp: Date.now(),
        synced: false
    };
    
    // Add to quotes array
    quotes.push(newQuote);
    
    // Save to local storage
    saveQuotes();
    
    // Sync with server if online
    if (isOnline) {
        postQuoteToServer(newQuote).then(syncedQuote => {
            // Update the quote with sync status
            const index = quotes.findIndex(q => q.id === newQuote.id);
            if (index !== -1) {
                quotes[index] = syncedQuote;
                saveQuotes();
            }
        });
    }
    
    // Update category dropdown
    populateCategories();
    
    // Clear form and hide it
    document.getElementById('addQuoteForm').style.display = 'none';
    
    // Show success message
    alert('Quote successfully added!');
    
    // Optionally display the new quote
    document.getElementById('categoryFilter').value = quoteCategory;
    showRandomQuote();
}

// Function to cancel adding a quote
function cancelAddQuote() {
    document.getElementById('addQuoteForm').style.display = 'none';
}

// Function to populate categories in the dropdown
function populateCategories() {
    const categorySelect = document.getElementById('categoryFilter');
    const currentValue = categorySelect.value;
    
    // Get unique categories from quotes
    const categories = [...new Set(quotes.map(quote => quote.category))];
    
    // Clear existing options except "All Categories"
    categorySelect.innerHTML = '<option value="all">All Categories</option>';
    
    // Add category options
    categories.forEach(category => {
        const option = document.createElement('option');
        option.value = category;
        option.textContent = category.charAt(0).toUpperCase() + category.slice(1);
        categorySelect.appendChild(option);
    });
    
    // Restore previous selection if it still exists
    if (categories.includes(currentValue)) {
        categorySelect.value = currentValue;
    }
    
    // Update category count
    const filteredQuotes = currentValue === 'all' ? quotes : quotes.filter(q => q.category === currentValue);
    updateCategoryCount(filteredQuotes.length, quotes.length, currentValue);
}

// Function to update category count display
function updateCategoryCount(filteredCount, totalCount, selectedCategory) {
    const countElement = document.getElementById('categoryCount');
    if (countElement) {
        if (selectedCategory === 'all') {
            countElement.textContent = `(${totalCount} total quotes)`;
        } else {
            countElement.textContent = `(${filteredCount} quotes in ${selectedCategory})`;
        }
    }
}

// Function to handle category filter change
function filterQuotes() {
    const selectedCategory = document.getElementById('categoryFilter').value;
    const quoteDisplay = document.getElementById('quoteDisplay');
    
    // Save the selected category to localStorage for persistence
    localStorage.setItem('selectedCategory', selectedCategory);
    
    // Filter quotes based on selected category
    let filteredQuotes = quotes;
    if (selectedCategory !== 'all') {
        filteredQuotes = quotes.filter(quote => quote.category === selectedCategory);
    }
    
    // Update category count display
    updateCategoryCount(filteredQuotes.length, quotes.length, selectedCategory);
    
    // Update the displayed quotes based on the selected category
    if (filteredQuotes.length === 0) {
        document.getElementById('quoteText').textContent = 'No quotes available in this category.';
        document.getElementById('quoteCategory').textContent = '';
        quoteDisplay.style.opacity = '0.7';
    } else {
        // Select and display a random quote from filtered quotes
        const randomIndex = Math.floor(Math.random() * filteredQuotes.length);
        const selectedQuote = filteredQuotes[randomIndex];
        
        document.getElementById('quoteText').textContent = `"${selectedQuote.text}"`;
        document.getElementById('quoteCategory').textContent = `Category: ${selectedQuote.category}`;
        quoteDisplay.style.opacity = '1';
        
        // Save last viewed quote to session storage
        saveLastViewedQuote(selectedQuote);
    }
}

// Initialize the application when the page loads
document.addEventListener('DOMContentLoaded', function() {
    // Load quotes from local storage
    loadQuotes();
    
    // Set up network monitoring
    setupNetworkMonitoring();
    
    // Initial online status check
    isOnline = navigator.onLine;
    updateSyncStatus(isOnline ? 'Checking connection...' : 'Offline', isOnline ? 'syncing' : 'offline');
    
    // Start periodic sync
    startPeriodicSync();
    
    // Populate initial categories
    populateCategories();
    
    // Restore user preferences from local storage
    const savedCategory = getUserPreferences();
    document.getElementById('categoryFilter').value = savedCategory;
    
    // Add event listeners
    document.getElementById('newQuote').addEventListener('click', showRandomQuote);
    document.getElementById('addQuoteBtn').addEventListener('click', createAddQuoteForm);
    document.getElementById('categoryFilter').addEventListener('change', filterQuotes);
    
    // Add sync event listener
    document.getElementById('syncBtn').addEventListener('click', function() {
        showNotification('Manual sync initiated...', 'info');
        syncQuotes();
    });
    
    // Add import/export event listeners
    document.getElementById('exportBtn').addEventListener('click', exportToJsonFile);
    document.getElementById('importBtn').addEventListener('click', function() {
        document.getElementById('importFile').click();
    });
    document.getElementById('importFile').addEventListener('change', importFromJsonFile);
    document.getElementById('clearBtn').addEventListener('click', clearAllData);
    
    // Add sync event listeners
    document.getElementById('syncBtn')?.addEventListener('click', manualSync);
    
    // Display initial quote based on restored category selection
    filterQuotes();
    
    // Start periodic sync if online
    if (isOnline) {
        startPeriodicSync();
        // Initial sync
        setTimeout(() => syncWithServer(), 2000);
    }
});

// JSON Import and Export Functions

// Function to export quotes to JSON file
function exportToJsonFile() {
    const dataStr = JSON.stringify(quotes, null, 2);
    const dataBlob = new Blob([dataStr], { type: 'application/json' });
    
    const link = document.createElement('a');
    link.href = URL.createObjectURL(dataBlob);
    link.download = 'quotes.json';
    link.click();
    
    // Clean up the URL object
    URL.revokeObjectURL(link.href);
    
    alert('Quotes exported successfully!');
}

// Function to import quotes from JSON file
function importFromJsonFile(event) {
    const file = event.target.files[0];
    if (!file) return;
    
    const fileReader = new FileReader();
    fileReader.onload = function(event) {
        try {
            const importedQuotes = JSON.parse(event.target.result);
            
            // Validate imported data
            if (!Array.isArray(importedQuotes)) {
                throw new Error('Invalid file format: Expected an array of quotes');
            }
            
            // Validate each quote object
            for (let quote of importedQuotes) {
                if (!quote.text || !quote.category) {
                    throw new Error('Invalid quote format: Each quote must have text and category');
                }
            }
            
            // Ask user if they want to replace or merge
            const replace = confirm('Do you want to replace existing quotes? Click Cancel to merge with existing quotes.');
            
            if (replace) {
                quotes = [...importedQuotes];
            } else {
                quotes.push(...importedQuotes);
            }
            
            // Save to local storage
            saveQuotes();
            
            // Update UI
            populateCategories();
            showRandomQuote();
            
            alert(`${importedQuotes.length} quotes imported successfully!`);
            
        } catch (error) {
            alert('Error importing quotes: ' + error.message);
        }
        
        // Reset file input
        event.target.value = '';
    };
    
    fileReader.readAsText(file);
}

// Function to clear all data
function clearAllData() {
    if (confirm('Are you sure you want to clear all quotes? This action cannot be undone.')) {
        quotes = [];
        localStorage.removeItem('quotes');
        sessionStorage.clear();
        
        // Reset to default quotes
        quotes = [...defaultQuotes];
        saveQuotes();
        
        // Update UI
        populateCategories();
        document.getElementById('categoryFilter').value = 'all';
        showRandomQuote();
        
        alert('All data cleared and reset to default quotes!');
    }
}

// Advanced Category Management Functions

// Function to get all unique categories
function getAllCategories() {
    return [...new Set(quotes.map(quote => quote.category))].sort();
}

// Function to get quotes by specific category
function getQuotesByCategory(category) {
    if (category === 'all') {
        return quotes;
    }
    return quotes.filter(quote => quote.category === category);
}

// Function to check if a category exists
function categoryExists(category) {
    return quotes.some(quote => quote.category === category);
}

// Function to rename a category (for future enhancement)
function renameCategory(oldCategory, newCategory) {
    quotes.forEach(quote => {
        if (quote.category === oldCategory) {
            quote.category = newCategory;
        }
    });
    saveQuotes();
    populateCategories();
}

// Function to delete all quotes in a category
function deleteCategory(category) {
    if (confirm(`Are you sure you want to delete all quotes in the "${category}" category?`)) {
        quotes = quotes.filter(quote => quote.category !== category);
        saveQuotes();
        populateCategories();
        
        // Reset to "all" if current category was deleted
        const currentCategory = document.getElementById('categoryFilter').value;
        if (currentCategory === category) {
            document.getElementById('categoryFilter').value = 'all';
            showRandomQuote();
        }
        
        alert(`All quotes in "${category}" category have been deleted.`);
    }
}

// Additional utility functions

// Function to export quotes (for potential future use)
function exportQuotes() {
    return JSON.stringify(quotes, null, 2);
}

// Function to import quotes (for potential future use)
function importQuotes(quotesJSON) {
    try {
        const importedQuotes = JSON.parse(quotesJSON);
        if (Array.isArray(importedQuotes)) {
            quotes = importedQuotes;
            saveQuotes();
            populateCategories();
            showRandomQuote();
            return true;
        }
    } catch (e) {
        console.error('Invalid quotes format');
        return false;
    }
}

// Function to get quote statistics
function getQuoteStats() {
    const stats = {};
    quotes.forEach(quote => {
        stats[quote.category] = (stats[quote.category] || 0) + 1;
    });
    return stats;
}

// Function to backup quotes to session storage (for emergency recovery)
function createBackup() {
    sessionStorage.setItem('quotesBackup', JSON.stringify(quotes));
}

// Function to restore from backup
function restoreFromBackup() {
    const backup = sessionStorage.getItem('quotesBackup');
    if (backup) {
        quotes = JSON.parse(backup);
        saveQuotes();
        populateCategories();
        showRandomQuote();
        return true;
    }
    return false;
}

// Server Sync and Conflict Resolution Functions

// Generate unique ID for quotes
function generateId() {
    return Date.now() + Math.random().toString(36).substr(2, 9);
}

// Check online status
function updateOnlineStatus() {
    isOnline = navigator.onLine;
    updateSyncStatus();
}

// Update sync status indicator
function updateSyncStatus() {
    const statusElement = document.getElementById('syncStatus');
    if (statusElement) {
        if (isOnline) {
            statusElement.textContent = 'Online - Auto-sync enabled';
            statusElement.className = 'sync-status online';
        } else {
            statusElement.textContent = 'Offline - Changes will sync when online';
            statusElement.className = 'sync-status offline';
        }
    }
}

// Server Synchronization Functions

// Function to fetch quotes from server using mock API
async function fetchQuotesFromServer() {
    try {
        const response = await fetch('https://jsonplaceholder.typicode.com/posts', {
            method: 'GET',
            headers: {
                'Content-Type': 'application/json'
            },
            timeout: SERVER_CONFIG.timeout
        });
        
        if (!response.ok) {
            throw new Error(`HTTP error! status: ${response.status}`);
        }
        
        const serverData = await response.json();
        
        // Transform server data to quote format
        const serverQuotes = serverData.slice(0, 10).map(post => ({
            id: post.id,
            text: post.title,
            category: post.id % 3 === 0 ? 'inspiration' : post.id % 2 === 0 ? 'motivation' : 'life',
            timestamp: Date.now() - (post.id * 1000),
            synced: true
        }));
        
        updateSyncStatus('✓ Connected', 'success');
        return serverQuotes;
    } catch (error) {
        console.error('Failed to fetch quotes from server:', error);
        updateSyncStatus('✗ Connection failed', 'error');
        return [];
    }
}

// Function to post quote to server using mock API
async function postQuoteToServer(quote) {
    try {
        const response = await fetch('https://jsonplaceholder.typicode.com/posts', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json'
            },
            body: JSON.stringify({
                title: quote.text,
                body: quote.category,
                userId: 1
            }),
            timeout: SERVER_CONFIG.timeout
        });
        
        if (!response.ok) {
            throw new Error(`HTTP error! status: ${response.status}`);
        }
        
        const result = await response.json();
        
        // Mark quote as synced
        quote.synced = true;
        quote.serverId = result.id;
        
        showNotification('Quote synced to server successfully!', 'success');
        return true;
    } catch (error) {
        console.error('Failed to post quote to server:', error);
        showNotification('Failed to sync quote to server', 'error');
        return false;
    }
}

// Main sync function - periodically checks for new quotes from server
async function syncQuotes() {
    if (!isOnline) {
        updateSyncStatus('Offline', 'offline');
        return;
    }
    
    updateSyncStatus('Syncing...', 'syncing');
    
    try {
        // Fetch server quotes
        const serverQuotes = await fetchQuotesFromServer();
        
        if (serverQuotes.length > 0) {
            // Implement conflict resolution and update local storage
            const conflicts = resolveConflicts(serverQuotes);
            
            if (conflicts.length > 0) {
                showNotification(`Resolved ${conflicts.length} conflicts. Server data takes precedence.`, 'warning');
            }
            
            // Update local storage with merged data
            saveQuotes();
            
            // Update UI
            populateCategories();
            filterQuotes();
            
            lastSyncTimestamp = Date.now();
            updateSyncStatus('✓ Synced', 'success');
            showNotification('Data synchronized successfully!', 'success');
        }
        
        // Sync any unsynced local quotes to server
        const unsyncedQuotes = quotes.filter(quote => !quote.synced);
        for (const quote of unsyncedQuotes) {
            await postQuoteToServer(quote);
        }
        
    } catch (error) {
        console.error('Sync failed:', error);
        updateSyncStatus('✗ Sync failed', 'error');
        showNotification('Synchronization failed', 'error');
    }
}

// Conflict resolution function - server data takes precedence
function resolveConflicts(serverQuotes) {
    const conflicts = [];
    
    serverQuotes.forEach(serverQuote => {
        const localQuote = quotes.find(q => q.id === serverQuote.id);
        
        if (localQuote) {
            // Check for conflicts (different content with same ID)
            if (localQuote.text !== serverQuote.text || localQuote.category !== serverQuote.category) {
                conflicts.push({
                    id: serverQuote.id,
                    local: localQuote,
                    server: serverQuote
                });
                
                // Server takes precedence - update local quote
                Object.assign(localQuote, serverQuote);
            }
        } else {
            // New quote from server - add to local quotes
            quotes.push(serverQuote);
        }
    });
    
    return conflicts;
}

// Update sync status UI
function updateSyncStatus(message, status) {
    const syncStatusElement = document.getElementById('syncStatus');
    if (syncStatusElement) {
        syncStatusElement.textContent = message;
        syncStatusElement.className = `sync-status ${status}`;
    }
}

// Show notification to user
function showNotification(message, type = 'info') {
    const notification = document.getElementById('notification');
    if (notification) {
        notification.textContent = message;
        notification.className = `notification ${type} show`;
        
        // Auto-hide after 3 seconds
        setTimeout(() => {
            notification.classList.remove('show');
        }, 3000);
    }
}

// Network status monitoring
function setupNetworkMonitoring() {
    window.addEventListener('online', () => {
        isOnline = true;
        updateSyncStatus('Back online', 'success');
        syncQuotes(); // Sync when back online
    });
    
    window.addEventListener('offline', () => {
        isOnline = false;
        updateSyncStatus('Offline', 'offline');
    });
}

// Start periodic sync
function startPeriodicSync() {
    // Initial sync
    if (isOnline) {
        syncQuotes();
    }
    
    // Set up periodic sync every 30 seconds
    syncInterval = setInterval(() => {
        if (isOnline) {
            syncQuotes();
        }
    }, SERVER_CONFIG.syncInterval);
}

// Stop periodic sync
function stopPeriodicSync() {
    if (syncInterval) {
        clearInterval(syncInterval);
        syncInterval = null;
    }
}

// Manual sync trigger
function manualSync() {
    if (!isOnline) {
        showNotification('Cannot sync while offline', 'error');
        return;
    }
    syncWithServer();
}
